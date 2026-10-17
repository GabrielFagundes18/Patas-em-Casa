/*
 * ============================================================================
 * ARQUIVO: AdminForgotPasswordPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Esqueci minha senha" do painel (/admin/esqueci-senha). A pessoa informa
 *   o e-mail e o backend envia um link de uso único (válido por 1 hora) para criar
 *   uma nova senha — se a conta existir e estiver ativa. A resposta é sempre a
 *   mesma, para não revelar quais e-mails têm conta.
 *
 * PRINCIPAIS ITENS:
 *   - AdminForgotPasswordPage(): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), react-router-dom (Link).
 *   - ./authService.js     → requestPasswordReset.
 *   - ./AdminAuthShell.jsx → moldura visual.
 *   - Quem usa: app/App.js (rota /admin/esqueci-senha); link na tela de login.
 *   - Testado em: ./AdminPasswordPages.test.js.
 * ============================================================================
 */

// O quê: "Esqueci minha senha" do painel.
// Como: envia o e-mail para a API, que manda um link de uso único (1 hora) se a conta existir e estiver ativa.
// Para quê: recuperar o acesso sem depender do administrador. A resposta é sempre a mesma (não revela contas).
// Hook de estado.
import { useState } from 'react';
// Link para voltar ao login.
import { Link } from 'react-router-dom';
// Pede o link de redefinição.
import { requestPasswordReset } from './authService';
// Moldura das telas de acesso.
import AdminAuthShell from './AdminAuthShell';

/*
 * COMPONENTE: AdminForgotPasswordPage
 * O que faz: mostra o formulário de e-mail e, após o envio, a mensagem de confirmação.
 * Parâmetros: nenhum.
 * Retorno: JSX da tela.
 * Onde é usado: App.js, rota /admin/esqueci-senha.
 */
export default function AdminForgotPasswordPage() {
  // E-mail digitado.
  const [email, setEmail] = useState('');
  // Estado da tela: 'idle', 'sending', 'sent' ou 'error' (+ mensagem).
  const [state, setState] = useState({ status: 'idle' });

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: pede o link à API e mostra a resposta (ou o erro).
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setState({ status: 'sending' });
    try {
      const result = await requestPasswordReset(email.trim());
      // Mostra a mensagem do backend (sempre genérica).
      setState({ status: 'sent', message: result.mensagem });
    } catch (error) {
      setState({
        status: 'error',
        // Sem resposta → conexão; com resposta → mensagem do backend ou padrão.
        message: !error?.response
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
          : error.response.data?.error?.message || 'Não foi possível enviar o link agora.',
      });
    }
  }

  return (
    <AdminAuthShell
      description="Informe o e-mail de acesso. Enviaremos um link para você criar uma nova senha."
      title="Esqueci minha senha"
      titleId="admin-forgot-title"
    >
      {/* Depois de enviado: só a confirmação. Antes: o formulário. */}
      {state.status === 'sent' ? (
        <p className="admin-alert is-success" role="status">{state.message}</p>
      ) : (
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-login-field" htmlFor="admin-forgot-email">
            E-mail
            <input
              autoComplete="username"
              id="admin-forgot-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@patasemcasa.org"
              required
              type="email"
              value={email}
            />
          </label>
          {/* Erro (se houver). */}
          {state.status === 'error' ? <p className="admin-alert is-error" role="alert">{state.message}</p> : null}
          {/* Botão desabilitado durante o envio. */}
          <button className="admin-button is-primary admin-login-submit" disabled={state.status === 'sending'} type="submit">
            {state.status === 'sending' ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
      )}
      {/* Sempre: link para voltar ao login. */}
      <Link className="admin-login-link" to="/admin/login">Voltar para o login</Link>
    </AdminAuthShell>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A pessoa digita o e-mail → requestPasswordReset → a tela mostra a mensagem
 *   genérica ("se a conta existir, enviaremos o link"). O link do e-mail leva a
 *   /admin/redefinir-senha?token=..., tratado pela AdminResetPasswordPage.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Recuperação de senha com token de uso único e prazo de validade.
 *   - Respostas genéricas para evitar enumeração de usuários (segurança).
 *   - Máquina de estados simples (idle/sending/sent/error).
 *   - Formulário controlado com um campo.
 * ============================================================================
 */
