/*
 * ============================================================================
 * ARQUIVO: adoptionService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções que o painel usa para gerenciar os PEDIDOS DE ADOÇÃO no backend:
 *   listar, ver detalhes, revelar contatos (com auditoria), aprovar, reprovar,
 *   agendar visita/entrevista e gerenciar a agenda (remarcar, cancelar, concluir).
 *
 * PRINCIPAIS FUNÇÕES:
 *   - listAdoptionRequests(params)            → lista paginada e filtrada.
 *   - getAdoptionRequest(id)                  → detalhes de um pedido.
 *   - revealAdoptionRequest(id)               → contatos completos (sem máscara).
 *   - rejectAdoptionRequest(id, decisao)      → reprova.
 *   - approveAdoptionRequest(id, decisao)     → aprova.
 *   - scheduleAdoptionRequest(id, payload)    → agenda visita/entrevista.
 *   - rescheduleAppointment / cancelAppointment / completeAppointment → agenda.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios (com token do painel).
 *   - Usado por: admin/adoptions/AdoptionsPage.jsx e AdoptionDetailDialog.jsx.
 *   - No backend: rotas /api/v1/adoption-requests/... (módulo adoptions).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: listAdoptionRequests
 * O que faz: busca os pedidos com filtros e paginação.
 * Parâmetros: params (objeto) — ex.: { page: '1', pageSize: '20', q: 'ana', status: 'novo' }.
 * Retorno (Promise → { items, meta }): formato esperado pelo hook usePaginatedList.
 */
export async function listAdoptionRequests(params) {
  const response = await api.get('/api/v1/adoption-requests', { params });
  // "?? []" e "?? {}" garantem valores seguros se a API não mandar algo.
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

/*
 * FUNÇÃO: getAdoptionRequest
 * O que faz: busca os detalhes de um pedido (contatos mascarados).
 * Parâmetros: id (string). Retorno (Promise → objeto do pedido).
 */
export async function getAdoptionRequest(id) {
  const response = await api.get(`/api/v1/adoption-requests/${id}`);
  return response.data.data;
}

/*
 * FUNÇÃO: revealAdoptionRequest
 * O que faz: pede os contatos completos do candidato (LGPD: acesso registrado).
 * Parâmetros: id (string). Retorno (Promise → pedido com dados sem máscara).
 */
// Contatos completos e observações sem máscara (exige adopters:reveal; o backend registra na auditoria).
export async function revealAdoptionRequest(id) {
  // POST (e não GET) porque a ação tem efeito: grava um registro de auditoria.
  const response = await api.post(`/api/v1/adoption-requests/${id}/reveal`);
  return response.data.data;
}

/*
 * FUNÇÃO: rejectAdoptionRequest
 * O que faz: reprova o pedido.
 * Parâmetros: id (string) e decisao (objeto { justificativa, notificar_adotante, mensagem_adotante }).
 * Retorno (Promise → resultado da decisão).
 */
// decisao: { justificativa (interna), notificar_adotante, mensagem_adotante }
export async function rejectAdoptionRequest(id, decisao) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/reject`, decisao);
  return response.data.data;
}

/*
 * FUNÇÃO: approveAdoptionRequest
 * O que faz: aprova o pedido (mesmo formato de "decisao" da reprovação).
 * Parâmetros: id (string) e decisao (objeto). Retorno (Promise → resultado).
 */
export async function approveAdoptionRequest(id, decisao) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/approve`, decisao);
  return response.data.data;
}

/*
 * FUNÇÃO: scheduleAdoptionRequest
 * O que faz: agenda uma visita ou entrevista para o pedido (e, opcionalmente, envia e-mail).
 * Parâmetros: id (string) e payload (objeto com tipo, data/hora, responsável, aviso por e-mail...).
 * Retorno (Promise → { pedido, email }); email é null quando o envio não foi pedido.
 */
// Devolve { pedido, email }; email é null quando o envio não foi pedido.
export async function scheduleAdoptionRequest(id, payload) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/schedule`, payload);
  return response.data.data;
}

/*
 * FUNÇÃO: rescheduleAppointment
 * O que faz: muda a data/hora de um compromisso já marcado.
 * Parâmetros: id (pedido), appointmentId (compromisso) e payload (nova data etc.).
 * Retorno (Promise → { pedido, agendamento, email }).
 */
// Agenda: cada chamada devolve { pedido, agendamento, email }.
export async function rescheduleAppointment(id, appointmentId, payload) {
  // PATCH: atualização parcial do compromisso.
  const response = await api.patch(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}`, payload);
  return response.data.data;
}

/*
 * FUNÇÃO: cancelAppointment
 * O que faz: cancela um compromisso (com motivo e aviso opcional ao adotante).
 * Parâmetros: id, appointmentId e payload. Retorno (Promise → { pedido, agendamento, email }).
 */
export async function cancelAppointment(id, appointmentId, payload) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}/cancel`, payload);
  return response.data.data;
}

/*
 * FUNÇÃO: completeAppointment
 * O que faz: marca um compromisso como realizado.
 * Parâmetros: id e appointmentId. Retorno (Promise → { pedido, agendamento, email }).
 */
export async function completeAppointment(id, appointmentId) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}/complete`);
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   Cada função faz uma requisição HTTP para uma rota do módulo de adoções e
 *   devolve só a parte útil da resposta (response.data.data). Ações com efeito
 *   (revelar, aprovar, reprovar, agendar, cancelar, concluir) usam POST/PATCH.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Camada de serviço e rotas REST aninhadas (/pedidos/:id/agendamentos/:id).
 *   - Ações como sub-recursos (/approve, /reject, /reveal) usando POST.
 *   - LGPD: mascaramento de dados pessoais e trilha de auditoria.
 *   - GET x POST x PATCH.
 * ============================================================================
 */
