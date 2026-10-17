/*
 * ============================================================================
 * ARQUIVO: client.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Cria e configura o "cliente HTTP" (uma instância do axios) que TODO o
 *   front-end usa para conversar com o backend. Além disso, cuida da sessão de
 *   login do painel administrativo:
 *     - guarda/lê/apaga o token de acesso no localStorage;
 *     - coloca o token automaticamente em cada requisição;
 *     - quando o token expira (resposta 401), tenta renová-lo sozinho e repete
 *       a requisição; se não conseguir, encerra a sessão e avisa a aplicação.
 *
 * PRINCIPAIS ITENS:
 *   - api                    → instância do axios (exportada como padrão).
 *   - SESSION_EXPIRED_EVENT  → nome do evento disparado quando a sessão acaba (exportado).
 *   - clearSession()         → apaga a sessão salva (exportada).
 *   - readToken()            → lê o token salvo (interna).
 *   - storeSession()         → salva token e usuário (interna).
 *   - refreshSession()       → renova o token no backend (interna).
 *   - Dois "interceptors" (de requisição e de resposta).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - axios (biblioteca externa de requisições HTTP).
 *   - .env → variável REACT_APP_API_URL (endereço do backend).
 *   - Usado por: api/animals.js, api/content.js, api/adoptions.js, api/donations.js,
 *     api/volunteers.js e por todos os "services" do painel (admin/**​/…Service.js).
 *   - admin/AdminDashboardPage.jsx e outros usam clearSession e SESSION_EXPIRED_EVENT.
 *   - No backend, conversa com as rotas /api/v1/auth/login, /refresh e /logout.
 * ============================================================================
 */

// O quê: importa o cliente HTTP usado para acessar o backend.
// Como: axios fornece uma instância configurável com métodos baseados em Promise.
// Para quê: centraliza a comunicação remota utilizada pelos serviços do site e do painel.
import axios from 'axios';

// Nome da "chave" usada para guardar o token de acesso no localStorage do navegador.
const TOKEN_KEY = 'patas_admin_token';
// Nome da chave usada para guardar os dados do usuário logado (em texto JSON).
const USER_KEY = 'patas_admin_user';
// Rotas de autenticação. Erros 401 nelas NÃO devem disparar a renovação automática
// (senão poderíamos entrar em um ciclo infinito de tentativas).
const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'];
// Nome de um evento personalizado do navegador, avisando que a sessão expirou.
// É exportado para que outras partes do app possam "escutar" esse evento.
export const SESSION_EXPIRED_EVENT = 'patas:sessao-expirada';

