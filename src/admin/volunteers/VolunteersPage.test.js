/*
 * ============================================================================
 * ARQUIVO: VolunteersPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Teste automatizado da tela de voluntários do painel: cadastrar um voluntário
 *   com contato, data de início e áreas, e recarregar a lista.
 *
 * PRINCIPAIS ITENS:
 *   - 1 teste.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./VolunteersPage.jsx (e VolunteerFormDialog) → telas testadas.
 *   - ./volunteerService → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import VolunteersPage from './VolunteersPage';
// Funções de API (viram mocks).
import { createVolunteer, listVolunteers } from './volunteerService';

// Substitui o service.
jest.mock('./volunteerService', () => ({ createVolunteer: jest.fn(), listVolunteers: jest.fn() }));

// Teste: cadastro completo de um voluntário.
test('adds a volunteer with contact, start date and areas', async () => {
  // Lista vazia e cadastro devolvendo a Rita.
  listVolunteers.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  createVolunteer.mockResolvedValue({ id: 'v1', nome: 'Rita Alves' });
  // Usuário com permissão de cadastrar.
  render(<MemoryRouter><VolunteersPage user={{ permissions: ['volunteers:read', 'volunteers:create'] }} /></MemoryRouter>);

  // Abre o formulário e preenche dentro da janela.
  fireEvent.click(await screen.findByRole('button', { name: /adicionar voluntário/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: 'Rita Alves' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail/i }), { target: { value: 'rita@example.org' } });
  fireEvent.change(form.getByRole('textbox', { name: /telefone/i }), { target: { value: '(11) 98888-7777' } });
  fireEvent.change(form.getByLabelText(/início/i), { target: { value: '2026-10-01' } });
  // Marca duas áreas.
  fireEvent.click(form.getByRole('checkbox', { name: 'Passeios' }));
  fireEvent.click(form.getByRole('checkbox', { name: 'Fotografia' }));
  fireEvent.click(form.getByRole('button', { name: 'Adicionar voluntário' }));

  // Aviso de sucesso e corpo enviado à API (códigos das áreas, na ordem marcada).
  expect(await screen.findByText('Rita Alves agora está na lista de voluntários.')).toBeInTheDocument();
  expect(createVolunteer).toHaveBeenCalledWith({
    nome: 'Rita Alves',
    email: 'rita@example.org',
    telefone: '(11) 98888-7777',
    status: 'ativo',
    data_inicio: '2026-10-01',
    areas: ['passeios', 'fotografia'],
  });
  // A lista foi recarregada (2ª busca).
  await waitFor(() => expect(listVolunteers).toHaveBeenCalledTimes(2));
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O teste abre o formulário, preenche como um usuário, envia e confere o aviso,
 *   os dados enviados à API e o recarregamento da lista.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Teste de fluxo completo de formulário.
 *   - getByRole('checkbox'), getByLabelText e within.
 *   - toHaveBeenCalledTimes para conferir recargas.
 * ============================================================================
 */
