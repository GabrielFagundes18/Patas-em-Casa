/*
 * ============================================================================
 * ARQUIVO: AdoptersPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Adotantes" do painel: lista as pessoas que já enviaram pedidos de
 *   adoção, com contatos mascarados (LGPD), busca, filtros (situação e UF),
 *   paginação, exportação em CSV (para quem tem permissão) e o botão "Ficha"
 *   que abre os detalhes (AdopterDetailDialog).
 *
 * PRINCIPAIS ITENS:
 *   - BRAZILIAN_STATES: siglas das UFs (filtro).
 *   - AdoptersPage({ user }): o componente (exportado como padrão).
 *       Dentro dele: exportCsv.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (ícones).
 *   - ./adopterService → listAdopters, exportAdoptersCsv.
 *   - ./AdopterDetailDialog → ficha do adotante.
 *   - admin/constants/statusLabels → adopterStatusMap, formatDate, statusOf.
 *   - admin/shared → ListState, Pagination, SearchField, downloadFile, usePaginatedList, errorMessage.
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "adotantes").
 *   - Testado em: ./AdoptersPage.test.js.
 * ============================================================================
 */

// O quê: tela "Adotantes": candidatos que já enviaram pedido, com contatos mascarados (LGPD).
// Como: lista paginada com filtros na URL; detalhe em diálogo; exportação CSV para quem tem adopters:export.
// Para quê: acompanhar quem quer adotar, o histórico de cada pessoa e os pedidos de privacidade.
// Hook de estado.
import { useState } from 'react';
// Ícones: baixar e olho.
import { Download, Eye } from 'lucide-react';
// Funções da API.
import { exportAdoptersCsv, listAdopters } from './adopterService';
// Janela da ficha.
import AdopterDetailDialog from './AdopterDetailDialog';
// Rótulos e formatação.
import { adopterStatusMap, formatDate, statusOf } from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { downloadFile } from 'admin/shared/downloadFile';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

// Siglas das 27 unidades federativas (usadas no filtro "UF").
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

/*
 * COMPONENTE: AdoptersPage
 * O que faz: lista os adotantes com filtros, exportação e acesso à ficha.
 * Parâmetros (props): user (objeto) — usuário logado (permissões).
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function AdoptersPage({ user }) {
  // Lista paginada com filtros na URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listAdopters,
    'Não foi possível carregar os adotantes.'
  );
  // Adotante aberto na ficha (null = fechada).
  const [selectedId, setSelectedId] = useState(null);
  // Erro da exportação.
  const [exportError, setExportError] = useState('');
  // Pode exportar?
  const canExport = user?.permissions?.includes('adopters:export');
  // Há filtros ativos?
  const hasFilters = ['q', 'status', 'estado'].some((key) => filters[key]);

  /*
   * FUNÇÃO INTERNA: exportCsv
   * O que faz: baixa o CSV com os mesmos filtros da tela.
   */
  async function exportCsv() {
    setExportError('');
    try {
      // Monta só com os filtros preenchidos: filtra as chaves com valor e cria pares [chave, valor].
      const params = Object.fromEntries(['q', 'status', 'estado'].filter((key) => filters[key]).map((key) => [key, filters[key]]));
      // Busca o arquivo e baixa com o nome "adotantes-AAAA-MM-DD.csv".
      downloadFile(await exportAdoptersCsv(params), `adotantes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } catch (requestError) {
      setExportError(errorMessage(requestError, 'Não foi possível exportar a lista.'));
    }
  }

  return (
    <section aria-labelledby="adopters-heading" className="admin-page">
      {/* Cabeçalho com o botão de exportar (só com permissão). */}
      <div className="admin-toolbar">
        <div>
          <h2 id="adopters-heading">Adotantes</h2>
          <p>Contatos aparecem mascarados; revelar fica registrado na auditoria.</p>
        </div>
        {canExport ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button" onClick={exportCsv} type="button">
              <Download aria-hidden="true" size={16} /> Exportar CSV
            </button>
          </div>
        ) : null}
      </div>
      {/* Erro da exportação. */}
      {exportError ? <p className="admin-alert is-error" role="alert">{exportError}</p> : null}

      {/* Filtros: busca, situação e UF. */}
      <div className="admin-filters">
        <SearchField label="Buscar por nome, e-mail ou telefone" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Situação
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todas</option>
            {Object.entries(adopterStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          UF
          <select onChange={(event) => setFilter('estado', event.target.value)} value={filters.estado || ''}>
            <option value="">Todas</option>
            {BRAZILIAN_STATES.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </label>
      </div>

      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros adotantes.' : 'Quem enviar um pedido de adoção pelo site aparece aqui.'}
        emptyTitle={hasFilters ? 'Nenhum adotante encontrado' : 'Ainda não há adotantes'}
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
                  <th scope="col">Adotante</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Pedidos</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Cadastro</th>
                  <th scope="col"><span className="admin-visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((adopter) => {
                  const status = statusOf(adopterStatusMap, adopter.status);
                  return (
                    <tr key={adopter.id}>
                      <td data-label="Adotante">
                        <span className="admin-cell-title">{adopter.nome}</span>
                        <small>{[adopter.cidade, adopter.estado].filter(Boolean).join(' / ') || 'Cidade não informada'}</small>
                      </td>
                      {/* Contatos já vêm mascarados da API. */}
                      <td data-label="Contato">
                        <span className="admin-cell-title">{adopter.email}</span>
                        <small>{adopter.telefone || 'Sem telefone'}</small>
                      </td>
                      <td data-label="Pedidos">{adopter.total_pedidos} ({adopter.pedidos_abertos} em andamento)</td>
                      <td data-label="Situação"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Cadastro">{formatDate(adopter.criado_em)}</td>
                      <td data-label="Ações">
                        <button aria-label={`Ver ficha de ${adopter.nome}`} className="admin-button is-small" onClick={() => setSelectedId(adopter.id)} type="button">
                          <Eye aria-hidden="true" size={15} /> Ficha
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {/* Ficha do adotante (recarrega a lista quando algo muda lá dentro). */}
      {selectedId ? <AdopterDetailDialog adopterId={selectedId} onChanged={reload} onClose={() => setSelectedId(null)} user={user} /> : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. usePaginatedList busca os adotantes conforme os filtros da URL.
 *   2. A tela mostra filtros, estados e a tabela (contatos mascarados).
 *   3. "Exportar CSV" (com permissão) baixa a lista com os filtros atuais.
 *   4. "Ficha" abre a AdopterDetailDialog; mudanças lá recarregam a lista.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Reaproveitamento do padrão "lista paginada + filtros na URL + janela de detalhes".
 *   - Exportação de arquivos (Blob + downloadFile) respeitando filtros.
 *   - Permissões na interface (botão de exportar condicional).
 *   - LGPD na interface: mascaramento por padrão.
 *   - Object.fromEntries + filter + map para montar parâmetros.
 * ============================================================================
 */
