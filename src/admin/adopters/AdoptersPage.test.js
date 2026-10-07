import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdoptersPage from './AdoptersPage';
import { anonymizeAdopter, getAdopter, listAdopters, revealAdopter, updateAdopter } from './adopterService';

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

const admin = { permissions: ['adopters:read', 'adopters:update', 'adopters:reveal', 'adopters:export', 'lgpd:approve'] };
const ana = {
  id: 'd1', nome: 'Ana Souza', email: 'an***@example.org', telefone: '*******7777', cidade: 'Campinas', estado: 'SP',
  status: 'em_analise', criado_em: '2026-09-01T12:00:00.000Z', total_pedidos: 2, pedidos_abertos: 1, possui_endereco: true,
};

beforeEach(() => {
  listAdopters.mockResolvedValue({ items: [ana], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  getAdopter.mockResolvedValue({ ...ana, historico: { pedidos: [{ id: 'p1', status: 'novo', animal_nome: 'Nino', data_pedido: '2026-10-01T12:00:00.000Z' }], doacoes: [], historias: [] } });
});

test('lists adopters with masked contacts and filters by state', async () => {
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  expect(screen.getByText('an***@example.org')).toBeInTheDocument();
  expect(screen.getByText('2 (1 em andamento)')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'UF' }), { target: { value: 'RJ' } });
  await waitFor(() => expect(listAdopters).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'RJ' })));
});

test('revealing contacts unlocks editing them; only changed fields are sent', async () => {
  revealAdopter.mockResolvedValue({ id: 'd1', email: 'ana@example.org', telefone: '(11) 98888-7777', endereco: 'Rua A, 1' });
  updateAdopter.mockResolvedValue({});
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  expect(within(dialog).getByText('Nino')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Mostrar contatos' }));
  expect(await within(dialog).findByText('ana@example.org')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Editar cadastro' }));
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Telefone' }), { target: { value: '(11) 97777-6666' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

  expect(await within(dialog).findByText('Cadastro atualizado.')).toBeInTheDocument();
  expect(updateAdopter).toHaveBeenCalledWith('d1', { telefone: '(11) 97777-6666' });
});

test('anonymizing requires typing the confirmation word', async () => {
  anonymizeAdopter.mockResolvedValue({ id: 'd1', anonimizado: true });
  render(<MemoryRouter><AdoptersPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Anonimizar' }));
  const confirm = within(dialog).getByRole('button', { name: 'Anonimizar titular' });
  expect(confirm).toBeDisabled();
  fireEvent.change(within(dialog).getByRole('textbox', { name: /digite anonimizar/i }), { target: { value: 'ANONIMIZAR' } });
  fireEvent.click(confirm);

  expect(await within(dialog).findByText('Titular anonimizado.')).toBeInTheDocument();
  expect(anonymizeAdopter).toHaveBeenCalledWith('d1');
});

test('without the LGPD permission the privacy actions are hidden', async () => {
  render(<MemoryRouter><AdoptersPage user={{ permissions: ['adopters:read'] }} /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Ana Souza' }));
  const dialog = await screen.findByRole('dialog', { name: 'Ana Souza' });
  expect(within(dialog).queryByRole('button', { name: 'Anonimizar' })).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('button', { name: 'Mostrar contatos' })).not.toBeInTheDocument();
});
