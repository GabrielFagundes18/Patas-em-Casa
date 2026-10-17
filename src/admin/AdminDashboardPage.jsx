/*
 * ============================================================================
 * ARQUIVO: AdminDashboardPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a PÁGINA PRINCIPAL do painel administrativo (/admin e /admin/<aba>). Ela:
 *     - confere a sessão no backend (busca o usuário logado em /me);
 *     - desenha a moldura do painel (menu lateral, topo) com o AdminLayout;
 *     - verifica se o cargo do usuário tem permissão para a aba aberta;
 *     - mostra a tela da aba (Animais, Adoções, Doações...);
 *     - trata o logout e a sessão expirada.
 *
 * PRINCIPAIS ITENS:
 *   - renderSection(activeTab, user): escolhe o componente da aba (interna).
 *   - AdminDashboardPage({ activeTab }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState), react-router-dom (Navigate, useNavigate).
 *   - ./layout/AdminLayout                → moldura do painel.
 *   - ./constants/adminNavigation         → adminSections (título e permissão de cada aba).
 *   - Telas das abas: animals/AnimalsPage, adoptions/AdoptionsPage, dashboard/DashboardOverview,
 *     donations/DonationsPage, team/TeamPage, volunteers/VolunteersPage, adopters/AdoptersPage,
 *     stories/StoriesPage.
 *   - ./security/authService              → fetchAdminMe e logoutAdmin.
 *   - api/client                          → clearSession e SESSION_EXPIRED_EVENT.
 *   - Quem usa: app/App.js (rotas protegidas pelo RequireAdminSession).
 * ============================================================================
 */

// Hooks do React.
import { useEffect, useState } from 'react';
// Navigate (redirecionar ao desenhar) e useNavigate (navegar pelo código).
import { Navigate, useNavigate } from 'react-router-dom';
// Moldura do painel (menu e topo).
import AdminLayout from './layout/AdminLayout';
// Dados das seções do menu (título, descrição, permissão).
import { adminSections } from './constants/adminNavigation';
// Telas de cada aba.
import AnimalsPage from './animals/AnimalsPage';
import AdoptionsPage from './adoptions/AdoptionsPage';
import DashboardOverview from './dashboard/DashboardOverview';
import DonationsPage from './donations/DonationsPage';
import TeamPage from './team/TeamPage';
import VolunteersPage from './volunteers/VolunteersPage';
import AdoptersPage from './adopters/AdoptersPage';
import StoriesPage from './stories/StoriesPage';
// Funções de sessão do painel.
import { fetchAdminMe, logoutAdmin } from './security/authService';
// Limpar a sessão local e o nome do evento de "sessão expirada".
import { clearSession, SESSION_EXPIRED_EVENT } from 'api/client';

/*
 * FUNÇÃO: renderSection (interna)
 * O que faz: devolve a tela correspondente à aba ativa.
 * Parâmetros:
 *   - activeTab (string): chave da aba (ex.: 'animais').
 *   - user (objeto): usuário logado (as telas usam user.permissions para mostrar botões).
 * Retorno: JSX da tela da aba (a visão geral é o padrão).
 * Onde é usada: no final do JSX do AdminDashboardPage.
 */
