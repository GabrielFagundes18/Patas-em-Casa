/*
 * ============================================================================
 * ARQUIVO: AdminLoginPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela de login do painel: falha de conexão,
 *   credenciais erradas e login com sucesso (sessão salva no navegador).
 *
 * PRINCIPAIS ITENS:
 *   - submitLogin(): desenha a tela, preenche e envia o formulário.
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AdminLoginPage.jsx → tela testada.
 *   - ./authService.js     → loginAdmin substituído por mock.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library (waitFor espera uma condição).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// A tela usa Link/navigate, então precisa de um roteador.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import AdminLoginPage from './AdminLoginPage';
// Função de login (vira mock).
import { loginAdmin } from './authService';

// Substitui o serviço de autenticação por uma função falsa.
jest.mock('./authService', () => ({
  loginAdmin: jest.fn(),
}));

/*
 * FUNÇÃO AUXILIAR: submitLogin
 * O que faz: desenha a tela, preenche e-mail e senha e clica em "Entrar no painel".
 */
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

// Depois de cada teste: limpa mocks e o localStorage (para o próximo começar sem sessão).
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// Teste 1: falha de conexão (erro sem "response").
test('explains when the API cannot be reached', async () => {
  loginAdmin.mockRejectedValueOnce(new Error('Network Error'));
  submitLogin();

  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
});

// Teste 2: credenciais erradas (401) mostram a mensagem da API.
test('shows the API message for wrong credentials', async () => {
  loginAdmin.mockRejectedValueOnce({
    response: { status: 401, data: { error: { code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' } } },
  });
  submitLogin();

  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
});

// Teste 3: login com sucesso salva o token e o usuário no localStorage.
test('stores the session after a successful login', async () => {
  loginAdmin.mockResolvedValueOnce({ token: 'jwt-token', user: { nome: 'Carla Mendes', role: 'administrador' } });
  submitLogin();

  // waitFor repete a verificação até passar (ou estourar o tempo).
  await waitFor(() => expect(localStorage.getItem('patas_admin_token')).toBe('jwt-token'));
  // O usuário foi salvo como texto JSON; JSON.parse transforma de volta em objeto.
  expect(JSON.parse(localStorage.getItem('patas_admin_user')).nome).toBe('Carla Mendes');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Cada teste programa a resposta do loginAdmin (falha de rede, 401 ou sucesso),
 *   envia o formulário e confere a mensagem ou o que foi salvo no navegador.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar caminhos de erro e de sucesso.
 *   - mockRejectedValueOnce / mockResolvedValueOnce.
 *   - Verificar efeitos colaterais (localStorage) com waitFor.
 *   - Limpar estado global entre testes (afterEach).
 * ============================================================================
 */
