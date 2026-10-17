/*
 * ============================================================================
 * ARQUIVO: donationService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do painel para as DOAÇÕES: listar, ver o resumo financeiro,
 *   registrar e editar doações manuais (feitas fora do site) e gerenciar as
 *   doações mensais (assinaturas do Mercado Pago).
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listDonations(params)        → lista paginada de doações.
 *   - fetchDonationSummary()       → totais e indicadores.
 *   - createDonation(payload)      → registra doação manual.
 *   - updateDonation(id, changes)  → edita doação.
 *   - listSubscriptions(params)    → lista de doações mensais.
 *   - cancelSubscription(id)       → cancela uma doação mensal.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/donations/DonationsPage.jsx e SubscriptionsSection.jsx.
 *   - No backend: rotas /api/v1/donations/... (módulo donations).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listDonations
 * O que faz: lista doações com filtros e paginação.
 * Parâmetros: params (objeto). Retorno (Promise → { items, meta }).
 */
export async function listDonations(params) {
  const response = await api.get('/api/v1/donations', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: fetchDonationSummary
 * O que faz: busca os indicadores de doações (totais do mês, do ano etc.).
 * Retorno (Promise → objeto do resumo).
 */
export async function fetchDonationSummary() {
  const response = await api.get('/api/v1/donations/summary');
  return response.data.data;
}

/*
 * FUNÇÃO: createDonation
 * O que faz: registra uma doação feita fora do site.
 * Parâmetros: payload (objeto: doador, tipo, valor, método, status, data...).
 * Retorno (Promise → doação criada).
 */
export async function createDonation(payload) {
  const response = await api.post('/api/v1/donations', payload);
  return response.data.data;
}

/*
 * FUNÇÃO: updateDonation
 * O que faz: altera uma doação (PATCH: só os campos enviados).
 * Parâmetros: id (string) e changes (objeto). Retorno (Promise → doação atualizada).
 */
export async function updateDonation(id, changes) {
  const response = await api.patch(`/api/v1/donations/${id}`, changes);
  return response.data.data;
}

/*
 * FUNÇÃO: listSubscriptions
 * O que faz: lista as doações mensais (assinaturas).
 * Parâmetros: params (objeto). Retorno (Promise → { items, meta }).
 */
export async function listSubscriptions(params) {
  const response = await api.get('/api/v1/donations/subscriptions', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: cancelSubscription
 * O que faz: cancela uma doação mensal (também no Mercado Pago, pelo backend).
 * Parâmetros: id (string). Retorno (Promise → assinatura atualizada).
 */
export async function cancelSubscription(id) {
  const response = await api.post(`/api/v1/donations/subscriptions/${id}/cancel`);
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   As telas de doações chamam estas funções; cada uma faz uma requisição ao
 *   módulo de doações do backend e devolve a parte útil da resposta. Listas
 *   voltam no formato { items, meta } usado pelo hook usePaginatedList.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Camada de serviço e verbos HTTP (GET, POST, PATCH).
 *   - Recursos aninhados (/donations/subscriptions/:id/cancel).
 *   - Paginação no servidor ({ items, meta }).
 * ============================================================================
 */