// O quê: cria um cliente Axios com endereço e cabeçalhos padrão da API.
// Como: withCredentials envia o cookie de renovação (httpOnly) às rotas de autenticação, e
//       X-Requested-With é exigido pelo backend como proteção contra CSRF nessas rotas.
// Para quê: evita repetir configurações de transporte nos módulos consumidores.
// axios.create cria uma instância própria com configurações padrão.
const api = axios.create({
  // baseURL é o começo de todas as URLs. Assim, api.get('/api/v1/animals') vira
  // "http://localhost:4000/api/v1/animals". Se a variável do .env não existir, usa o padrão local.
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  // withCredentials: true faz o navegador enviar e receber cookies em requisições para outro domínio.
  withCredentials: true,
  // Cabeçalhos enviados em todas as requisições.
  headers: {
    // Indica que o corpo das requisições vai em JSON.
    'Content-Type': 'application/json',
    // Cabeçalho "marcador" usado pelo backend como proteção contra CSRF.
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/*
 * FUNÇÃO: readToken (interna)
 * O que faz: lê o token de acesso salvo no navegador.
 * Parâmetros: nenhum.
 * Retorno: string com o token, ou null se não existir ou se o localStorage estiver bloqueado.
 * Onde é usada: no interceptor de requisição e no de resposta, logo abaixo.
 */
function readToken() {
  // try/catch: alguns navegadores (ex.: modo privado restrito) lançam erro ao acessar o localStorage.
  try {
    // localStorage.getItem devolve o valor guardado ou null.
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // "catch" sem variável (sintaxe moderna) — se der erro, apenas devolve null.
    return null;
  }
}

/*
 * FUNÇÃO: storeSession (interna)
 * O que faz: guarda no navegador o token novo e, se vier, os dados do usuário.
 * Parâmetros:
 *   - objeto { token, user } (desestruturado direto nos parâmetros):
 *       token (string): o token de acesso (JWT);
 *       user (objeto | undefined): dados do usuário logado.
 * Retorno: nada.
 * Onde é usada: em refreshSession(), depois de renovar a sessão.
 */
function storeSession({ token, user }) {
  try {
    // Salva o token.
    localStorage.setItem(TOKEN_KEY, token);
    // Só salva o usuário se ele veio. JSON.stringify transforma o objeto em texto,
    // porque o localStorage só guarda strings.
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Sem acesso ao armazenamento local (modo privado restrito): a sessão vale só nesta aba.
  }
}

/*
 * FUNÇÃO: clearSession (exportada)
 * O que faz: apaga do navegador o token e os dados do usuário (encerra a sessão local).
 * Parâmetros: nenhum.
 * Retorno: nada.
 * Onde é usada: no logout do painel, quando a sessão expira (aqui embaixo) e em telas do admin.
 */
// O quê: remove a sessão administrativa salva no navegador.
// Como: apaga token e usuário do localStorage, ignorando navegadores que bloqueiam o acesso.
// Para quê: usado no logout e quando a sessão não pode mais ser renovada.
export function clearSession() {
  try {
    // Remove as duas chaves do localStorage.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nada a limpar quando o armazenamento local está indisponível.
  }
}

// O quê: anexa o token da sessão administrativa às requisições.
// Como: lê o token salvo no login e só preenche Authorization quando a chamada não definiu um próprio.
// Para quê: permitir que os serviços do painel acessem rotas protegidas sem repetir o cabeçalho.
// "Interceptor de requisição": uma função que o axios executa ANTES de enviar cada requisição.
// Ela recebe a configuração da requisição ("config"), pode alterá-la, e precisa devolvê-la.
api.interceptors.request.use((config) => {
  // Lê o token salvo (ou null).
  const token = readToken();

  // Só adiciona o cabeçalho se houver token E a requisição ainda não tiver um Authorization próprio.
  if (token && !config.headers?.Authorization) {
    // Garante que exista um objeto de cabeçalhos.
    config.headers = config.headers || {};
    // Padrão "Bearer": o backend lê "Authorization: Bearer <token>" para saber quem está logado.
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Devolve a configuração (alterada ou não) para o axios seguir com o envio.
  return config;
});

// O quê: renova a sessão uma única vez, mesmo com várias requisições falhando ao mesmo tempo.
// Como: compartilha a mesma Promise entre chamadas concorrentes e guarda o novo token.
// Para quê: o token de acesso dura 15 minutos; a renovação mantém o painel aberto enquanto há uso.
// Guarda a renovação EM ANDAMENTO (uma Promise) ou null se nenhuma estiver acontecendo.
let refreshPromise = null;
/*
 * FUNÇÃO: refreshSession (interna)
 * O que faz: pede ao backend um token novo, usando o cookie de renovação.
 * Parâmetros: nenhum.
 * Retorno: Promise que resolve para o novo token (string) ou é rejeitada se a renovação falhar.
 * Detalhe importante: se 5 requisições receberem 401 ao mesmo tempo, todas recebem a MESMA
 *   Promise, então o backend é chamado uma vez só.
 * Onde é usada: no interceptor de resposta, logo abaixo.
 */
function refreshSession() {
  // "||=": só cria uma nova renovação se não houver outra em andamento.
  refreshPromise ||= api
    // POST /api/v1/auth/refresh: o navegador envia junto o cookie httpOnly de renovação.
    .post('/api/v1/auth/refresh')
    // .then roda quando a resposta chega com sucesso.
    .then((response) => {
      // Salva o novo token e o usuário que vieram em response.data.data.
      storeSession(response.data.data);
      // O valor devolvido aqui vira o resultado da Promise: o token novo.
      return response.data.data.token;
    })
    // .finally roda no fim, com sucesso ou erro: libera para futuras renovações.
    .finally(() => {
      refreshPromise = null;
    });
  // Devolve a Promise (nova ou a que já estava em andamento).
  return refreshPromise;
}

// O quê: trata respostas 401 de sessões administrativas.
// Como: tenta renovar uma vez e repete a requisição; se não der, limpa a sessão e avisa a aplicação.
// Para quê: evitar que o usuário perca o trabalho por expiração silenciosa do token.
// "Interceptor de resposta": api.interceptors.response.use(sucesso, erro).
// O 1º argumento é undefined (respostas de sucesso passam sem mudança);
// o 2º é a função chamada quando a resposta é um ERRO.
api.interceptors.response.use(undefined, async (error) => {
  // error.config é a configuração da requisição que falhou (para podermos repeti-la).
  const original = error.config;
  // Verifica se a requisição que falhou era uma das rotas de autenticação.
  // .some devolve true se algum caminho da lista combinar com o início da URL.
  const isAuthCall = AUTH_PATHS.some((path) => original?.url?.startsWith(path));

  // Casos em que NÃO tentamos renovar e apenas repassamos o erro adiante ("throw"):
  //   - o erro não é 401 (não autorizado);
  //   - não há configuração para repetir;
  //   - já tentamos renovar uma vez para esta requisição (evita repetição infinita);
  //   - a requisição era de autenticação;
  //   - não havia token salvo (o usuário nem estava logado — ex.: site público).
  if (error.response?.status !== 401 || !original || original.retriedAfterRefresh || isAuthCall || !readToken()) {
    throw error;
  }

  // Marca a requisição para não tentar renovar de novo caso falhe outra vez.
  original.retriedAfterRefresh = true;
  // Vai guardar o token novo.
  let token;
  try {
    // Espera a renovação terminar.
    token = await refreshSession();
  } catch (refreshError) {
    // Só encerra a sessão quando o servidor recusou a renovação; falha de rede mantém o login.
    if (refreshError?.response?.status === 401) {
      // Apaga a sessão salva...
      clearSession();
      // ...e dispara um evento global. Quem estiver escutando (o painel) leva o usuário ao login.
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    // Repassa o erro ORIGINAL para quem fez a requisição.
    throw error;
  }

  // Renovou: troca o token no cabeçalho da requisição original...
  original.headers.Authorization = `Bearer ${token}`;
  // ...e a repete. api(config) executa uma requisição a partir de uma configuração.
  // O resultado volta para quem chamou como se nada tivesse dado errado.
  return api(original);
});

// O quê: exporta o cliente configurado.
// Como: o export default permite importação direta nos serviços.
// Para quê: mantém o acesso ao backend desacoplado dos componentes visuais.
export default api;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao ser importado, o arquivo cria a instância "api" com o endereço do backend.
 *   2. Toda requisição passa pelo interceptor de REQUISIÇÃO, que coloca o token
 *      (se houver) no cabeçalho Authorization.
 *   3. Se a resposta for um erro 401 (token expirado), o interceptor de RESPOSTA:
 *        a) chama refreshSession() (uma única vez, mesmo com várias falhas simultâneas);
 *        b) se renovar, salva o novo token e repete a requisição original;
 *        c) se o backend recusar a renovação, apaga a sessão e dispara SESSION_EXPIRED_EVENT.
 *   4. Os demais erros são repassados para quem fez a requisição tratar.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Axios: instância (axios.create), baseURL, headers, withCredentials.
 *   - Interceptors de requisição e de resposta.
 *   - Autenticação com JWT: cabeçalho "Authorization: Bearer <token>".
 *   - Access token (curto) x refresh token (cookie httpOnly) e renovação automática.
 *   - Status HTTP 401 (não autorizado).
 *   - localStorage e JSON.stringify.
 *   - Promises: .then, .finally, async/await e como "compartilhar" uma Promise.
 *   - Eventos personalizados do navegador (new Event + window.dispatchEvent).
 *   - CSRF e cookies entre domínios (conceitos de segurança web).
 *   - Variáveis de ambiente (process.env.REACT_APP_...).
 * ============================================================================
 */
