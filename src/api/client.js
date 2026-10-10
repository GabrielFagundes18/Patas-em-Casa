// O quê: importa o cliente HTTP usado para acessar o backend.
// Como: axios fornece uma instância configurável com métodos baseados em Promise.
// Para quê: centraliza a comunicação remota utilizada pelos serviços do site e do painel.
import axios from 'axios';

const TOKEN_KEY = 'patas_admin_token';
const USER_KEY = 'patas_admin_user';
const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'];
export const SESSION_EXPIRED_EVENT = 'patas:sessao-expirada';

// O quê: cria um cliente Axios com endereço e cabeçalhos padrão da API.
// Como: withCredentials envia o cookie de renovação (httpOnly) às rotas de autenticação, e
//       X-Requested-With é exigido pelo backend como proteção contra CSRF nessas rotas.
// Para quê: evita repetir configurações de transporte nos módulos consumidores.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeSession({ token, user }) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Sem acesso ao armazenamento local (modo privado restrito): a sessão vale só nesta aba.
  }
}

// O quê: remove a sessão administrativa salva no navegador.
// Como: apaga token e usuário do localStorage, ignorando navegadores que bloqueiam o acesso.
// Para quê: usado no logout e quando a sessão não pode mais ser renovada.
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nada a limpar quando o armazenamento local está indisponível.
  }
}

// O quê: anexa o token da sessão administrativa às requisições.
// Como: lê o token salvo no login e só preenche Authorization quando a chamada não definiu um próprio.
// Para quê: permitir que os serviços do painel acessem rotas protegidas sem repetir o cabeçalho.
api.interceptors.request.use((config) => {
  const token = readToken();

  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// O quê: renova a sessão uma única vez, mesmo com várias requisições falhando ao mesmo tempo.
// Como: compartilha a mesma Promise entre chamadas concorrentes e guarda o novo token.
// Para quê: o token de acesso dura 15 minutos; a renovação mantém o painel aberto enquanto há uso.
let refreshPromise = null;
function refreshSession() {
  refreshPromise ||= api
    .post('/api/v1/auth/refresh')
    .then((response) => {
      storeSession(response.data.data);
      return response.data.data.token;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

// O quê: trata respostas 401 de sessões administrativas.
// Como: tenta renovar uma vez e repete a requisição; se não der, limpa a sessão e avisa a aplicação.
// Para quê: evitar que o usuário perca o trabalho por expiração silenciosa do token.
api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const isAuthCall = AUTH_PATHS.some((path) => original?.url?.startsWith(path));

  if (error.response?.status !== 401 || !original || original.retriedAfterRefresh || isAuthCall || !readToken()) {
    throw error;
  }

  original.retriedAfterRefresh = true;
  let token;
  try {
    token = await refreshSession();
  } catch (refreshError) {
    // Só encerra a sessão quando o servidor recusou a renovação; falha de rede mantém o login.
    if (refreshError?.response?.status === 401) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }

  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});

// O quê: exporta o cliente configurado.
// Como: o export default permite importação direta nos serviços.
// Para quê: mantém o acesso ao backend desacoplado dos componentes visuais.
export default api;
