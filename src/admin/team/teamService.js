/*
 * ============================================================================
 * ARQUIVO: teamService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do painel para gerenciar a EQUIPE (usuários do painel): listar,
 *   cadastrar, editar (cargo, situação...), redefinir a senha de um membro e
 *   enviar o convite por e-mail para a pessoa criar a própria senha.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listTeam(params)                        → lista paginada de usuários.
 *   - createTeamMember(payload)               → cadastra um membro.
 *   - updateTeamMember(id, changes)           → altera dados.
 *   - resetTeamMemberPassword(id, novaSenha)  → define uma nova senha.
 *   - sendTeamInvite(id)                      → envia o convite por e-mail.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/team/TeamPage.jsx, TeamMemberDialog.jsx e ResetPasswordDialog.jsx.
 *   - No backend: rotas /api/v1/users/... (módulo users).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listTeam
 * O que faz: lista os usuários do painel com filtros e paginação.
 * Parâmetros: params (objeto). Retorno (Promise → { items, meta }).
 */
export async function listTeam(params) {
  const response = await api.get('/api/v1/users', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: createTeamMember
 * O que faz: cadastra um novo membro da equipe.
 * Parâmetros: payload (objeto: nome, email, cargo, senha inicial ou convite...).
 * Retorno (Promise → usuário criado).
 */
export async function createTeamMember(payload) {
  const response = await api.post('/api/v1/users', payload);
  return response.data.data;
}

/*
 * FUNÇÃO: updateTeamMember
 * O que faz: altera um membro (PATCH: só os campos enviados).
 * Parâmetros: id (string) e changes (objeto). Retorno (Promise → usuário atualizado).
 */
export async function updateTeamMember(id, changes) {
  const response = await api.patch(`/api/v1/users/${id}`, changes);
  return response.data.data;
}

/*
 * FUNÇÃO: resetTeamMemberPassword
 * O que faz: define uma nova senha para o membro (feito por um administrador).
 * Parâmetros: id (string) e novaSenha (string). Retorno: Promise sem valor.
 */
export async function resetTeamMemberPassword(id, novaSenha) {
  // O backend espera o campo "nova_senha".
  await api.post(`/api/v1/users/${id}/password`, { nova_senha: novaSenha });
}

/*
 * FUNÇÃO: sendTeamInvite
 * O que faz: envia (ou reenvia) o e-mail de convite com o link para criar a senha.
 * Parâmetros: id (string).
 * Retorno (Promise → { enviado, motivo? }).
 */
// Devolve { enviado, motivo? }: sem SMTP no servidor, o convite não sai e o motivo explica.
export async function sendTeamInvite(id) {
  const response = await api.post(`/api/v1/users/${id}/invite`);
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   A tela "Equipe e acessos" usa estas funções para listar, criar e editar
 *   usuários do painel, redefinir senhas e enviar convites. Todas exigem
 *   permissões de administrador no backend.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Gestão de usuários e controle de acesso (RBAC).
 *   - Convite por e-mail com link de criação de senha.
 *   - SMTP (envio de e-mail pelo servidor) e respostas com "motivo" de falha.
 * ============================================================================
 */
