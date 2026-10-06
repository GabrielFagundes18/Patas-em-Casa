// O quê: proteção das rotas /admin/* no navegador.
// Como: sem token salvo, manda para o login guardando a página pedida (state.from) para voltar depois.
// Para quê: ninguém vê a casca do painel sem sessão. A proteção real está na API: cada rota exige
//          token válido e a permissão do cargo; o painel ainda valida a sessão em /me ao abrir.
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function readToken() {
  try {
    return localStorage.getItem('patas_admin_token');
  } catch {
    return null;
  }
}

export default function RequireAdminSession() {
  const location = useLocation();
  if (readToken()) return <Outlet />;
  return <Navigate replace state={{ from: `${location.pathname}${location.search}` }} to="/admin/login" />;
}
