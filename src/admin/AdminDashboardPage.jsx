import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { adminSections } from './constants/adminNavigation';
import AnimalsPage from './animals/AnimalsPage';
import AdoptionsPage from './adoptions/AdoptionsPage';
import DashboardOverview from './dashboard/DashboardOverview';
import DonationsPage from './donations/DonationsPage';
import TeamPage from './team/TeamPage';
import VolunteersPage from './volunteers/VolunteersPage';
import AdoptersPage from './adopters/AdoptersPage';
import StoriesPage from './stories/StoriesPage';
import { fetchAdminMe, logoutAdmin } from './security/authService';
import { clearSession, SESSION_EXPIRED_EVENT } from 'api/client';

// Cada aba do menu abre a tela do módulo correspondente, com dados da API.
function renderSection(activeTab, user) {
  switch (activeTab) {
    case 'animais':
      return <AnimalsPage user={user} />;
    case 'adocoes':
      return <AdoptionsPage user={user} />;
    case 'adotantes':
      return <AdoptersPage user={user} />;
    case 'historias':
      return <StoriesPage user={user} />;
    case 'doacoes':
      return <DonationsPage user={user} />;
    case 'voluntarios':
      return <VolunteersPage user={user} />;
    case 'configuracoes':
      return <TeamPage user={user} />;
    default:
      return <DashboardOverview />;
  }
}

export default function AdminDashboardPage({ activeTab = 'dashboard' }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('patas_admin_token');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [retryCount, setRetryCount] = useState(0);
  const section = adminSections[activeTab] || adminSections.dashboard;

  useEffect(() => {
    if (!token) return undefined;

    let active = true;

    async function loadUser() {
      setLoading(true);
      setError('');

      try {
        const result = await fetchAdminMe(token);
        if (active) setUser(result);
      } catch (requestError) {
        const status = requestError?.response?.status;
        if ([401, 404].includes(status)) {
          clearSession();
          navigate('/admin/login', { replace: true });
          return;
        }

        if (active) {
          setError(
            requestError?.response?.data?.error?.message
              || requestError?.response?.data?.message
              || 'Não foi possível validar sua sessão.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [navigate, retryCount, token]);

  // Sessão que não pôde ser renovada (inatividade ou acesso revogado): volta ao login com aviso.
  useEffect(() => {
    function handleExpiredSession() {
      navigate('/admin/login', { replace: true, state: { sessaoExpirada: true } });
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [navigate]);

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // Mesmo sem resposta do servidor, a sessão local é encerrada.
    } finally {
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  }

  if (!token) return <Navigate to="/admin/login" replace />;

  const hasPermission = !section.permission || user?.permissions?.includes(section.permission);

  return (
    <AdminLayout user={user} activeTab={activeTab} onLogout={handleLogout}>
      {loading ? (
        <div aria-live="polite" className="admin-state" role="status">
          <strong>Validando acesso</strong>
          <p>Aguarde enquanto confirmamos sua sessão com o servidor.</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="admin-state is-error" role="alert">
          <strong>Não foi possível carregar o painel</strong>
          <p>{error}</p>
          <button className="admin-button is-primary" onClick={() => setRetryCount((count) => count + 1)} type="button">
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && user && !hasPermission ? (
        <div className="admin-state" role="alert">
          <h2>Acesso sem permissão</h2>
          <p>Seu cargo não permite acessar esta área.</p>
        </div>
      ) : null}

      {!loading && !error && user && hasPermission ? renderSection(activeTab, user) : null}
    </AdminLayout>
  );
}