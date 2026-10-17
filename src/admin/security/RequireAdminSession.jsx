/*
 * ============================================================================
 * ARQUIVO: RequireAdminSession.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   "Porteiro" das rotas do painel (/admin/*). Se não houver token de login salvo
 *   no navegador, manda a pessoa para a tela de login, lembrando qual página ela
 *   queria abrir (para voltar depois do login). Se houver, deixa passar.
 *   ATENÇÃO: isso só esconde a interface; a proteção de verdade está no backend,
 *   que exige um token válido e a permissão certa em cada rota.
 *
 * PRINCIPAIS ITENS:
 *   - readToken(): lê o token salvo (interna).
 *   - RequireAdminSession(): o componente de rota (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react-router-dom → Navigate (redireciona), Outlet (mostra a rota filha), useLocation.
 *   - Usado em: app/App.js, como "rota de layout" em volta das rotas /admin e /admin/<aba>.
 *   - A tela de login (AdminLoginPage.jsx) lê o state.from para voltar à página pedida.
 *   - A chave 'patas_admin_token' é a mesma usada em api/client.js.
 * ============================================================================
 */

// O quê: proteção das rotas /admin/* no navegador.
// Como: sem token salvo, manda para o login guardando a página pedida (state.from) para voltar depois.
// Para quê: ninguém vê a casca do painel sem sessão. A proteção real está na API: cada rota exige
//          token válido e a permissão do cargo; o painel ainda valida a sessão em /me ao abrir.
// Navigate: componente que redireciona. Outlet: lugar onde aparece a rota filha. useLocation: URL atual.
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/*
 * FUNÇÃO: readToken (interna)
 * O que faz: lê o token de login do localStorage, sem quebrar se o armazenamento estiver bloqueado.
 * Retorno: string (token) ou null.
 */
function readToken() {
  try {
    return localStorage.getItem('patas_admin_token');
  } catch {
    return null;
  }
}

/*
 * COMPONENTE: RequireAdminSession
 * O que faz: com token, mostra a rota pedida; sem token, redireciona ao login.
 * Parâmetros: nenhum.
 * Retorno: <Outlet /> (rota filha) ou <Navigate /> (redirecionamento).
 * Onde é usado: App.js.
 */
export default function RequireAdminSession() {
  // Localização atual (pathname = caminho; search = "?...").
  const location = useLocation();
  // Há token? Deixa passar: <Outlet /> desenha a rota filha (ex.: AdminDashboardPage).
  if (readToken()) return <Outlet />;
  // Sem token: vai para /admin/login.
  //   replace → substitui a entrada do histórico (o "voltar" não cai de novo na página protegida);
  //   state.from → guarda a página pedida para voltar a ela depois do login.
  return <Navigate replace state={{ from: `${location.pathname}${location.search}` }} to="/admin/login" />;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A pessoa abre /admin/doacoes.
 *   2. O React Router desenha primeiro o RequireAdminSession (rota de layout).
 *   3. Com token: <Outlet /> mostra o painel. Sem token: redireciona ao login,
 *      guardando "/admin/doacoes" em state.from.
 *   4. Depois do login, a tela de login volta para state.from.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Rotas protegidas no React Router (rota de layout + Outlet + Navigate).
 *   - Passar dados entre rotas com "state".
 *   - Segurança no front-end x no back-end (o front só esconde; o back protege).
 *   - localStorage com try/catch.
 * ============================================================================
 */
