/*
 * ============================================================================
 * ARQUIVO: volunteerService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do painel para os VOLUNTÁRIOS: listar (com filtros e paginação) e
 *   cadastrar um voluntário manualmente.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listVolunteers(params)   → lista paginada.
 *   - createVolunteer(payload) → cadastra.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/volunteers/VolunteersPage.jsx.
 *   - No backend: rotas /api/v1/volunteers (módulo volunteers).
 *   - Inscrições feitas no site usam outra rota (pública): api/volunteers.js.
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listVolunteers
 * O que faz: busca os voluntários com filtros (q, status, area) e paginação.
 * Parâmetros: params (objeto). Retorno (Promise → { items, meta }).
 */
export async function listVolunteers(params) {
  const response = await api.get('/api/v1/volunteers', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: createVolunteer
 * O que faz: cadastra um voluntário pelo painel.
 * Parâmetros: payload (objeto: nome, email, telefone, status, data_inicio, areas).
 * Retorno (Promise → voluntário criado).
 */
export async function createVolunteer(payload) {
  const response = await api.post('/api/v1/volunteers', payload);
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   A tela de voluntários usa listVolunteers (via usePaginatedList) para a tabela
 *   e createVolunteer no formulário "Adicionar voluntário".
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Rotas protegidas (painel) x rotas públicas (site) para o mesmo recurso.
 *   - GET com parâmetros e POST com corpo JSON.
 * ============================================================================
 */
