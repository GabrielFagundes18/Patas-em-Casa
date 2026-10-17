/*
 * ============================================================================
 * ARQUIVO: AdoptersPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela de adotantes e da ficha: lista com contatos
 *   mascarados e filtro de UF, revelar contatos e editar (enviando só o que
 *   mudou), anonimização com palavra de confirmação e ações ocultas sem permissão.
 *
 * PRINCIPAIS ITENS:
 *   - admin: usuário com todas as permissões de adotantes e LGPD.
 *   - ana: adotante de exemplo (contatos mascarados).
 *   - 4 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AdoptersPage.jsx (e ./AdopterDetailDialog.jsx) → telas testadas.
 *   - ./adopterService → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória (filtros na URL).
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import AdoptersPage from './AdoptersPage';
// Funções de API usadas nas verificações (viram mocks).
import { anonymizeAdopter, getAdopter, listAdopters, revealAdopter, updateAdopter } from './adopterService';

// Substitui o service inteiro por funções falsas.
jest.mock('./adopterService', () => ({
  listAdopters: jest.fn(),
  getAdopter: jest.fn(),
  revealAdopter: jest.fn(),
  updateAdopter: jest.fn(),
  exportAdoptersCsv: jest.fn(),
  exportAdopterData: jest.fn(),
  anonymizeAdopter: jest.fn(),
  deleteAdopter: jest.fn(),
}));

// Usuário com todas as permissões necessárias.
const admin = { permissions: ['adopters:read', 'adopters:update', 'adopters:reveal', 'adopters:export', 'lgpd:approve'] };
// Adotante de exemplo (contatos mascarados como a API devolve).
const ana = {
  id: 'd1', nome: 'Ana Souza', email: 'an***@example.org', telefone: '*******7777', cidade: 'Campinas', estado: 'SP',
  status: 'em_analise', criado_em: '2026-09-01T12:00:00.000Z', total_pedidos: 2, pedidos_abertos: 1, possui_endereco: true,
};

// Antes de cada teste: lista com a Ana e ficha com um pedido no histórico.
beforeEach(() => {
  listAdopters.mockResolvedValue({ items: [ana], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  getAdopter.mockResolvedValue({ ...ana, historico: { pedidos: [{ id: 'p1', status: 'novo', animal_nome: 'Nino', data_pedido: '2026-10-01T12:00:00.000Z' }], doacoes: [], historias: [] } });
});

// Teste 1: lista com contatos mascarados e filtro de UF.
test('lists adopters with masked contacts and filters by state', async () => {
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  expect(screen.getByText('an***@example.org')).toBeInTheDocument();
  expect(screen.getByText('2 (1 em andamento)')).toBeInTheDocument();
  // Filtra por UF = RJ.
  fireEvent.change(screen.getByRole('combobox', { name: 'UF' }), { target: { value: 'RJ' } });
  await waitFor(() => expect(listAdopters).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'RJ' })));
});

// Teste 2: revelar contatos libera a edição; só o campo alterado é enviado.
test('revealing contacts unlocks editing them; only changed fields are sent', async () => {
  revealAdopter.mockResolvedValue({ id: 'd1', email: 'ana@example.org', telefone: '(11) 98888-7777', endereco: 'Rua A, 1' });
  updateAdopter.mockResolvedValue({});
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  // Abre a ficha (um diálogo com o nome da Ana).
  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  expect(within(dialog).getByText('Nino')).toBeInTheDocument();
  // Revela os contatos.
  fireEvent.click(within(dialog).getByRole('button', { name: 'Mostrar contatos' }));
  expect(await within(dialog).findByText('ana@example.org')).toBeInTheDocument();

  // Edita só o telefone e salva.
  fireEvent.click(within(dialog).getByRole('button', { name: 'Editar cadastro' }));
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Telefone' }), { target: { value: '(11) 97777-6666' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

  expect(await within(dialog).findByText('Cadastro atualizado.')).toBeInTheDocument();
  // Só o telefone foi enviado (o diff).
  expect(updateAdopter).toHaveBeenCalledWith('d1', { telefone: '(11) 97777-6666' });
});

// Teste 3: anonimizar exige digitar a palavra de confirmação.
test('anonymizing requires typing the confirmation word', async () => {
  anonymizeAdopter.mockResolvedValue({ id: 'd1', anonimizado: true });
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Anonimizar' }));
  // O botão de confirmar começa desabilitado.
  const confirm = within(dialog).getByRole('button', { name: 'Anonimizar titular' });
  expect(confirm).toBeDisabled();
  // Digita a palavra exata e confirma.
  fireEvent.change(within(dialog).getByRole('textbox', { name: /digite anonimizar/i }), { target: { value: 'ANONIMIZAR' } });
  fireEvent.click(confirm);

  expect(await within(dialog).findByText('Titular anonimizado.')).toBeInTheDocument();
  expect(anonymizeAdopter).toHaveBeenCalledWith('d1');
});

// Teste 4: sem permissões, as ações de privacidade e revelação ficam escondidas.
test('without the LGPD permission the privacy actions are hidden', async () => {
  render(<MemoryRouter><AdoptersPage user={{ permissions: ['adopters:read'] }} /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  // queryByRole devolve null quando não acha (getByRole lançaria erro).
  expect(within(dialog).queryByRole('button', { name: 'Anonimizar' })).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('button', { name: 'Mostrar contatos' })).not.toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Com o service falso, os testes abrem a tela e a ficha como diferentes usuários
 *   e conferem: mascaramento, filtros, revelação + edição com diff, confirmação
 *   obrigatória e o efeito das permissões.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar regras de permissão (o que aparece para cada perfil).
 *   - Testar "diff" de formulários (só o que mudou é enviado).
 *   - toBeDisabled e fluxos de confirmação.
 *   - within(dialog) para isolar a janela.
 * ============================================================================
 */
