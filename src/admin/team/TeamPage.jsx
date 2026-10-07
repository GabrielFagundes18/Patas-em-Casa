// O quê: tela "Equipe e acessos": membros do painel, cargos e situação do acesso.
// Como: lista paginada com filtros na URL; ações conforme a permissão (team:create / team:update).
// Para quê: adicionar, editar, desativar, redefinir senha e (re)enviar convite.
import { useState } from 'react';
import { KeyRound, Mail, Pencil, UserPlus } from 'lucide-react';
import { createTeamMember, listTeam, resetTeamMemberPassword, sendTeamInvite, updateTeamMember } from './teamService';
import TeamMemberDialog from './TeamMemberDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import { roleLabels } from 'admin/constants/adminNavigation';
import { formatDate } from 'admin/constants/statusLabels';
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

function inviteNotice(nome, convite) {
  if (!convite) return null;
  return convite.enviado
    ? { variant: 'success', text: `Convite enviado para ${nome}. O link vale por 72 horas.` }
    : { variant: 'warning', text: `O convite para ${nome} não foi enviado. ${convite.motivo} Use "Nova senha" para definir o acesso.` };
}

export default function TeamPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listTeam,
    'Não foi possível carregar a equipe.'
  );
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const canCreate = user?.permissions?.includes('team:create');
  const canUpdate = user?.permissions?.includes('team:update');

  function open(next) {
    setNotice(null);
    setDialog(next);
  }

  async function addMember(payload) {
    const member = await createTeamMember(payload);
    setDialog(null);
    setNotice(inviteNotice(member.nome, member.convite) || {
      variant: 'success',
      text: `${member.nome} agora faz parte da equipe como ${roleLabels[member.cargo] || member.cargo}. Envie a senha inicial por um canal seguro.`,
    });
    reload();
  }

  async function editMember(member, changes) {
    const updated = await updateTeamMember(member.id, changes);
    setDialog(null);
    setNotice({ variant: 'success', text: `Dados de ${updated.nome} atualizados.` });
    reload();
  }

  async function resetPassword(member, senha) {
    await resetTeamMemberPassword(member.id, senha);
    setDialog(null);
    setNotice({ variant: 'success', text: `Nova senha definida para ${member.nome}. As sessões abertas foram encerradas.` });
  }

  async function resendInvite(member) {
    setNotice(null);
    try {
      setNotice(inviteNotice(member.nome, await sendTeamInvite(member.id)));
    } catch (requestError) {
      setNotice({ variant: 'error', text: errorMessage(requestError, 'Não foi possível enviar o convite.') });
    }
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
            <button className="admin-button is-primary" onClick={() => open({ type: 'create' })} type="button">
              <UserPlus aria-hidden="true" size={18} /> Adicionar membro
            </button>
          </div>
        ) : null}
      </div>

      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

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
                  {canUpdate ? <th scope="col"><span className="admin-visually-hidden">Ações</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((member) => (
                  <tr key={member.id}>
                    <td data-label="Usuário">
                      <span className="admin-cell-title">{member.nome}</span>
                      <small>{member.email}</small>
                    </td>
                    <td data-label="Cargo">{roleLabels[member.cargo] || member.cargo}</td>
                    <td data-label="Situação">
                      <span className={`admin-badge is-${member.ativo ? 'success' : 'muted'}`}>{member.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td data-label="Desde">{formatDate(member.criado_em)}</td>
                    {canUpdate ? (
                      <td data-label="Ações">
                        <div className="admin-row-actions">
                          <button aria-label={`Editar ${member.nome}`} className="admin-icon-button is-small" onClick={() => open({ type: 'edit', member })} title="Editar" type="button">
                            <Pencil size={15} />
                          </button>
                          <button aria-label={`Nova senha para ${member.nome}`} className="admin-icon-button is-small" onClick={() => open({ type: 'password', member })} title="Nova senha" type="button">
                            <KeyRound size={15} />
                          </button>
                          {member.ativo ? (
                            <button aria-label={`Enviar convite para ${member.nome}`} className="admin-icon-button is-small" onClick={() => resendInvite(member)} title="Enviar convite / link de acesso" type="button">
                              <Mail size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {dialog?.type === 'create' ? <TeamMemberDialog onClose={() => setDialog(null)} onSubmit={addMember} /> : null}
      {dialog?.type === 'edit' ? (
        <TeamMemberDialog member={dialog.member} onClose={() => setDialog(null)} onSubmit={(changes) => editMember(dialog.member, changes)} />
      ) : null}
      {dialog?.type === 'password' ? (
        <ResetPasswordDialog member={dialog.member} onClose={() => setDialog(null)} onSubmit={(senha) => resetPassword(dialog.member, senha)} />
      ) : null}
    </section>
  );
}
