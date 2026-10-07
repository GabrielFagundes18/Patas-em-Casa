import api from '../../api/client';

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
export async function getAnimal(id) {
  const response = await api.get(`/api/v1/animals/${id}`);
  return response.data.data;
}

// Fotos vão como multipart (campo "fotos"); o axios monta o boundary a partir do FormData.
export async function uploadAnimalPhotos(id, files) {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append('fotos', file));
  const response = await api.post(`/api/v1/animals/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data.data;
}

export async function setMainAnimalPhoto(id, photoId) {
  const response = await api.patch(`/api/v1/animals/${id}/photos/${photoId}/principal`);
  return response.data.data;
}

export async function deleteAnimalPhoto(id, photoId) {
  const response = await api.delete(`/api/v1/animals/${id}/photos/${photoId}`);
  return response.data.data;
}
