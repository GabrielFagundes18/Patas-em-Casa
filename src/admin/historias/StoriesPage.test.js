import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StoriesPage from './StoriesPage';
import { createStory, listStories, updateStory } from './storyService';
import { listAnimals } from '../animais/animalService';

jest.mock('./storyService', () => ({ listStories: jest.fn(), createStory: jest.fn(), updateStory: jest.fn(), deleteStory: jest.fn() }));
jest.mock('../animais/animalService', () => ({ listAnimals: jest.fn() }));

const editor = { permissions: ['stories:read', 'stories:create', 'stories:update', 'stories:delete'] };
const story = { id: 's1', autor_nome: 'Fernanda A.', texto: 'Pipoca trouxe paz para a casa.', publicado: false, criado_em: '2026-09-01T12:00:00.000Z', animal_nome: 'Pipoca' };

beforeEach(() => {
  listStories.mockResolvedValue({ items: [story], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  listAnimals.mockResolvedValue({ items: [{ id: 'a9', nome: 'Pipoca' }], meta: {} });
});

test('creates a published story linked to an adopted animal', async () => {
  createStory.mockResolvedValue({ id: 's2' });
  render(<MemoryRouter><StoriesPage user={editor} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /nova história/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /quem conta/i }), { target: { value: 'Rui' } });
  fireEvent.change(form.getByRole('textbox', { name: /^história/i }), { target: { value: 'Mel mudou nossa rotina para melhor.' } });
  fireEvent.change(await form.findByRole('combobox', { name: /animal adotado/i }), { target: { value: 'a9' } });
  fireEvent.click(form.getByRole('checkbox', { name: /publicar no site/i }));
  fireEvent.click(form.getByRole('button', { name: 'Criar história' }));

  expect(await screen.findByText('História salva e publicada no site.')).toBeInTheDocument();
  expect(createStory).toHaveBeenCalledWith({ autor_nome: 'Rui', texto: 'Mel mudou nossa rotina para melhor.', foto_url: null, animal_id: 'a9', publicado: true });
  expect(listAnimals).toHaveBeenCalledWith(expect.objectContaining({ status: 'adotado' }));
});

test('publishes a draft from the list', async () => {
  updateStory.mockResolvedValue({});
  render(<MemoryRouter><StoriesPage user={editor} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }));
  await waitFor(() => expect(updateStory).toHaveBeenCalledWith('s1', { publicado: true }));
  expect(await screen.findByText('História publicada no site.')).toBeInTheDocument();
});

test('read-only roles do not see editing actions', async () => {
  render(<MemoryRouter><StoriesPage user={{ permissions: ['stories:read'] }} /></MemoryRouter>);
  expect(await screen.findByText('Fernanda A.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /nova história/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
});
