import api from '../../api/client';

export async function listDonations(params) {
  const response = await api.get('/api/v1/donations', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function fetchDonationSummary() {
  const response = await api.get('/api/v1/donations/summary');
  return response.data.data;
}

export async function createDonation(payload) {
  const response = await api.post('/api/v1/donations', payload);
  return response.data.data;
}

export async function updateDonation(id, changes) {
  const response = await api.patch(`/api/v1/donations/${id}`, changes);
  return response.data.data;
}

export async function listSubscriptions(params) {
  const response = await api.get('/api/v1/donations/subscriptions', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function cancelSubscription(id) {
  const response = await api.post(`/api/v1/donations/subscriptions/${id}/cancel`);
  return response.data.data;
}
