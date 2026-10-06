import api from '../../services/api';

export async function listDonations(params) {
  const response = await api.get('/api/v1/donations', { params });
  return { items: response.data.data ?? [], meta: response.data.meta ?? {} };
}

export async function fetchDonationSummary() {
  const response = await api.get('/api/v1/donations/summary');
  return response.data.data;
}
