/*
 * ============================================================================
 * ARQUIVO: storyService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do painel para as HISTÓRIAS DE ADOÇÃO (depoimentos exibidos no
 *   site): listar, criar, editar (inclusive publicar/ocultar) e excluir.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listStories(params)        → lista paginada.
 *   - createStory(payload)       → cria.
 *   - updateStory(id, changes)   → altera (PATCH).
 *   - deleteStory(id)            → exclui.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/stories/StoriesPage.jsx.
 *   - No backend: rotas /api/v1/stories (módulo stories).
 *   - As histórias publicadas aparecem na home (features/home/sections/Stories).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listStories
 * O que faz: lista as histórias com filtros e paginação.
 * Parâmetros: params (objeto). Retorno (Promise → { items, meta }).
 */
export async function listStories(params) {
  const response = await api.get('/api/v1/stories', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: createStory
 * O que faz: cria uma história.
 * Parâmetros: payload (objeto: autor, texto, animal, foto, publicado...).
 * Retorno (Promise → história criada).
 */
export async function createStory(payload) {
  const response = await api.post('/api/v1/stories', payload);
  return response.data.data;
}

/*
 * FUNÇÃO: updateStory
 * O que faz: altera uma história (só os campos enviados).
 * Parâmetros: id (string) e changes (objeto). Retorno (Promise → história atualizada).
 */
export async function updateStory(id, changes) {
  const response = await api.patch(`/api/v1/stories/${id}`, changes);
  return response.data.data;
}

/*
 * FUNÇÃO: deleteStory
 * O que faz: exclui uma história.
 * Parâmetros: id (string). Retorno: Promise sem valor (o backend responde 204).
 */
export async function deleteStory(id) {
  await api.delete(`/api/v1/stories/${id}`);
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   Um CRUD (criar, ler, atualizar, apagar) completo de histórias, cada função
 *   usando o verbo HTTP correspondente: GET, POST, PATCH e DELETE.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - CRUD e verbos HTTP.
 *   - PATCH (parcial) x PUT (completo).
 *   - Resposta 204 (sem conteúdo) no DELETE.
 * ============================================================================
 */
