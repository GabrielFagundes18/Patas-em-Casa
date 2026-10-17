/*
 * ============================================================================
 * ARQUIVO: SubscriptionsSection.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Seção "Doações mensais" (dentro da tela de Doações do painel): lista as
 *   assinaturas criadas pelo site no Mercado Pago, com filtro de situação,
 *   paginação própria e o botão para cancelar (que encerra as próximas cobranças).
 *
 * PRINCIPAIS ITENS:
 *   - SubscriptionsSection({ canCancel }): o componente (exportado como padrão).
 *       Dentro dele: load (carrega a página) e cancel (cancela uma assinatura).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useCallback, useEffect, useState).
 *   - ./donationService → cancelSubscription, listSubscriptions.
 *   - admin/constants/statusLabels → formatCurrency, formatDate, statusOf, subscriptionStatusMap.
 *   - admin/shared → ListState, Pagination, errorMessage.
 *   - Quem usa: admin/donations/DonationsPage.jsx.
 * ============================================================================
 */

// O quê: doações mensais (assinaturas do Mercado Pago) no painel.
// Como: lista paginada própria (não usa a URL, para não misturar com os filtros das doações);
//       cancelar avisa o Mercado Pago e encerra as próximas cobranças.
// Para quê: acompanhar quem doa todo mês e atender pedidos de cancelamento.
// Hooks do React.
import { useCallback, useEffect, useState } from 'react';
// Funções da API.
import { cancelSubscription, listSubscriptions } from './donationService';
// Formatadores e rótulos.
import { formatCurrency, formatDate, statusOf, subscriptionStatusMap } from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import { errorMessage } from 'admin/shared/usePaginatedList';

/*
 * COMPONENTE: SubscriptionsSection
 * O que faz: lista as doações mensais e permite cancelar.
 * Parâmetros (props): canCancel (boolean) — mostra a coluna de ações.
 * Retorno: JSX da seção.
 * Onde é usado: DonationsPage.jsx.
 */
export default function SubscriptionsSection({ canCancel }) {
  // Página atual e filtro de situação (estado local, não na URL).
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  // Dados da lista.
  const [data, setData] = useState({ items: [], meta: {} });
  // Carregando / erro / aviso.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  // Carrega a página atual. useCallback recria a função só quando page ou status mudam
  // (assim o useEffect abaixo roda de novo exatamente nessas mudanças).
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 10 por página; o filtro de status só é enviado se escolhido (spread condicional).
      setData(await listSubscriptions({ page: String(page), pageSize: '10', ...(status ? { status } : {}) }));
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar as doações mensais.'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  // Carrega ao abrir e sempre que "load" mudar (página ou filtro).
  useEffect(() => {
    load();
  }, [load]);

  /*
   * FUNÇÃO INTERNA: cancel
   * O que faz: pede confirmação, cancela a assinatura, mostra o aviso e recarrega.
   * Parâmetros: subscription (objeto da linha).
   */
  async function cancel(subscription) {
    // Confirmação do navegador; se a pessoa desistir, para.
    if (!window.confirm(`Cancelar a doação mensal de ${subscription.doador_nome} (${formatCurrency(subscription.valor)})? As próximas cobranças não acontecerão.`)) return;
    setNotice(null);
    try {
      await cancelSubscription(subscription.id);
      setNotice({ variant: 'success', text: `Doação mensal de ${subscription.doador_nome} cancelada.` });
      load();
    } catch (requestError) {
      setNotice({ variant: 'error', text: errorMessage(requestError, 'Não foi possível cancelar a doação mensal.') });
    }
  }

  return (
    <section aria-labelledby="subscriptions-heading" className="admin-page">
      {/* Cabeçalho com o filtro de situação. */}
      <div className="admin-toolbar">
        <div>
          <h2 id="subscriptions-heading">Doações mensais</h2>
          <p>Assinaturas feitas pelo site no Mercado Pago; cada cobrança aparece na lista de doações.</p>
        </div>
        <label className="admin-field">
          Situação
          {/* Ao mudar o filtro, volta para a página 1. */}
          <select className="admin-select" onChange={(event) => { setPage(1); setStatus(event.target.value); }} value={status}>
            <option value="">Todas</option>
            {Object.entries(subscriptionStatusMap).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {/* Aviso após cancelar. */}
      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}
      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && data.items.length === 0}
        emptyText="Quando alguém escolher doar todo mês no site, a doação aparece aqui."
        emptyTitle="Nenhuma doação mensal"
        error={error}
        loading={loading}
        onRetry={load}
      />
      {/* Tabela e paginação. */}
      {!loading && !error && data.items.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Doador</th>
                  <th scope="col">Valor mensal</th>
                  <th scope="col">Arrecadado</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Desde</th>
                  {canCancel ? <th scope="col"><span className="admin-visually-hidden">Ações</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {data.items.map((subscription) => {
                  const subscriptionStatus = statusOf(subscriptionStatusMap, subscription.status);
                  return (
                    <tr key={subscription.id}>
                      <td data-label="Doador">
                        <span className="admin-cell-title">{subscription.doador_nome}</span>
                        <small>{subscription.doador_email}</small>
                      </td>
                      <td data-label="Valor mensal">{formatCurrency(subscription.valor)}</td>
                      {/* Total arrecadado e quantidade de pagamentos (singular/plural). */}
                      <td data-label="Arrecadado">
                        {formatCurrency(subscription.total_arrecadado)} ({subscription.pagamentos_confirmados} {subscription.pagamentos_confirmados === 1 ? 'pagamento' : 'pagamentos'})
                      </td>
                      <td data-label="Situação"><span className={`admin-badge is-${subscriptionStatus.variant}`}>{subscriptionStatus.label}</span></td>
                      <td data-label="Desde">{formatDate(subscription.criado_em)}</td>
                      {canCancel ? (
                        <td data-label="Ações">
                          {/* Só assinaturas não canceladas podem ser canceladas. */}
                          {subscription.status !== 'cancelada' ? (
                            <button className="admin-button is-small is-danger" onClick={() => cancel(subscription)} type="button">Cancelar</button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginação controlada pelo estado local "page". */}
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      ) : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. load busca a página atual (10 por página) com o filtro escolhido.
 *   2. Mudar página ou filtro recria "load" (useCallback), e o useEffect busca de novo.
 *   3. "Cancelar" confirma, chama a API, mostra o aviso e recarrega.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Paginação com estado local (sem URL) e por que isso evita conflito com outra lista.
 *   - useCallback + useEffect([load]) como padrão de "recarregar quando dependências mudam".
 *   - Spread condicional para parâmetros opcionais.
 *   - window.confirm para ações com impacto financeiro.
 *   - Assinaturas recorrentes em gateways de pagamento.
 * ============================================================================
 */
