import api from '../../api/client';

export async function fetchDashboardSummary({ fresh = false } = {}) {
  const response = await api.get('/api/v1/dashboard/summary', { params: fresh ? { atualizar: 'true' } : undefined });
  return response.data.data;
}
