import api from '../../services/api';

export async function listAdoptionRequests(params) {
  const response = await api.get('/api/v1/adoption-requests', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function getAdoptionRequest(id) {
  const response = await api.get(`/api/v1/adoption-requests/${id}`);
  return response.data.data;
}

// Contatos completos e observações sem máscara (exige adopters:reveal; o backend registra na auditoria).
export async function revealAdoptionRequest(id) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/reveal`);
  return response.data.data;
}

// decisao: { justificativa (interna), notificar_adotante, mensagem_adotante }
export async function rejectAdoptionRequest(id, decisao) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/reject`, decisao);
  return response.data.data;
}

export async function approveAdoptionRequest(id, decisao) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/approve`, decisao);
  return response.data.data;
}

// Devolve { pedido, email }; email é null quando o envio não foi pedido.
export async function scheduleAdoptionRequest(id, payload) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/schedule`, payload);
  return response.data.data;
}

// Agenda: cada chamada devolve { pedido, agendamento, email }.
export async function rescheduleAppointment(id, appointmentId, payload) {
  const response = await api.patch(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}`, payload);
  return response.data.data;
}

export async function cancelAppointment(id, appointmentId, payload) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}/cancel`, payload);
  return response.data.data;
}

export async function completeAppointment(id, appointmentId) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/appointments/${appointmentId}/complete`);
  return response.data.data;
}
