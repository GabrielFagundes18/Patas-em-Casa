import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DonationsPage from './DonationsPage';
import { cancelSubscription, createDonation, fetchDonationSummary, listDonations, listSubscriptions } from './donationService';

jest.mock('./donationService', () => ({
  listDonations: jest.fn(),
  fetchDonationSummary: jest.fn(),
  createDonation: jest.fn(),
  updateDonation: jest.fn(),
  listSubscriptions: jest.fn(),
  cancelSubscription: jest.fn(),
}));

const finance = { permissions: ['donations:read', 'donations:create', 'donations:update'] };
const manual = { id: 'd1', doador_nome: 'Bia', doador_email: 'bi***@example.org', tipo: 'unica', valor: 30, metodo: 'pix', status: 'confirmada', data: '2026-10-01T12:00:00.000Z', gateway: null };
const online = { ...manual, id: 'd2', doador_nome: 'Caio', gateway: 'mercado_pago', status: 'falhou', metodo: 'cartao' };
const subscription = { id: 's1', doador_nome: 'Duda', doador_email: 'duda@example.org', valor: 25, status: 'ativa', criado_em: '2026-09-01T12:00:00.000Z', pagamentos_confirmados: 2, total_arrecadado: 50 };

beforeEach(() => {
  listDonations.mockResolvedValue({ items: [manual, online], meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 } });
  fetchDonationSummary.mockResolvedValue({ arrecadado_mes_atual: 30, total_confirmado: 30, por_tipo: [] });
  listSubscriptions.mockResolvedValue({ items: [subscription], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } });
});

test('registers a donation made outside the site', async () => {
  createDonation.mockResolvedValue({ id: 'd3' });
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /registrar doação/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /^doador/i }), { target: { value: 'Evento de sábado' } });
  fireEvent.change(form.getByRole('spinbutton', { name: /valor/i }), { target: { value: '120.5' } });
  fireEvent.change(form.getByLabelText(/^data/i), { target: { value: '2026-10-01' } });
  fireEvent.change(form.getByRole('combobox', { name: /método/i }), { target: { value: 'transferencia' } });
  fireEvent.click(form.getByRole('button', { name: 'Registrar doação' }));

  expect(await screen.findByText('Doação registrada.')).toBeInTheDocument();
  expect(createDonation).toHaveBeenCalledWith({
    doador_nome: 'Evento de sábado', doador_email: null, tipo: 'unica', valor: 120.5, metodo: 'transferencia', status: 'confirmada', data: '2026-10-01T12:00:00-03:00',
  });
});

test('online donations are marked and cannot be edited by hand', async () => {
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  expect(await screen.findByText('Pagamento recusado', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getByText('Online (Mercado Pago)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Editar doação de Bia' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar doação de Caio' })).not.toBeInTheDocument();
});

test('monthly donations can be cancelled', async () => {
  cancelSubscription.mockResolvedValue({ ...subscription, status: 'cancelada' });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  const section = within(await screen.findByRole('region', { name: 'Doações mensais' }));
  expect(await section.findByText('Duda')).toBeInTheDocument();
  expect(section.getByText(/R\$\s?50,00 \(2 pagamentos\)/)).toBeInTheDocument();
  fireEvent.click(section.getByRole('button', { name: 'Cancelar' }));

  await waitFor(() => expect(cancelSubscription).toHaveBeenCalledWith('s1'));
  expect(await section.findByText('Doação mensal de Duda cancelada.')).toBeInTheDocument();
  window.confirm.mockRestore();
});
