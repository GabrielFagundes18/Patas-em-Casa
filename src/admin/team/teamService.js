import api from 'api/client';

export async function listTeam(params) {
  const response = await api.get('/api/v1/users', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function createTeamMember(payload) {
  const response = await api.post('/api/v1/users', payload);
  return response.data.data;
}

export async function updateTeamMember(id, changes) {
  const response = await api.patch(`/api/v1/users/${id}`, changes);
  return response.data.data;
}

export async function resetTeamMemberPassword(id, novaSenha) {
  await api.post(`/api/v1/users/${id}/password`, { nova_senha: novaSenha });
}

// Devolve { enviado, motivo? }: sem SMTP no servidor, o convite não sai e o motivo explica.
export async function sendTeamInvite(id) {
  const response = await api.post(`/api/v1/users/${id}/invite`);
  return response.data.data;
}
