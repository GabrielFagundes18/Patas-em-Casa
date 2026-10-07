import api from '../../api/client';

export async function listVolunteers(params) {
  const response = await api.get('/api/v1/volunteers', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function createVolunteer(payload) {
  const response = await api.post('/api/v1/volunteers', payload);
  return response.data.data;
}
