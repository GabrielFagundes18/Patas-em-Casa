/*
 * ============================================================================
 * ARQUIVO: AdminPasswordPages.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados das telas de senha do painel: "esqueci minha senha",
 *   criação de senha por convite (com volta ao login) e link expirado.
 *
 * PRINCIPAIS ITENS:
 *   - renderAt(path): desenha as rotas de login e senha numa URL.
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AdminForgotPasswordPage.jsx, ./AdminLoginPage.jsx, ./AdminResetPasswordPage.jsx → telas testadas.
 *   - ./authService.js → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen } from '@testing-library/react';
// Roteador de memória e rotas (para testar a navegação entre as telas).
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// Telas testadas.
import AdminForgotPasswordPage from './AdminForgotPasswordPage';
import AdminLoginPage from './AdminLoginPage';
import AdminResetPasswordPage from './AdminResetPasswordPage';
// Funções do serviço (viram mocks).
import { requestPasswordReset, resetPassword } from './authService';

// Substitui as três funções do serviço por funções falsas.
jest.mock('./authService', () => ({ loginAdmin: jest.fn(), requestPasswordReset: jest.fn(), resetPassword: jest.fn() }));

/*
 * FUNÇÃO AUXILIAR: renderAt
 * O que faz: desenha as três rotas de acesso começando na URL informada.
 */
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

// Teste 1: "esqueci minha senha" envia o e-mail (sem espaços) e mostra a resposta neutra.
test('forgot password sends the e-mail and shows the neutral answer', async () => {
  requestPasswordReset.mockResolvedValue({ mensagem: 'Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.' });
  renderAt('/admin/esqueci-senha');

  // E-mail com espaços nas pontas (a tela deve removê-los com trim).
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' carla@patasemcasa.org ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

  expect(await screen.findByText(/Se o e-mail estiver cadastrado/)).toBeInTheDocument();
  expect(requestPasswordReset).toHaveBeenCalledWith('carla@patasemcasa.org');
});

// Teste 2: link de convite pede para criar a senha e volta ao login no sucesso.
test('an invite link asks to create the password and returns to login on success', async () => {
  resetPassword.mockResolvedValue({ mensagem: 'ok' });
  renderAt('/admin/redefinir-senha?token=abcdefghijklmnopqrstuvwxyz&convite=1');

  // Com convite=1, o título é "Crie sua senha".
  expect(screen.getByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument();
  // Senhas diferentes → erro local, sem chamar a API.
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'Diferente2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }));
  expect(screen.getByRole('alert')).toHaveTextContent('As senhas não são iguais.');
  expect(resetPassword).not.toHaveBeenCalled();

  // Corrige a confirmação e envia.
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }));

  // Chega à tela de login com o aviso de senha definida.
  expect(await screen.findByText('Senha definida. Entre com a nova senha.')).toBeInTheDocument();
  expect(resetPassword).toHaveBeenCalledWith('abcdefghijklmnopqrstuvwxyz', 'SenhaNova2026');
});

// Teste 3: link expirado oferece pedir um novo.
test('an expired link offers a new one', async () => {
  resetPassword.mockRejectedValue({ response: { data: { error: { code: 'LINK_INVALIDO', message: 'Este link é inválido ou já expirou. Peça um novo link.' } } } });
  renderAt('/admin/redefinir-senha?token=abcdefghijklmnopqrstuvwxyz');

  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.change(screen.getByLabelText('Repita a nova senha'), { target: { value: 'SenhaNova2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

  expect(await screen.findByText(/já expirou/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute('href', '/admin/esqueci-senha');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   As três telas de acesso ficam em rotas de um MemoryRouter. Cada teste abre uma
 *   URL, preenche os campos, e confere as chamadas ao serviço e a navegação
 *   (ex.: voltar ao login com o aviso "senha definida").
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar navegação entre telas com várias <Route>.
 *   - Validação local (senhas iguais) antes de chamar a API.
 *   - Parâmetros de URL (token, convite) em testes.
 *   - Simular erro com código específico (LINK_INVALIDO).
 * ============================================================================
 */
