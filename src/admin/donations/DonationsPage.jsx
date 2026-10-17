/*
 * ============================================================================
 * ARQUIVO: DonationsPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Doações" do painel: indicadores (arrecadado no mês, total confirmado,
 *   totais por tipo), lista de doações com busca e filtros, registro/edição de
 *   doações manuais e, no fim, a seção de doações mensais (assinaturas).
 *   Doações online (Mercado Pago) não são editáveis: o Mercado Pago atualiza o status.
 *
 * PRINCIPAIS ITENS:
 *   - DonationsPage({ user }): o componente (exportado como padrão).
 *       Dentro dele: save (cria/edita) e o efeito que carrega o resumo.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, lucide-react.
 *   - ./donationService → createDonation, fetchDonationSummary, listDonations, updateDonation.
 *   - ./DonationFormDialog → formulário de doação manual.
 *   - ./SubscriptionsSection → doações mensais.
 *   - admin/constants/statusLabels e admin/shared (ListState, Pagination, SearchField, usePaginatedList).
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "doacoes").
 *   - Testado em: ./DonationsPage.test.js.
 * ============================================================================
 */

// O quê: tela "Doações": totais, lista com filtros, registro manual e doações mensais (Mercado Pago).
// Como: lista paginada com filtros na URL; doações online não são editáveis (o Mercado Pago atualiza o status).
// Para quê: a equipe enxergar e registrar tudo o que entra para a ONG.
// Hooks do React.
import { useEffect, useState } from 'react';
// Ícones: lápis e mais.
import { Pencil, Plus } from 'lucide-react';
// Funções da API.
import { createDonation, fetchDonationSummary, listDonations, updateDonation } from './donationService';
// Formulário de doação manual.
import DonationFormDialog from './DonationFormDialog';
// Seção de doações mensais.
import SubscriptionsSection from './SubscriptionsSection';
// Rótulos e formatadores.
import {
  donationMethodLabels,
  donationStatusMap,
  donationTypeLabels,
  formatCurrency,
  formatDate,
  statusOf,
} from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { usePaginatedList } from 'admin/shared/usePaginatedList';

