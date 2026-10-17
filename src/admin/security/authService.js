/*
 * ============================================================================
 * ARQUIVO: authService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções de AUTENTICAÇÃO do painel administrativo: entrar (login), buscar o
 *   usuário logado, sair (logout), pedir o link de "esqueci minha senha" e
 *   definir uma nova senha.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - mapAdminUser(user)               → (interna) padroniza o campo do cargo.
 *   - loginAdmin(email, password)      → faz login e devolve { token, user, ... }.
 *   - fetchAdminMe(token)              → busca os dados do usuário logado.
 *   - logoutAdmin()                    → encerra a sessão no servidor.
 *   - requestPasswordReset(email)      → pede o link de redefinição de senha.
 *   - resetPassword(token, novaSenha)  → define a nova senha com o token do link.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios (com interceptors de sessão).
 *   - Usado por: admin/security/AdminLoginPage.jsx, AdminForgotPasswordPage.jsx,
 *     AdminResetPasswordPage.jsx e admin/AdminDashboardPage.jsx.
 *   - No backend: rotas /api/v1/auth/login, /logout, /forgot-password, /reset-password e /api/v1/me.
 * ============================================================================
 */

// Cliente HTTP configurado do projeto.
import api from 'api/client';

/*
 * FUNÇÃO: mapAdminUser (interna)
 * O que faz: garante que o usuário tenha o campo "role" (cargo), mesmo que a API mande "cargo".
 * Parâmetros: user (objeto, padrão {}) — o usuário vindo da API.
 * Retorno (objeto): cópia do usuário com "role" preenchido.
 * Onde é usada: em loginAdmin e fetchAdminMe.
 */
function mapAdminUser(user = {}) {
  return {
    // Copia todos os campos do usuário.
    ...user,
    // Usa "role" se existir; senão, "cargo" (compatibilidade entre versões da API).
    role: user.role || user.cargo,
  };
}

/*
 * FUNÇÃO: loginAdmin
 * O que faz: envia e-mail e senha para o backend e recebe o token de acesso.
 * Parâmetros:
 *   - email (string), password (string).
 * Retorno (Promise → objeto): os dados da sessão ({ token, user, ... }) com o usuário padronizado.
 *   Se as credenciais estiverem erradas, a Promise é rejeitada (erro 401 do axios).
 * Onde é usada: na tela de login (AdminLoginPage.jsx).
 */
export async function loginAdmin(email, password) {
  // POST com as credenciais. O backend também grava um cookie httpOnly de renovação.
  const response = await api.post('/api/v1/auth/login', { email, password });
  // Dados da sessão.
  const payload = response.data.data;
  // Devolve tudo, trocando "user" pela versão padronizada.
  return { ...payload, user: mapAdminUser(payload.user) };
}

/*
 * FUNÇÃO: fetchAdminMe
 * O que faz: busca os dados do usuário dono do token (nome, cargo, permissões).
 * Parâmetros: token (string) — o token de acesso salvo.
 * Retorno (Promise → objeto): o usuário padronizado. Rejeita (ex.: 401) se o token for inválido.
 * Onde é usada: no AdminDashboardPage.jsx, ao abrir o painel (valida a sessão e carrega as permissões).
 */
export async function fetchAdminMe(token) {
  // GET /api/v1/me com o cabeçalho Authorization explícito (o interceptor respeita quando já existe).
  const response = await api.get('/api/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return mapAdminUser(response.data.data);
}

/*
 * FUNÇÃO: logoutAdmin
 * O que faz: avisa o backend para encerrar a sessão (invalida o cookie de renovação).
 * Parâmetros: nenhum. Retorno: Promise sem valor.
 * Onde é usada: no botão "Sair" do painel (AdminDashboardPage.jsx).
 */
export async function logoutAdmin() {
  await api.post('/api/v1/auth/logout');
}

/*
 * FUNÇÃO: requestPasswordReset
 * O que faz: pede ao backend que envie um e-mail com o link de redefinição de senha.
 * Parâmetros: email (string).
 * Retorno (Promise → objeto): resposta genérica (não diz se o e-mail existe — proteção de privacidade).
 * Onde é usada: AdminForgotPasswordPage.jsx.
 */
// O quê: pede o link de redefinição de senha (a resposta não revela se o e-mail existe).
export async function requestPasswordReset(email) {
  const response = await api.post('/api/v1/auth/forgot-password', { email });
  return response.data.data;
}

/*
 * FUNÇÃO: resetPassword
 * O que faz: define a nova senha usando o token que veio no link do e-mail.
 * Parâmetros: token (string) e novaSenha (string).
 * Retorno (Promise → objeto): confirmação. Rejeita se o token for inválido/expirado
 *   ou se a senha não cumprir a política.
 * Onde é usada: AdminResetPasswordPage.jsx (redefinição e convite de novos membros).
 */
// O quê: define a nova senha com o token do link (redefinição ou convite).
export async function resetPassword(token, novaSenha) {
  // O backend espera o campo "nova_senha" (nome em português, com "_").
  const response = await api.post('/api/v1/auth/reset-password', { token, nova_senha: novaSenha });
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   - Login: loginAdmin → a tela salva o token e o usuário → painel abre.
 *   - Ao abrir o painel: fetchAdminMe confirma a sessão e traz as permissões.
 *   - Sair: logoutAdmin + limpeza da sessão local.
 *   - Esqueci a senha: requestPasswordReset envia o link; resetPassword grava a nova senha.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Autenticação com token (JWT) e cabeçalho Authorization: Bearer.
 *   - Fluxo de redefinição de senha por e-mail com token temporário.
 *   - Não revelar se um e-mail existe (evita "enumeração de usuários").
 *   - Adaptar dados da API (mapAdminUser) e spread de objetos.
 *   - async/await e Promises rejeitadas em erros HTTP.
 * ============================================================================
 */
