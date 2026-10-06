import api from '../../services/api';

export async function listAnimals(params) {
  const response = await api.get('/api/v1/animals', { params });
  return {
    items: response.data.data ?? [],
    meta: response.data.meta ?? {},
  };
}

export async function createAnimal(payload) {
  const response = await api.post('/api/v1/animals', payload);
  return response.data.data;
}

export async function updateAnimal(id, payload) {
  const response = await api.put(`/api/v1/animals/${id}`, payload);
  return response.data.data;
}

export async function updateAnimalStatus(id, status, motivo) {
  const response = await api.patch(`/api/v1/animals/${id}/status`, { status, motivo });
  return response.data.data;
}

export async function deleteAnimal(id) {
  await api.delete(`/api/v1/animals/${id}`);
}