/*
 * COMPONENTE: DonationsPage
 * O que faz: mostra o resumo, a lista de doações e as doações mensais; permite registrar/editar.
 * Parâmetros (props): user (objeto) — permissões do usuário.
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function DonationsPage({ user }) {
  // Lista paginada com filtros na URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listDonations,
    'Não foi possível carregar as doações.'
  );
  // Resumo (indicadores) e contador para recarregá-lo.
  const [summary, setSummary] = useState(null);
  const [summaryKey, setSummaryKey] = useState(0);
  // Janela aberta: null (fechada) ou { donation } (null dentro = registro novo).
  const [dialog, setDialog] = useState(null);
  // Aviso de sucesso.
  const [notice, setNotice] = useState('');
  // Permissões.
  const permissions = user?.permissions || [];
  const canCreate = permissions.includes('donations:create');
  const canUpdate = permissions.includes('donations:update');
  // Há filtros ativos?
  const hasFilters = ['q', 'status', 'metodo', 'tipo'].some((key) => filters[key]);

  /*
   * FUNÇÃO INTERNA: save
   * O que faz: cria ou atualiza a doação (conforme a janela), fecha a janela e recarrega lista e resumo.
   * Parâmetros: payload (dados do formulário).
   * Erros sobem para o formulário (que os mostra).
   */
  async function save(payload) {
    if (dialog.donation) await updateDonation(dialog.donation.id, payload);
    else await createDonation(payload);
    setNotice(dialog.donation ? 'Doação atualizada.' : 'Doação registrada.');
    setDialog(null);
    // Recarrega o resumo (soma 1 no contador) e a lista.
    setSummaryKey((key) => key + 1);
    reload();
  }

  // Carrega o resumo (ao abrir e depois de salvar).
  useEffect(() => {
    let active = true;
    fetchDonationSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      // Falha no resumo não impede a lista: simplesmente não mostra os indicadores.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [summaryKey]);

  return (
    <section aria-labelledby="donations-heading" className="admin-page">
      {/* Cabeçalho com o botão de registrar (só com permissão). */}
      <div className="admin-toolbar">
        <div>
          <h2 id="donations-heading">Doações</h2>
          <p>Somente doações confirmadas entram nos totais. As do site são atualizadas pelo Mercado Pago.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            {/* Limpa o aviso e abre a janela vazia (donation: null). */}
            <button className="admin-button is-primary" onClick={() => { setNotice(''); setDialog({ donation: null }); }} type="button">
              <Plus aria-hidden="true" size={18} /> Registrar doação
            </button>
          </div>
        ) : null}
      </div>
      {/* Aviso de sucesso. */}
      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}

      {/* Indicadores (cartões "KPI"). role="group" com aria-label agrupa os cartões. */}
      {summary ? (
        <div aria-label="Resumo das doações" className="admin-kpis" role="group">
          <article className="admin-kpi is-highlight">
            <span>Arrecadado no mês</span>
            <strong>{formatCurrency(summary.arrecadado_mes_atual)}</strong>
            <small>Doações confirmadas</small>
          </article>
          <article className="admin-kpi">
            <span>Total confirmado</span>
            <strong>{formatCurrency(summary.total_confirmado)}</strong>
            <small>Todo o histórico</small>
          </article>
          {/* Um cartão por tipo (única/recorrente). */}
          {summary.por_tipo.map((row) => (
            <article className="admin-kpi" key={row.chave}>
              <span>{donationTypeLabels[row.chave] || row.chave}</span>
              <strong>{formatCurrency(row.total)}</strong>
              <small>{row.quantidade} doações confirmadas</small>
            </article>
          ))}
        </div>
      ) : null}

      {/* Filtros. */}
      <div className="admin-filters">
        <SearchField label="Buscar por doador" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Status
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todos</option>
            {Object.entries(donationStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          Método
          <select onChange={(event) => setFilter('metodo', event.target.value)} value={filters.metodo || ''}>
            <option value="">Todos</option>
            {['pix', 'cartao', 'boleto', 'transferencia'].map((value) => <option key={value} value={value}>{donationMethodLabels[value]}</option>)}
          </select>
        </label>
        <label>
          Tipo
          <select onChange={(event) => setFilter('tipo', event.target.value)} value={filters.tipo || ''}>
            <option value="">Todos</option>
            {Object.entries(donationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outras doações.' : 'As doações registradas aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhuma doação encontrada' : 'Ainda não há doações'}
        error={error}
        loading={loading}
        onRetry={reload}
      />

      {/* Tabela e paginação. */}
      {!loading && !error && items.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Doador</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Método</th>
                  <th scope="col">Status</th>
                  <th scope="col">Valor</th>
                  {/* Coluna de ações só para quem pode editar. */}
                  {canUpdate ? <th scope="col"><span className="admin-visually-hidden">Ações</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((donation) => {
                  const status = statusOf(donationStatusMap, donation.status);
                  return (
                    <tr key={donation.id}>
                      <td data-label="Data">{formatDate(donation.data)}</td>
                      <td data-label="Doador">
                        <span className="admin-cell-title">{donation.doador_nome}</span>
                        <small>{donation.doador_email || 'Sem e-mail'}</small>
                      </td>
                      <td data-label="Tipo">{donationTypeLabels[donation.tipo] || donation.tipo}</td>
                      {/* Sem método → "nao_informado". */}
                      <td data-label="Método">{donationMethodLabels[donation.metodo || 'nao_informado']}</td>
                      <td data-label="Status"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Valor">{formatCurrency(donation.valor)}</td>
                      {canUpdate ? (
                        <td data-label="Ações">
                          {/* Online (tem "gateway"): só um aviso. Manual não cancelada: botão de editar. Cancelada: nada. */}
                          {donation.gateway ? (
                            <small className="admin-field-hint">Online (Mercado Pago)</small>
                          ) : donation.status !== 'cancelada' ? (
                            <button aria-label={`Editar doação de ${donation.doador_nome}`} className="admin-icon-button is-small" onClick={() => { setNotice(''); setDialog({ donation }); }} type="button">
                              <Pencil size={15} />
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {/* Janela de registro/edição. */}
      {dialog ? <DonationFormDialog donation={dialog.donation} onClose={() => setDialog(null)} onSubmit={save} /> : null}

      {/* Doações mensais (cancelar exige a permissão de editar doações). */}
      <SubscriptionsSection canCancel={canUpdate} />
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Carrega a lista (usePaginatedList) e, em paralelo, o resumo (useEffect).
 *   2. Mostra cabeçalho, indicadores, filtros, estados, tabela e paginação.
 *   3. "Registrar doação"/lápis abrem o DonationFormDialog; save cria/edita, recarrega
 *      lista e resumo e mostra o aviso.
 *   4. Abaixo, a SubscriptionsSection lista e cancela doações mensais.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Duas fontes de dados na mesma tela (lista paginada + resumo).
 *   - Contador como "gatilho" para recarregar um useEffect (summaryKey).
 *   - Janela de formulário reutilizada para criar e editar ({ donation: null | objeto }).
 *   - Regras de negócio na interface (online não editável, cancelada não editável).
 *   - Indicadores (KPIs) com formatação de moeda.
 * ============================================================================
 */
