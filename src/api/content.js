/*
 * ============================================================================
 * ARQUIVO: content.js (pasta api)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Busca no backend o CONTEÚDO público da página inicial: os números de impacto,
 *   as histórias de adoção e as etapas do processo de adoção. Assim a equipe
 *   atualiza esse conteúdo pelo painel, sem mexer no código do site.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - buscarNumeros({ signal })       → contagens (resgatados, adotados, aguardando).
 *   - buscarHistorias({ signal })     → histórias publicadas (até 6).
 *   - buscarEtapasAdocao({ signal })  → etapas do "como funciona".
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./client.js → instância do axios configurada.
 *   - Usado por: features/home/sections/StatsStrip (buscarNumeros),
 *     features/home/sections/Stories (buscarHistorias) e
 *     shared/hooks/useAdoptionSteps.js (buscarEtapasAdocao).
 *   - No backend: rotas /api/v1/public/stats, /stories e /adoption-steps.
 * ============================================================================
 */

// O quê: importa o cliente HTTP centralizado.
// Como: reutiliza a instância Axios configurada em services/api.js.
// Para quê: buscar o conteúdo público da home (números, histórias e etapas) no backend.
// (Observação: o arquivo real do cliente é ./client.js.)
import api from './client';

/*
 * FUNÇÃO: buscarNumeros
 * O que faz: busca os números agregados exibidos na faixa de impacto da página inicial.
 * Parâmetros:
 *   - objeto opcional { signal }: AbortSignal para cancelar a requisição.
 * Retorno (Promise → objeto): ex.: { animais_resgatados: 11, adocoes_realizadas: 4, aguardando_lar: 6 }.
 * Onde é usada: na seção StatsStrip da página inicial.
 */
// O quê: busca os números agregados exibidos na faixa de impacto.
// Como: GET /api/v1/public/stats devolve apenas contagens, sem dados pessoais.
// Para quê: mostrar resgates, adoções e animais aguardando com os dados reais do banco.
export async function buscarNumeros({ signal } = {}) {
  // GET simples, com possibilidade de cancelamento pelo "signal".
  const resposta = await api.get('/api/v1/public/stats', { signal });
  // Devolve o objeto com as contagens.
  return resposta.data.data;
}

/*
 * FUNÇÃO: buscarHistorias
 * O que faz: busca as histórias de adoção que a equipe marcou como publicadas.
 * Parâmetros:
 *   - objeto opcional { signal }: AbortSignal para cancelar a requisição.
 * Retorno (Promise → array): lista de histórias (no máximo 6). Lista vazia se não vier nada.
 * Onde é usada: na seção Stories da página inicial.
 */
// O quê: busca as histórias publicadas pela equipe.
// Como: GET /api/v1/public/stories traz só histórias com publicado = true.
// Para quê: alimentar o mural de impacto da home.
export async function buscarHistorias({ signal } = {}) {
  // params: { pageSize: 6 } vira ?pageSize=6 → pede no máximo 6 histórias.
  const resposta = await api.get('/api/v1/public/stories', { params: { pageSize: 6 }, signal });
  // "?? []" garante que sempre devolvemos uma lista (mesmo que a API não mande "data").
  return resposta.data.data ?? [];
}

/*
 * FUNÇÃO: buscarEtapasAdocao
 * O que faz: busca as etapas ativas do processo de adoção.
 * Parâmetros:
 *   - objeto opcional { signal }: AbortSignal para cancelar a requisição.
 * Retorno (Promise → array): lista de { ordem, titulo, descricao }. Vazia se não vier nada.
 * Onde é usada: na seção HowItWorks da home e no hook useAdoptionSteps.
 */
// O quê: busca as etapas ativas do processo de adoção.
// Como: GET /api/v1/public/adoption-steps devolve ordem, título e descrição.
// Para quê: manter a seção "Como funciona" igual ao que a equipe cadastrou.
export async function buscarEtapasAdocao({ signal } = {}) {
  // GET das etapas.
  const resposta = await api.get('/api/v1/public/adoption-steps', { signal });
  // Lista das etapas, ou lista vazia por segurança.
  return resposta.data.data ?? [];
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Cada seção da página inicial chama uma destas funções ao aparecer na tela.
 *   A função faz um GET na API pública, espera a resposta e devolve os dados
 *   (ou uma lista vazia, quando for o caso). O "signal" permite cancelar a busca
 *   se o visitante sair da página antes da resposta chegar.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Requisições GET com parâmetros de consulta (query string).
 *   - Cancelamento de requisições com AbortSignal.
 *   - Operador "??" para valores padrão.
 *   - Conteúdo dinâmico (gerenciado pelo painel) x conteúdo fixo no código.
 * ============================================================================
 */
