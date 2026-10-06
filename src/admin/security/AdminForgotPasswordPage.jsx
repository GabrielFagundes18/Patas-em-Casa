// O quê: "Esqueci minha senha" do painel.
// Como: envia o e-mail para a API, que manda um link de uso único (1 hora) se a conta existir e estiver ativa.
// Para quê: recuperar o acesso sem depender do administrador. A resposta é sempre a mesma (não revela contas).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/adminService';
import AdminAuthShell from './AdminAuthShell';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle' });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ status: 'sending' });
    try {
      const result = await requestPasswordReset(email.trim());
      setState({ status: 'sent', message: result.mensagem });
    } catch (error) {
      setState({
        status: 'error',
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
          {state.status === 'error' ? <p className="admin-alert is-error" role="alert">{state.message}</p> : null}
          <button className="admin-button is-primary admin-login-submit" disabled={state.status === 'sending'} type="submit">
            {state.status === 'sending' ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
      )}
      <Link className="admin-login-link" to="/admin/login">Voltar para o login</Link>
    </AdminAuthShell>
  );
}
