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

export async function rejectAdoptionRequest(id, justificativa) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/reject`, { justificativa });
  return response.data.data;
}

export async function approveAdoptionRequest(id, justificativa) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/approve`, { justificativa });
  return response.data.data;
}

// Devolve { pedido, email }; email é null quando o envio não foi pedido.
export async function scheduleAdoptionRequest(id, payload) {
  const response = await api.post(`/api/v1/adoption-requests/${id}/schedule`, payload);
  return response.data.data;
}
