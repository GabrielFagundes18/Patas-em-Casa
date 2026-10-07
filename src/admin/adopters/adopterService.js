import api from '../../api/client';

// Contatos chegam mascarados; o valor completo só via revealAdopter (registrado na auditoria).
export async function listAdopters(params) {
  const response = await api.get('/api/v1/adopters', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function getAdopter(id) {
  const response = await api.get(`/api/v1/adopters/${id}`);
  return response.data.data;
}

export async function revealAdopter(id) {
  const response = await api.post(`/api/v1/adopters/${id}/reveal`);
  return response.data.data;
}

export async function updateAdopter(id, changes) {
  const response = await api.patch(`/api/v1/adopters/${id}`, changes);
  return response.data.data;
}

// Exportações: o arquivo chega como Blob para o navegador baixar.
export async function exportAdoptersCsv(params) {
  const response = await api.get('/api/v1/adopters/export', { params, responseType: 'blob' });
  return response.data;
}

export async function exportAdopterData(id) {
  const response = await api.get(`/api/v1/adopters/${id}/lgpd-export`);
  return response.data.data;
}

// LGPD (irreversível): o backend exige a palavra de confirmação.
export async function anonymizeAdopter(id) {
  const response = await api.post(`/api/v1/adopters/${id}/anonymize`, { confirmacao: 'ANONIMIZAR' });
  return response.data.data;
}

export async function deleteAdopter(id) {
  await api.delete(`/api/v1/adopters/${id}`, { data: { confirmacao: 'EXCLUIR' } });
}