// Cada aba do menu abre a tela do módulo correspondente, com dados da API.
function renderSection(activeTab, user) {
  // "switch" compara activeTab com cada "case"; o "default" vale quando nenhum combina.
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

/*
 * COMPONENTE: AdminDashboardPage
 * O que faz: valida a sessão, desenha a moldura do painel e a tela da aba, respeitando permissões.
 * Parâmetros (props):
 *   - activeTab (string, padrão 'dashboard'): aba aberta (definida pela rota no App.js).
 * Retorno: JSX do painel, ou redirecionamento ao login se não houver token.
 * Onde é usado: App.js, rotas /admin e /admin/<aba>.
 */
export default function AdminDashboardPage({ activeTab = 'dashboard' }) {
  // Navegação pelo código.
  const navigate = useNavigate();
  // Token salvo no navegador.
  const token = localStorage.getItem('patas_admin_token');
  // Usuário logado (com permissões), carregado do backend.
  const [user, setUser] = useState(null);
  // Mensagem de erro ao validar a sessão.
  const [error, setError] = useState('');
  // Carregando? Começa true só se houver token (Boolean converte o texto em true/false).
  const [loading, setLoading] = useState(Boolean(token));
  // Contador para "Tentar novamente".
  const [retryCount, setRetryCount] = useState(0);
  // Dados da seção atual (se a aba for desconhecida, usa a visão geral).
  const section = adminSections[activeTab] || adminSections.dashboard;

  // Valida a sessão no backend (ao abrir, ao tentar de novo ou se o token mudar).
  useEffect(() => {
    // Sem token, nada a fazer (o JSX abaixo redireciona).
    if (!token) return undefined;

    // Trava contra atualizações depois de sair da tela.
    let active = true;

    /*
     * FUNÇÃO INTERNA: loadUser
     * O que faz: busca o usuário logado; trata sessão inválida e outros erros.
     */
    async function loadUser() {
      setLoading(true);
      setError('');

      try {
        const result = await fetchAdminMe(token);
        if (active) setUser(result);
      } catch (requestError) {
        const status = requestError?.response?.status;
        // 401 (token inválido) ou 404 (usuário não existe mais): limpa a sessão e vai ao login.
        if ([401, 404].includes(status)) {
          clearSession();
          navigate('/admin/login', { replace: true });
          return;
        }

        // Outros erros (ex.: servidor fora): mostra a mensagem com opção de tentar de novo.
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
    // Limpeza.
    return () => {
      active = false;
    };
  }, [navigate, retryCount, token]);

  // Sessão que não pôde ser renovada (inatividade ou acesso revogado): volta ao login com aviso.
  // O api/client.js dispara o evento SESSION_EXPIRED_EVENT; aqui nós o "escutamos".
  useEffect(() => {
    function handleExpiredSession() {
      // state.sessaoExpirada faz a tela de login mostrar o aviso.
      navigate('/admin/login', { replace: true, state: { sessaoExpirada: true } });
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
    // Limpeza: para de escutar.
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [navigate]);

  /*
   * FUNÇÃO INTERNA: handleLogout
   * O que faz: encerra a sessão no servidor (se possível), limpa a sessão local e vai ao login.
   */
  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // Mesmo sem resposta do servidor, a sessão local é encerrada.
    } finally {
      // "finally" garante a limpeza e o redirecionamento em qualquer caso.
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  }

  // Sem token: redireciona ao login (os hooks acima já foram chamados, respeitando as regras dos hooks).
  if (!token) return <Navigate to="/admin/login" replace />;

  // Tem permissão para a aba? Seções sem "permission" (ex.: visão geral) são liberadas.
  const hasPermission = !section.permission || user?.permissions?.includes(section.permission);

  return (
    // Moldura do painel com o usuário (para o menu filtrar por permissão), a aba ativa e o logout.
    <AdminLayout user={user} activeTab={activeTab} onLogout={handleLogout}>
      {/* Validando a sessão. */}
      {loading ? (
        <div aria-live="polite" className="admin-state" role="status">
          <strong>Validando acesso</strong>
          <p>Aguarde enquanto confirmamos sua sessão com o servidor.</p>
        </div>
      ) : null}

      {/* Erro ao validar (com "Tentar novamente"). */}
      {!loading && error ? (
        <div className="admin-state is-error" role="alert">
          <strong>Não foi possível carregar o painel</strong>
          <p>{error}</p>
          <button className="admin-button is-primary" onClick={() => setRetryCount((count) => count + 1)} type="button">
            Tentar novamente
          </button>
        </div>
      ) : null}

      {/* Usuário sem permissão para esta aba (ex.: abriu o endereço direto). */}
      {!loading && !error && user && !hasPermission ? (
        <div className="admin-state" role="alert">
          <h2>Acesso sem permissão</h2>
          <p>Seu cargo não permite acessar esta área.</p>
        </div>
      ) : null}

      {/* Tudo certo: mostra a tela da aba. */}
      {!loading && !error && user && hasPermission ? renderSection(activeTab, user) : null}
    </AdminLayout>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A rota /admin/<aba> desenha esta página com activeTab.
 *   2. Sem token → login. Com token → busca o usuário em /me ("Validando acesso").
 *   3. 401/404 → limpa a sessão e vai ao login; outros erros → mensagem + tentar de novo.
 *   4. Com o usuário carregado, confere a permissão da aba:
 *        sem permissão → "Acesso sem permissão"; com permissão → tela da aba.
 *   5. O evento de sessão expirada leva ao login com aviso; "Sair" faz logout e limpa a sessão.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Controle de acesso por permissões no front-end (o backend também valida).
 *   - switch/case para escolher componentes.
 *   - Validação de sessão ao abrir (endpoint /me) e tratamento de 401/404.
 *   - Eventos personalizados (window.addEventListener) para comunicação entre partes do app.
 *   - Regras dos hooks (não chamá-los depois de um return condicional).
 *   - try/catch/finally e Array.includes para checar vários códigos.
 * ============================================================================
 */
