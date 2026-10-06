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

// O quê: pede o link de redefinição de senha (a resposta não revela se o e-mail existe).
export async function requestPasswordReset(email) {
  const response = await api.post('/api/v1/auth/forgot-password', { email });
  return response.data.data;
}

// O quê: define a nova senha com o token do link (redefinição ou convite).
export async function resetPassword(token, novaSenha) {
  const response = await api.post('/api/v1/auth/reset-password', { token, nova_senha: novaSenha });
  return response.data.data;
}
