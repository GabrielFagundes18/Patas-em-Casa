/*
 * ============================================================================
 * ARQUIVO: TeamPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Equipe e acessos" do painel: lista os membros (usuários do painel),
 *   com busca e filtro de cargo, e permite (conforme as permissões) adicionar,
 *   editar, desativar, definir nova senha e (re)enviar o convite por e-mail.
 *
 * PRINCIPAIS ITENS:
 *   - inviteNotice(nome, convite): monta o aviso sobre o envio do convite (interna).
 *   - TeamPage({ user }): o componente (exportado como padrão).
 *       Dentro dele: open, addMember, editMember, resetPassword, resendInvite.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (ícones).
 *   - ./teamService → createTeamMember, listTeam, resetTeamMemberPassword, sendTeamInvite, updateTeamMember.
 *   - ./TeamMemberDialog e ./ResetPasswordDialog → janelas.
 *   - admin/constants/adminNavigation (roleLabels) e statusLabels (formatDate).
 *   - admin/shared → ListState, Pagination, SearchField, usePaginatedList, errorMessage.
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "configuracoes").
 *   - Testado em: ./TeamPage.test.js.
 * ============================================================================
 */

// O quê: tela "Equipe e acessos": membros do painel, cargos e situação do acesso.
// Como: lista paginada com filtros na URL; ações conforme a permissão (team:create / team:update).
// Para quê: adicionar, editar, desativar, redefinir senha e (re)enviar convite.
// Hook de estado.
import { useState } from 'react';
// Ícones: chave, carta, lápis e adicionar pessoa.
import { KeyRound, Mail, Pencil, UserPlus } from 'lucide-react';
// Funções da API.
import { createTeamMember, listTeam, resetTeamMemberPassword, sendTeamInvite, updateTeamMember } from './teamService';
// Janelas.
import TeamMemberDialog from './TeamMemberDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
// Nomes dos cargos e formatação de data.
import { roleLabels } from 'admin/constants/adminNavigation';
import { formatDate } from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

/*
 * FUNÇÃO: inviteNotice (interna)
 * O que faz: transforma o resultado do envio do convite num aviso.
 * Parâmetros: nome (string) e convite ({ enviado, motivo? } | undefined).
 * Retorno: { variant, text } ou null (se não houve convite).
 */
function inviteNotice(nome, convite) {
  // Sem convite (ex.: cadastro com senha inicial): sem aviso específico.
  if (!convite) return null;
  return convite.enviado
    ? { variant: 'success', text: `Convite enviado para ${nome}. O link vale por 72 horas.` }
    : { variant: 'warning', text: `O convite para ${nome} não foi enviado. ${convite.motivo} Use "Nova senha" para definir o acesso.` };
}

/*
 * COMPONENTE: TeamPage
 * O que faz: lista e gerencia os membros da equipe.
 * Parâmetros (props): user (objeto) — permissões.
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function TeamPage({ user }) {
  // Lista paginada com filtros na URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listTeam,
    'Não foi possível carregar a equipe.'
  );
  // Janela aberta: null ou { type: 'create' | 'edit' | 'password', member? }.
  const [dialog, setDialog] = useState(null);
  // Aviso.
  const [notice, setNotice] = useState(null);
  // Permissões.
  const canCreate = user?.permissions?.includes('team:create');
  const canUpdate = user?.permissions?.includes('team:update');

  // Abre uma janela, limpando o aviso anterior.
  function open(next) {
    setNotice(null);
    setDialog(next);
  }

  /*
   * FUNÇÃO INTERNA: addMember
   * O que faz: cadastra o membro e mostra o aviso (do convite ou de sucesso com senha inicial).
   */
  async function addMember(payload) {
    const member = await createTeamMember(payload);
    setDialog(null);
    // "||": se não houver aviso de convite, usa o aviso padrão.
    setNotice(inviteNotice(member.nome, member.convite) || {
      variant: 'success',
      text: `${member.nome} agora faz parte da equipe como ${roleLabels[member.cargo] || member.cargo}. Envie a senha inicial por um canal seguro.`,
    });
    reload();
  }

  /*
   * FUNÇÃO INTERNA: editMember
   * O que faz: salva as alterações de um membro e recarrega.
   */
  async function editMember(member, changes) {
    const updated = await updateTeamMember(member.id, changes);
    setDialog(null);
    setNotice({ variant: 'success', text: `Dados de ${updated.nome} atualizados.` });
    reload();
  }

  /*
   * FUNÇÃO INTERNA: resetPassword
   * O que faz: define a nova senha (as sessões da pessoa são encerradas no backend).
   */
  async function resetPassword(member, senha) {
    await resetTeamMemberPassword(member.id, senha);
    setDialog(null);
    setNotice({ variant: 'success', text: `Nova senha definida para ${member.nome}. As sessões abertas foram encerradas.` });
  }

  /*
   * FUNÇÃO INTERNA: resendInvite
   * O que faz: (re)envia o convite e mostra o resultado (ou o erro).
   */
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
      {/* Cabeçalho com "Adicionar membro" (só com permissão). */}
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

      {/* Aviso (erro → alert; sucesso/atenção → status). */}
      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      {/* Filtros: busca e cargo. */}
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

      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText="Altere os filtros para ver outros usuários."
        emptyTitle="Nenhum usuário encontrado"
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
                          {/* Editar. */}
                          <button aria-label={`Editar ${member.nome}`} className="admin-icon-button is-small" onClick={() => open({ type: 'edit', member })} title="Editar" type="button">
                            <Pencil size={15} />
                          </button>
                          {/* Nova senha. */}
                          <button aria-label={`Nova senha para ${member.nome}`} className="admin-icon-button is-small" onClick={() => open({ type: 'password', member })} title="Nova senha" type="button">
                            <KeyRound size={15} />
                          </button>
                          {/* Reenviar convite (só para membros ativos). */}
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

      {/* Janelas, conforme o tipo guardado em "dialog" ("?." evita erro quando dialog é null). */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. usePaginatedList busca os usuários conforme os filtros da URL.
 *   2. Com permissão, cada linha tem editar, nova senha e reenviar convite.
 *   3. "dialog" guarda qual janela está aberta e para qual membro.
 *   4. As ações chamam a API, fecham a janela, mostram o aviso adequado e recarregam.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Um único estado para controlar várias janelas ({ type, member }).
 *   - Gestão de usuários: convite, senha inicial, redefinição e desativação.
 *   - Avisos com variações (sucesso, atenção, erro) e roles acessíveis.
 *   - Encadeamento opcional (dialog?.type) e "||" para valor padrão.
 * ============================================================================
 */
