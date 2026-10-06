import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/adminService';
import AdminAuthShell from './AdminAuthShell';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('patas_admin_token');
  if (token) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = await loginAdmin(form.email, form.password);
      localStorage.setItem('patas_admin_token', payload.token);
      localStorage.setItem('patas_admin_user', JSON.stringify(payload.user));
      // Volta para a página do painel que a pessoa tentou abrir antes do login.
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (requestError) {
      setError(
        !requestError?.response
          ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
          : requestError.response.data?.error?.message
            || requestError.response.data?.message
            || 'Não foi possível entrar no painel.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <AdminAuthShell description="Entre com suas credenciais para continuar." title="Acesso do painel" titleId="admin-login-title">
        {location.state?.sessaoExpirada && !error ? (
          <p className="admin-alert admin-login-notice" role="status">
            Sua sessão expirou por inatividade. Entre novamente para continuar.
          </p>
        ) : null}
        {location.state?.senhaDefinida && !error ? (
          <p className="admin-alert is-success admin-login-notice" role="status">
            Senha definida. Entre com a nova senha.
          </p>
        ) : null}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-login-field" htmlFor="admin-email">
            E-mail
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

          {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

          <button className="admin-button is-primary admin-login-submit" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>
        <Link className="admin-login-link" to="/admin/esqueci-senha">Esqueci minha senha</Link>
    </AdminAuthShell>
  );
}