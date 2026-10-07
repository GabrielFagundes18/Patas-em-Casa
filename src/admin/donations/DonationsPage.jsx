// O quê: tela "Doações": totais, lista com filtros, registro manual e doações mensais (Mercado Pago).
// Como: lista paginada com filtros na URL; doações online não são editáveis (o Mercado Pago atualiza o status).
// Para quê: a equipe enxergar e registrar tudo o que entra para a ONG.
import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { createDonation, fetchDonationSummary, listDonations, updateDonation } from './donationService';
import DonationFormDialog from './DonationFormDialog';
import SubscriptionsSection from './SubscriptionsSection';
import {
  donationMethodLabels,
  donationStatusMap,
  donationTypeLabels,
  formatCurrency,
  formatDate,
  statusOf,
} from 'admin/constants/statusLabels';
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { usePaginatedList } from 'admin/shared/usePaginatedList';

export default function DonationsPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listDonations,
    'Não foi possível carregar as doações.'
  );
  const [summary, setSummary] = useState(null);
  const [summaryKey, setSummaryKey] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const permissions = user?.permissions || [];
  const canCreate = permissions.includes('donations:create');
  const canUpdate = permissions.includes('donations:update');
  const hasFilters = ['q', 'status', 'metodo', 'tipo'].some((key) => filters[key]);

  async function save(payload) {
    if (dialog.donation) await updateDonation(dialog.donation.id, payload);
    else await createDonation(payload);
    setNotice(dialog.donation ? 'Doação atualizada.' : 'Doação registrada.');
    setDialog(null);
    setSummaryKey((key) => key + 1);
    reload();
  }

  useEffect(() => {
    let active = true;
    fetchDonationSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [summaryKey]);

  return (
    <section aria-labelledby="donations-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="donations-heading">Doações</h2>
          <p>Somente doações confirmadas entram nos totais. As do site são atualizadas pelo Mercado Pago.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button is-primary" onClick={() => { setNotice(''); setDialog({ donation: null }); }} type="button">
              <Plus aria-hidden="true" size={18} /> Registrar doação
            </button>
          </div>
        ) : null}
      </div>
      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}

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
          {summary.por_tipo.map((row) => (
            <article className="admin-kpi" key={row.chave}>
              <span>{donationTypeLabels[row.chave] || row.chave}</span>
              <strong>{formatCurrency(row.total)}</strong>
              <small>{row.quantidade} doações confirmadas</small>
            </article>
          ))}
        </div>
      ) : null}

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

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outras doações.' : 'As doações registradas aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhuma doação encontrada' : 'Ainda não há doações'}
        error={error}
        loading={loading}
        onRetry={reload}
      />

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
                      <td data-label="Método">{donationMethodLabels[donation.metodo || 'nao_informado']}</td>
                      <td data-label="Status"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Valor">{formatCurrency(donation.valor)}</td>
                      {canUpdate ? (
                        <td data-label="Ações">
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

      {dialog ? <DonationFormDialog donation={dialog.donation} onClose={() => setDialog(null)} onSubmit={save} /> : null}

      <SubscriptionsSection canCancel={canUpdate} />
    </section>
  );
}
