import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminForgotPasswordPage from './AdminForgotPasswordPage';
import AdminLoginPage from './AdminLoginPage';
import AdminResetPasswordPage from './AdminResetPasswordPage';
import { requestPasswordReset, resetPassword } from './authService';

jest.mock('./authService', () => ({ loginAdmin: jest.fn(), requestPasswordReset: jest.fn(), resetPassword: jest.fn() }));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLoginPage />} path="/admin/login" />
        <Route element={<AdminForgotPasswordPage />} path="/admin/esqueci-senha" />
        <Route element={<AdminResetPasswordPage />} path="/admin/redefinir-senha" />
      </Routes>
    </MemoryRouter>
  );
}

test('forgot password sends the e-mail and shows the neutral answer', async () => {
  requestPasswordReset.mockResolvedValue({ mensagem: 'Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.' });
  renderAt('/admin/esqueci-senha');

  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' carla@patasemcasa.org ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

  expect(await screen.findByText(/Se o e-mail estiver cadastrado/)).toBeInTheDocument();
  expect(requestPasswordReset).toHaveBeenCalledWith('carla@patasemcasa.org');
});

test('an invite link asks to create the password and returns to login on success', async () => {
  resetPassword.mockResolvedValue({ mensagem: 'ok' });
  renderAt('/admin/redefinir-senha?token=abcdefghijklmnopqrstuvwxyz&convite=1');

  expect(screen.getByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'Diferente2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }));
  expect(screen.getByRole('alert')).toHaveTextContent('As senhas não são iguais.');
  expect(resetPassword).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }));

  expect(await screen.findByText('Senha definida. Entre com a nova senha.')).toBeInTheDocument();
  expect(resetPassword).toHaveBeenCalledWith('abcdefghijklmnopqrstuvwxyz', 'SenhaNova2026');
});

test('an expired link offers a new one', async () => {
  resetPassword.mockRejectedValue({ response: { data: { error: { code: 'LINK_INVALIDO', message: 'Este link é inválido ou já expirou. Peça um novo link.' } } } });
  renderAt('/admin/redefinir-senha?token=abcdefghijklmnopqrstuvwxyz');

  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

  expect(await screen.findByText(/já expirou/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute('href', '/admin/esqueci-senha');
});
