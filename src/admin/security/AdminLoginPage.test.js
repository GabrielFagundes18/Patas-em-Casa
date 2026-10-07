import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLoginPage from './AdminLoginPage';
import { loginAdmin } from './authService';

jest.mock('./authService', () => ({
  loginAdmin: jest.fn(),
}));

function submitLogin() {
  render(
    <MemoryRouter>
      <AdminLoginPage />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'carla@patasemcasa.org' } });
  fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha forte 123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar no painel/i }));
}

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('explains when the API cannot be reached', async () => {
  loginAdmin.mockRejectedValueOnce(new Error('Network Error'));
  submitLogin();

  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
});

test('shows the API message for wrong credentials', async () => {
  loginAdmin.mockRejectedValueOnce({
    response: { status: 401, data: { error: { code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' } } },
  });
  submitLogin();

  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
});

test('stores the session after a successful login', async () => {
  loginAdmin.mockResolvedValueOnce({ token: 'jwt-token', user: { nome: 'Carla Mendes', role: 'administrador' } });
  submitLogin();

  await waitFor(() => expect(localStorage.getItem('patas_admin_token')).toBe('jwt-token'));
  expect(JSON.parse(localStorage.getItem('patas_admin_user')).nome).toBe('Carla Mendes');
});
