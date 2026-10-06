import api from '../../services/api';

export async function listTeam(params) {
  const response = await api.get('/api/v1/users', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function createTeamMember(payload) {
  const response = await api.post('/api/v1/users', payload);
  return response.data.data;
}
