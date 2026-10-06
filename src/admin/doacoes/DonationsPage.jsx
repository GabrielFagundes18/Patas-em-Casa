import { useEffect, useState } from 'react';
import { fetchDonationSummary, listDonations } from './donationService';
import {
  donationMethodLabels,
  donationStatusMap,
  donationTypeLabels,
  formatCurrency,
  formatDate,
  statusOf,
} from '../constants/statusLabels';
import ListState from '../shared/ListState';
import Pagination from '../shared/Pagination';
import SearchField from '../shared/SearchField';
import { usePaginatedList } from '../shared/usePaginatedList';

export default function DonationsPage() {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listDonations,
    'Não foi possível carregar as doações.'
  );
  const [summary, setSummary] = useState(null);
  const hasFilters = ['q', 'status', 'metodo', 'tipo'].some((key) => filters[key]);

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
  }, []);

  return (
    <section aria-labelledby="donations-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="donations-heading">Doações</h2>
          <p>Somente doações confirmadas entram nos totais.</p>
        </div>
      </div>

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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}
    </section>
  );
}
