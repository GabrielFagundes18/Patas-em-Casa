// O quê: doações mensais (assinaturas do Mercado Pago) no painel.
// Como: lista paginada própria (não usa a URL, para não misturar com os filtros das doações);
//       cancelar avisa o Mercado Pago e encerra as próximas cobranças.
// Para quê: acompanhar quem doa todo mês e atender pedidos de cancelamento.
import { useCallback, useEffect, useState } from 'react';
import { cancelSubscription, listSubscriptions } from './donationService';
import { formatCurrency, formatDate, statusOf, subscriptionStatusMap } from '../constants/statusLabels';
import ListState from '../shared/ListState';
import Pagination from '../shared/Pagination';
import { errorMessage } from '../shared/usePaginatedList';

export default function SubscriptionsSection({ canCancel }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [data, setData] = useState({ items: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await listSubscriptions({ page: String(page), pageSize: '10', ...(status ? { status } : {}) }));
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar as doações mensais.'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(subscription) {
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
      <div className="admin-toolbar">
        <div>
          <h2 id="subscriptions-heading">Doações mensais</h2>
          <p>Assinaturas feitas pelo site no Mercado Pago; cada cobrança aparece na lista de doações.</p>
        </div>
        <label className="admin-field">
          Situação
          <select className="admin-select" onChange={(event) => { setPage(1); setStatus(event.target.value); }} value={status}>
            <option value="">Todas</option>
            {Object.entries(subscriptionStatusMap).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}
      <ListState
        empty={!loading && !error && data.items.length === 0}
        emptyText="Quando alguém escolher doar todo mês no site, a doação aparece aqui."
        emptyTitle="Nenhuma doação mensal"
        error={error}
        loading={loading}
        onRetry={load}
      />
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
                      <td data-label="Arrecadado">
                        {formatCurrency(subscription.total_arrecadado)} ({subscription.pagamentos_confirmados} {subscription.pagamentos_confirmados === 1 ? 'pagamento' : 'pagamentos'})
                      </td>
                      <td data-label="Situação"><span className={`admin-badge is-${subscriptionStatus.variant}`}>{subscriptionStatus.label}</span></td>
                      <td data-label="Desde">{formatDate(subscription.criado_em)}</td>
                      {canCancel ? (
                        <td data-label="Ações">
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
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      ) : null}
    </section>
  );
}
