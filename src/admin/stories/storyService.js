import api from 'api/client';

export async function listStories(params) {
  const response = await api.get('/api/v1/stories', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function createStory(payload) {
  const response = await api.post('/api/v1/stories', payload);
  return response.data.data;
}

export async function updateStory(id, changes) {
  const response = await api.patch(`/api/v1/stories/${id}`, changes);
  return response.data.data;
}

export async function deleteStory(id) {
  await api.delete(`/api/v1/stories/${id}`);
}
