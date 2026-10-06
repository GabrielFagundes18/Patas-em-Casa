import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { createVolunteer, listVolunteers } from './volunteerService';
import VolunteerFormDialog from './VolunteerFormDialog';
import { formatDate, statusOf, volunteerAreaLabels, volunteerStatusMap } from '../constants/statusLabels';
import ListState from '../shared/ListState';
import Pagination from '../shared/Pagination';
import SearchField from '../shared/SearchField';
import { usePaginatedList } from '../shared/usePaginatedList';

export default function VolunteersPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listVolunteers,
    'Não foi possível carregar os voluntários.'
  );
  const hasFilters = ['q', 'status', 'area'].some((key) => filters[key]);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const canCreate = user?.permissions?.includes('volunteers:create');

  async function addVolunteer(payload) {
    const volunteer = await createVolunteer(payload);
    setFormOpen(false);
    setNotice(`${volunteer.nome} agora está na lista de voluntários.`);
    reload();
  }

  return (
    <section aria-labelledby="volunteers-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="volunteers-heading">Voluntários</h2>
          <p>Inscrições feitas pelo site chegam como inativas, aguardando triagem.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button is-primary" onClick={() => { setNotice(''); setFormOpen(true); }} type="button">
              <UserPlus aria-hidden="true" size={18} /> Adicionar voluntário
            </button>
          </div>
        ) : null}
      </div>

      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}

      <div className="admin-filters">
        <SearchField label="Buscar por nome ou e-mail" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Situação
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todas</option>
            {Object.entries(volunteerStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          Área
          <select onChange={(event) => setFilter('area', event.target.value)} value={filters.area || ''}>
            <option value="">Todas</option>
            {Object.entries(volunteerAreaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros voluntários.' : 'Os voluntários cadastrados aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhum voluntário encontrado' : 'Ainda não há voluntários'}
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
                  <th scope="col">Voluntário</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Áreas</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Desde</th>
                </tr>
              </thead>
              <tbody>
                {items.map((volunteer) => {
                  const status = statusOf(volunteerStatusMap, volunteer.status);
                  return (
                    <tr key={volunteer.id}>
                      <td data-label="Voluntário">
                        <span className="admin-cell-title">{volunteer.nome}</span>
                        <small>{volunteer.email}</small>
                      </td>
                      <td data-label="Telefone">{volunteer.telefone || 'Não informado'}</td>
                      <td data-label="Áreas">{volunteer.areas.map((area) => volunteerAreaLabels[area] || area).join(', ') || 'Nenhuma'}</td>
                      <td data-label="Situação"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Desde">{formatDate(volunteer.data_inicio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {formOpen ? <VolunteerFormDialog onClose={() => setFormOpen(false)} onSubmit={addVolunteer} /> : null}
    </section>
  );
}
