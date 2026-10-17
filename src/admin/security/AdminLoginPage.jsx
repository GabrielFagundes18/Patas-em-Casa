/*
 * ============================================================================
 * ARQUIVO: AdminLoginPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela de LOGIN do painel administrativo (/admin/login). A pessoa da equipe
 *   informa e-mail e senha; se der certo, o token e os dados do usuário são
 *   salvos no navegador e ela vai para o painel (ou para a página que tentou
 *   abrir antes). Também mostra avisos de "sessão expirada" e "senha definida".
 *
 * PRINCIPAIS ITENS:
 *   - AdminLoginPage(): o componente da tela (exportado como padrão).
 *       Dentro dele: handleSubmit (envio) e handleFieldChange (digitação).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), react-router-dom (Link, Navigate, useLocation, useNavigate).
 *   - ./authService.js    → loginAdmin.
 *   - ./AdminAuthShell.jsx → moldura visual das telas de acesso.
 *   - Quem usa: app/App.js (rota /admin/login, carregada sob demanda com lazy).
 *   - Recebe "state" de outras telas: from (RequireAdminSession), sessaoExpirada
 *     (AdminDashboardPage) e senhaDefinida (AdminResetPasswordPage).
 *   - Testado em: ./AdminLoginPage.test.js e app/App.test.js.
 * ============================================================================
 */

// Hook de estado.
import { useState } from 'react';
// Link, Navigate (redireciona ao desenhar), useLocation (URL e state) e useNavigate (navegar pelo código).
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
// Função de login na API.
import { loginAdmin } from './authService';
// Moldura das telas de acesso.
import AdminAuthShell from './AdminAuthShell';

/*
 * COMPONENTE: AdminLoginPage
 * O que faz: mostra o formulário de login e trata o resultado.
 * Parâmetros: nenhum.
 * Retorno: JSX da tela, ou um redirecionamento para /admin se já houver sessão.
 * Onde é usado: App.js, rota /admin/login.
 */
export default function AdminLoginPage() {
  // Função para navegar depois do login.
  const navigate = useNavigate();
  // Localização atual; location.state traz informações enviadas por outras telas.
  const location = useLocation();
  // Valores dos campos.
  const [form, setForm] = useState({ email: '', password: '' });
  // Mensagem de erro ('' = sem erro).
  const [error, setError] = useState('');
  // true enquanto o login está sendo verificado.
  const [loading, setLoading] = useState(false);

  // Se já existe token salvo, não faz sentido mostrar o login: vai direto ao painel.
  const token = localStorage.getItem('patas_admin_token');
  if (token) return <Navigate to="/admin" replace />;

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: envia as credenciais, salva a sessão e redireciona; em erro, mostra a mensagem.
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    // Impede o recarregamento da página.
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pede o login à API.
      const payload = await loginAdmin(form.email, form.password);
      // Salva o token (usado pelo api/client.js em todas as requisições) e o usuário (em texto JSON).
      localStorage.setItem('patas_admin_token', payload.token);
      localStorage.setItem('patas_admin_user', JSON.stringify(payload.user));
      // Volta para a página do painel que a pessoa tentou abrir antes do login.
      // replace: o login não fica no histórico (o "voltar" não retorna para cá).
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (requestError) {
      // Escolhe a mensagem (ternário + "||" encadeados):
      //   sem resposta → problema de conexão;
      //   com resposta → mensagem do backend (em um dos dois formatos) ou um texto padrão.
      setError(
        !requestError?.response
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
          : requestError.response.data?.error?.message
            || requestError.response.data?.message
            || 'Não foi possível entrar no painel.'
      );
    } finally {
      // Sempre: termina o "entrando...".
      setLoading(false);
    }
  }

  /*
   * FUNÇÃO INTERNA: handleFieldChange
   * O que faz: atualiza o campo digitado (pelo atributo "name": email ou password).
   * Parâmetros: event (mudança no input).
   */
  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <AdminAuthShell description="Entre com suas credenciais para continuar." title="Acesso do painel" titleId="admin-login-title">
        {/* Aviso de sessão expirada (enviado pelo painel ao detectar a expiração), se não houver erro. */}
        {location.state?.sessaoExpirada && !error ? (
          <p className="admin-alert admin-login-notice" role="status">
            Sua sessão expirou por inatividade. Entre novamente para continuar.
          </p>
        ) : null}
        {/* Aviso de senha definida (enviado pela tela de redefinição). */}
        {location.state?.senhaDefinida && !error ? (
          <p className="admin-alert is-success admin-login-notice" role="status">
            Senha definida. Entre com a nova senha.
          </p>
        ) : null}

        {/* Formulário de login. */}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          {/* htmlFor liga o rótulo ao campo pelo id. */}
          <label className="admin-login-field" htmlFor="admin-email">
            E-mail
            {/* autoComplete="username": o gerenciador de senhas do navegador reconhece o campo de usuário. */}
            <input
              autoComplete="username"
              id="admin-email"
              name="email"
              onChange={handleFieldChange}
              placeholder="nome@patasemcasa.org"
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="admin-login-field" htmlFor="admin-password">
            Senha
            {/* type="password" esconde o que é digitado; autoComplete="current-password" ajuda o gerenciador de senhas. */}
            <input
              autoComplete="current-password"
              id="admin-password"
              name="password"
              onChange={handleFieldChange}
              placeholder="Sua senha"
              required
              type="password"
              value={form.password}
            />
          </label>

          {/* Mensagem de erro (se houver). */}
          {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

          {/* Botão desabilitado durante a verificação. */}
          <button className="admin-button is-primary admin-login-submit" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>
        {/* Link para recuperar a senha. */}
        <Link className="admin-login-link" to="/admin/esqueci-senha">Esqueci minha senha</Link>
    </AdminAuthShell>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Se já houver token, redireciona direto para /admin.
 *   2. Mostra avisos vindos de outras telas (sessão expirada, senha definida).
 *   3. Ao enviar: loginAdmin → salva token e usuário no localStorage → navega para
 *      a página pedida antes (state.from) ou para /admin.
 *   4. Em erro, mostra a mensagem adequada (conexão, credenciais etc.).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Fluxo de login com token e armazenamento no localStorage.
 *   - <Navigate> x navigate(): redirecionar ao desenhar x pelo código.
 *   - location.state para passar informações entre telas.
 *   - Formulário controlado com handler genérico ([name]: value).
 *   - autocomplete de usuário/senha e acessibilidade (htmlFor, role="alert"/"status").
 *   - try/catch/finally com async/await.
 * ============================================================================
 */
