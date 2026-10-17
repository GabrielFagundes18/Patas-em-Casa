/*
 * ============================================================================
 * ARQUIVO: StoriesPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela de histórias do painel: criar uma história
 *   publicada ligada a um animal adotado, publicar um rascunho pela lista e
 *   esconder as ações de edição para perfis só de leitura.
 *
 * PRINCIPAIS ITENS:
 *   - editor: usuário com todas as permissões de histórias.
 *   - story: história de exemplo (rascunho).
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./StoriesPage.jsx (e StoryFormDialog) → telas testadas.
 *   - ./storyService e admin/animals/animalService → substituídos por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import StoriesPage from './StoriesPage';
// Funções de API (viram mocks).
import { createStory, listStories, updateStory } from './storyService';
import { listAnimals } from 'admin/animals/animalService';

// Substitui o service de histórias e o de animais (usado pelo formulário).
jest.mock('./storyService', () => ({ listStories: jest.fn(), createStory: jest.fn(), updateStory: jest.fn(), deleteStory: jest.fn() }));
jest.mock('admin/animals/animalService', () => ({ listAnimals: jest.fn() }));

// Usuário editor e história de exemplo.
const editor = { permissions: ['stories:read', 'stories:create', 'stories:update', 'stories:delete'] };
const story = { id: 's1', autor_nome: 'Fernanda A.', texto: 'Pipoca trouxe paz para a casa.', publicado: false, criado_em: '2026-09-01T12:00:00.000Z', animal_nome: 'Pipoca' };

// Antes de cada teste: uma história na lista e um animal adotado disponível.
beforeEach(() => {
  listStories.mockResolvedValue({ items: [story], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  listAnimals.mockResolvedValue({ items: [{ id: 'a9', nome: 'Pipoca' }], meta: {} });
});

// Teste 1: cria uma história publicada e vinculada a um animal.
test('creates a published story linked to an adopted animal', async () => {
  createStory.mockResolvedValue({ id: 's2' });
  render(<MemoryRouter><StoriesPage user={editor} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /nova história/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /quem conta/i }), { target: { value: 'Rui' } });
  fireEvent.change(form.getByRole('textbox', { name: /^história/i }), { target: { value: 'Mel mudou nossa rotina para melhor.' } });
  // O select de animal aparece depois que os animais carregam (findByRole espera).
  fireEvent.change(await form.findByRole('combobox', { name: /animal adotado/i }), { target: { value: 'a9' } });
  fireEvent.click(form.getByRole('checkbox', { name: /publicar no site/i }));
  fireEvent.click(form.getByRole('button', { name: 'Criar história' }));

  expect(await screen.findByText('História salva e publicada no site.')).toBeInTheDocument();
  expect(createStory).toHaveBeenCalledWith({ autor_nome: 'Rui', texto: 'Mel mudou nossa rotina para melhor.', foto_url: null, animal_id: 'a9', publicado: true });
  // O formulário buscou só animais adotados.
  expect(listAnimals).toHaveBeenCalledWith(expect.objectContaining({ status: 'adotado' }));
});

// Teste 2: publicar um rascunho direto da lista.
test('publishes a draft from the list', async () => {
  updateStory.mockResolvedValue({});
  render(<MemoryRouter><StoriesPage user={editor} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }));
  await waitFor(() => expect(updateStory).toHaveBeenCalledWith('s1', { publicado: true }));
  expect(await screen.findByText('História publicada no site.')).toBeInTheDocument();
});

// Teste 3: perfil só de leitura não vê botões de edição.
test('read-only roles do not see editing actions', async () => {
  render(<MemoryRouter><StoriesPage user={{ permissions: ['stories:read'] }} /></MemoryRouter>);
  expect(await screen.findByText('Fernanda A.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /nova história/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Com os services falsos, os testes criam e publicam histórias como editor e
 *   conferem que um perfil só de leitura não vê as ações.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Mock de dois módulos diferentes no mesmo teste.
 *   - findByRole para elementos que aparecem depois de uma carga.
 *   - Testes de permissão (queryByRole + not.toBeInTheDocument).
 * ============================================================================
 */
