import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { loginAdmin } from '../../services/adminService';
import '../styles/admin.css';
import './AdminLoginPage.css';

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
      navigate('/admin', { replace: true });
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
    <main className="admin-login-page">
      <div className="admin-login-shell">
      <aside className="admin-login-aside">
        <span aria-hidden="true" className="admin-login-mark"><PawPrint size={26} /></span>
        <p className="admin-login-aside-title">Painel Patas em Casa</p>
        <p>Animais, adoções, doações e voluntários da ONG em um só lugar.</p>
      </aside>
      <section aria-labelledby="admin-login-title" className="admin-login-card">
        <a aria-label="Patas em Casa, página inicial" className="admin-login-brand" href="/">
          <PawPrint aria-hidden="true" size={21} />
          <span>Patas em Casa</span>
        </a>

        <div className="admin-login-heading">
          <p className="admin-login-eyebrow">Área administrativa</p>
          <h1 id="admin-login-title">Acesso do painel</h1>
          <p>Entre com suas credenciais para continuar.</p>
        </div>

        {location.state?.sessaoExpirada && !error ? (
          <p className="admin-alert admin-login-notice" role="status">
            Sua sessão expirou por inatividade. Entre novamente para continuar.
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
      </section>
      </div>
    </main>
  );
}