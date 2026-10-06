import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { createTeamMember, listTeam } from './teamService';
import TeamMemberDialog from './TeamMemberDialog';
import { roleLabels } from '../constants/adminNavigation';
import { formatDate } from '../constants/statusLabels';
import ListState from '../shared/ListState';
import Pagination from '../shared/Pagination';
import SearchField from '../shared/SearchField';
import { usePaginatedList } from '../shared/usePaginatedList';

export default function TeamPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listTeam,
    'Não foi possível carregar a equipe.'
  );
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const canCreate = user?.permissions?.includes('team:create');

  async function addMember(payload) {
    const member = await createTeamMember(payload);
    setFormOpen(false);
    setNotice(`${member.nome} agora faz parte da equipe como ${roleLabels[member.cargo] || member.cargo}. Envie a senha inicial por um canal seguro.`);
    reload();
  }

  return (
    <section aria-labelledby="team-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="team-heading">Equipe e acessos</h2>
          <p>Cada cargo vê somente os módulos permitidos pela matriz de permissões.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button is-primary" onClick={() => { setNotice(''); setFormOpen(true); }} type="button">
              <UserPlus aria-hidden="true" size={18} /> Adicionar membro
            </button>
          </div>
        ) : null}
      </div>

      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}

      <div className="admin-filters">
        <SearchField label="Buscar por nome ou e-mail" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Cargo
          <select onChange={(event) => setFilter('cargo', event.target.value)} value={filters.cargo || ''}>
            <option value="">Todos</option>
            {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText="Altere os filtros para ver outros usuários."
        emptyTitle="Nenhum usuário encontrado"
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
                  <th scope="col">Usuário</th>
                  <th scope="col">Cargo</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Desde</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Usuário">
                      <span className="admin-cell-title">{user.nome}</span>
                      <small>{user.email}</small>
                    </td>
                    <td data-label="Cargo">{roleLabels[user.cargo] || user.cargo}</td>
                    <td data-label="Situação">
                      <span className={`admin-badge is-${user.ativo ? 'success' : 'muted'}`}>{user.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td data-label="Desde">{formatDate(user.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {formOpen ? <TeamMemberDialog onClose={() => setFormOpen(false)} onSubmit={addMember} /> : null}
    </section>
  );
}
