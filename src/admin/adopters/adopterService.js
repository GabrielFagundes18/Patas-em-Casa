/*
 * ============================================================================
 * ARQUIVO: adopterService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do painel para o cadastro de ADOTANTES (pessoas que enviaram pedidos):
 *   listar, ver a ficha, revelar contatos (auditado), editar, exportar e atender
 *   pedidos de privacidade da LGPD (exportar dados, anonimizar, excluir).
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listAdopters(params)         → lista paginada (contatos mascarados).
 *   - getAdopter(id)               → ficha de um adotante.
 *   - revealAdopter(id)            → contatos completos (registrado na auditoria).
 *   - updateAdopter(id, changes)   → atualiza dados.
 *   - exportAdoptersCsv(params)    → baixa a lista em CSV (Blob).
 *   - exportAdopterData(id)        → exporta todos os dados de uma pessoa (LGPD).
 *   - anonymizeAdopter(id)         → anonimiza (irreversível).
 *   - deleteAdopter(id)            → exclui (irreversível).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/adopters/AdoptersPage.jsx e AdopterDetailDialog.jsx.
 *   - No backend: rotas /api/v1/adopters/... (módulo adopters).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listAdopters
 * O que faz: lista adotantes com filtros e paginação.
 * Parâmetros: params (objeto) — ex.: { page, pageSize, q, status, estado }.
 * Retorno (Promise → { items, meta }).
 */
// Contatos chegam mascarados; o valor completo só via revealAdopter (registrado na auditoria).
export async function listAdopters(params) {
  const response = await api.get('/api/v1/adopters', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: getAdopter
 * O que faz: busca a ficha completa de um adotante (contatos mascarados, histórico, pedidos).
 * Parâmetros: id (string). Retorno (Promise → objeto).
 */
export async function getAdopter(id) {
  const response = await api.get(`/api/v1/adopters/${id}`);
  return response.data.data;
}

/*
 * FUNÇÃO: revealAdopter
 * O que faz: devolve os contatos sem máscara (o backend registra quem viu e quando).
 * Parâmetros: id (string). Retorno (Promise → objeto com os dados completos).
 */
export async function revealAdopter(id) {
  const response = await api.post(`/api/v1/adopters/${id}/reveal`);
  return response.data.data;
}

/*
 * FUNÇÃO: updateAdopter
 * O que faz: altera dados do adotante (só os campos enviados — PATCH).
 * Parâmetros: id (string) e changes (objeto com os campos alterados).
 * Retorno (Promise → adotante atualizado).
 */
export async function updateAdopter(id, changes) {
  const response = await api.patch(`/api/v1/adopters/${id}`, changes);
  return response.data.data;
}

/*
 * FUNÇÃO: exportAdoptersCsv
 * O que faz: baixa a lista de adotantes (com os filtros) em CSV.
 * Parâmetros: params (objeto com filtros).
 * Retorno (Promise → Blob): o arquivo; responseType: 'blob' faz o axios devolver dados binários.
 */
// Exportações: o arquivo chega como Blob para o navegador baixar.
export async function exportAdoptersCsv(params) {
  const response = await api.get('/api/v1/adopters/export', { params, responseType: 'blob' });
  // Aqui response.data é o próprio arquivo (não há { data: ... }).
  return response.data;
}

/*
 * FUNÇÃO: exportAdopterData
 * O que faz: obtém todos os dados de uma pessoa (direito de acesso/portabilidade da LGPD).
 * Parâmetros: id (string). Retorno (Promise → objeto, salvo como JSON pela tela).
 */
export async function exportAdopterData(id) {
  const response = await api.get(`/api/v1/adopters/${id}/lgpd-export`);
  return response.data.data;
}

/*
 * FUNÇÃO: anonymizeAdopter
 * O que faz: substitui os dados pessoais por valores anônimos (mantém estatísticas).
 * Parâmetros: id (string). Retorno (Promise → resultado).
 * Segurança: envia a palavra de confirmação exigida pelo backend.
 */
// LGPD (irreversível): o backend exige a palavra de confirmação.
export async function anonymizeAdopter(id) {
  const response = await api.post(`/api/v1/adopters/${id}/anonymize`, { confirmacao: 'ANONIMIZAR' });
  return response.data.data;
}

/*
 * FUNÇÃO: deleteAdopter
 * O que faz: exclui o adotante definitivamente.
 * Parâmetros: id (string). Retorno: Promise sem valor.
 * Detalhe: no axios, o corpo de um DELETE vai na opção "data".
 */
export async function deleteAdopter(id) {
  await api.delete(`/api/v1/adopters/${id}`, { data: { confirmacao: 'EXCLUIR' } });
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   As telas de adotantes chamam estas funções. As listas e fichas vêm com
 *   contatos mascarados; revelar, exportar, anonimizar e excluir são ações
 *   protegidas por permissão no backend, e as irreversíveis exigem uma palavra
 *   de confirmação no corpo da requisição.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - LGPD: minimização (máscara), direito de acesso (exportação), anonimização e exclusão.
 *   - Auditoria de acesso a dados pessoais.
 *   - Download de arquivos com responseType: 'blob'.
 *   - Corpo em requisições DELETE no axios (opção data).
 *   - Confirmação explícita para ações irreversíveis.
 * ============================================================================
 */
