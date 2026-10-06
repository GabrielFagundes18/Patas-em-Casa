import api from './api';

function mapAdminUser(user = {}) {
  return {
    ...user,
    role: user.role || user.cargo,
  };
}

export async function loginAdmin(email, password) {
  const response = await api.post('/api/v1/auth/login', { email, password });
  const payload = response.data.data;
  return { ...payload, user: mapAdminUser(payload.user) };
}

export async function fetchAdminMe(token) {
  const response = await api.get('/api/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return mapAdminUser(response.data.data);
}

export async function logoutAdmin() {
  await api.post('/api/v1/auth/logout');
}
