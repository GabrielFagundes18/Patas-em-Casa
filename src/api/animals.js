/*
 * ============================================================================
 * ARQUIVO: animals.js (pasta api)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções que buscam animais na API PÚBLICA do backend (a parte do site que
 *   qualquer visitante acessa, sem login). Diferente do admin/animals/animalService.js,
 *   que é do painel e exige login.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - buscarTodoAnimais({ signal }) → busca TODOS os animais disponíveis (todas as páginas).
 *   - buscarAnimal(id, { signal })  → busca o perfil público de um animal.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./client.js → instância do axios configurada.
 *   - Usado por: shared/hooks/useAvailableAnimals.js (lista do catálogo e da home)
 *     e features/animal-profile/AnimalProfilePage.jsx (perfil de um animal).
 *   - No backend: rotas GET /api/v1/public/animals e /api/v1/public/animals/:id.
 * ============================================================================
 */

// O quê: importa o cliente HTTP centralizado.
// Como: o módulo reutiliza a instância Axios com baseURL e cabeçalhos definidos na camada de infraestrutura.
// Para quê: mantém o serviço focado no contrato de animais, sem conhecer detalhes do transporte.
import api from './client';

// Quantos animais pedir por página em cada requisição (100 é um número grande para
// precisar de poucas chamadas).
const PAGE_SIZE = 100;

/*
 * FUNÇÃO: buscarTodoAnimais
 * O que faz: busca todos os animais disponíveis, página por página, até acabar.
 * Parâmetros:
 *   - objeto opcional { signal }:
 *       signal (AbortSignal): permite CANCELAR a requisição (ex.: se o usuário sair da página).
 *     "= {}" é um valor padrão: se a função for chamada sem argumentos, usa um objeto vazio.
 * Retorno (Promise → array): lista com todos os animais, no formato do backend.
 *   Se a API falhar, a Promise é rejeitada (o erro "sobe" para quem chamou).
 * Onde é usada: no hook useAvailableAnimals (catálogo e página inicial).
 */
// O quê: busca todos os animais disponíveis para adoção na API pública.
// Como: percorre as páginas de /api/v1/public/animals (100 por página) e deixa erros de rede subirem.
// Para quê: permitir que cada tela diferencie "lista vazia" de "servidor indisponível".
export async function buscarTodoAnimais({ signal } = {}) {
  // Lista onde vamos acumulando os animais de todas as páginas.
  const animais = [];
  // Página atual que vamos pedir (começa na 1).
  let page = 1;
  // Total de páginas (começa em 1 e é atualizado com a resposta da API).
  let totalPages = 1;

  // "do...while": executa o bloco PELO MENOS UMA VEZ e repete enquanto a condição for verdadeira.
  do {
    // Pede uma página de animais. "params" vira ?page=1&pageSize=100 na URL.
    // "signal" liga a requisição ao cancelamento.
    const resposta = await api.get('/api/v1/public/animals', {
      params: { page, pageSize: PAGE_SIZE },
      signal,
    });
    // Adiciona os animais desta página à lista.
    // "...(lista)" (spread) espalha os itens, como se passássemos cada um separadamente ao push.
    // "?." e "??" protegem caso a resposta venha sem "data" (usa lista vazia).
    animais.push(...(resposta.data?.data ?? []));
    // Atualiza o total de páginas a partir da paginação ("meta") da resposta.
    totalPages = resposta.data?.meta?.totalPages ?? 1;
    // Passa para a próxima página.
    page += 1;
    // Continua enquanto ainda houver páginas para buscar.
  } while (page <= totalPages);

  // Devolve a lista completa.
  return animais;
}

/*
 * FUNÇÃO: buscarAnimal
 * O que faz: busca os dados públicos de UM animal (com fotos e temperamento).
 * Parâmetros:
 *   - id (string | number): identificador do animal (vem da URL /animais/:id).
 *   - objeto opcional { signal }: AbortSignal para cancelar a requisição.
 * Retorno (Promise → objeto): o animal. Se ele não existir (404) ou já tiver sido
 *   adotado (410), a Promise é rejeitada com o erro do axios.
 * Onde é usada: na AnimalProfilePage.jsx (página de perfil do animal).
 */
// O quê: busca o perfil público de um animal (com galeria de fotos e temperamento).
// Como: GET /api/v1/public/animals/:id; 404 (não existe) e 410 (já adotado) sobem como erro do axios.
// Para quê: alimentar a página /animais/:id, que mostra cada caso com uma mensagem própria.
export async function buscarAnimal(id, { signal } = {}) {
  // encodeURIComponent "escapa" caracteres especiais do id (ex.: espaços, "/"),
  // evitando que eles quebrem ou alterem o endereço da requisição.
  const resposta = await api.get(`/api/v1/public/animals/${encodeURIComponent(id)}`, { signal });
  // Devolve só o animal (o "data" que o backend envia).
  return resposta.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   - buscarTodoAnimais: pede a página 1; lê quantas páginas existem; continua
 *     pedindo (2, 3...) até a última; junta tudo numa lista e devolve.
 *   - buscarAnimal: pede um único animal pelo id e devolve os dados dele.
 *   - Em ambos, erros não são tratados aqui: eles sobem para a tela, que decide
 *     a mensagem (ex.: "animal já adotado", "servidor indisponível").
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Paginação de API e laço do...while.
 *   - async/await e propagação de erros.
 *   - AbortController / AbortSignal para cancelar requisições.
 *   - Parâmetros com desestruturação e valor padrão ({ signal } = {}).
 *   - Operador spread (...) em push; "?." e "??".
 *   - encodeURIComponent e segurança na montagem de URLs.
 *   - Códigos HTTP 404 (não encontrado) e 410 (não existe mais).
 * ============================================================================
 */
