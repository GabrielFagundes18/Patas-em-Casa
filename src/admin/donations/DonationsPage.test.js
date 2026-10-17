/*
 * ============================================================================
 * ARQUIVO: DonationsPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela de doações do painel: registrar doação manual,
 *   impedir a edição de doações online e cancelar doações mensais.
 *
 * PRINCIPAIS ITENS:
 *   - finance: usuário com permissões de doações.
 *   - manual, online, subscription: dados de exemplo.
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./DonationsPage.jsx (e DonationFormDialog, SubscriptionsSection) → telas testadas.
 *   - ./donationService → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import DonationsPage from './DonationsPage';
// Funções de API (viram mocks).
import { cancelSubscription, createDonation, fetchDonationSummary, listDonations, listSubscriptions } from './donationService';

// Substitui o service.
jest.mock('./donationService', () => ({
  listDonations: jest.fn(),
  fetchDonationSummary: jest.fn(),
  createDonation: jest.fn(),
  updateDonation: jest.fn(),
  listSubscriptions: jest.fn(),
  cancelSubscription: jest.fn(),
}));

// Usuário do financeiro (ler, criar e editar doações).
const finance = { permissions: ['donations:read', 'donations:create', 'donations:update'] };
// Doação manual (sem gateway) e doação online (gateway mercado_pago, pagamento recusado).
const manual = { id: 'd1', doador_nome: 'Bia', doador_email: 'bi***@example.org', tipo: 'unica', valor: 30, metodo: 'pix', status: 'confirmada', data: '2026-10-01T12:00:00.000Z', gateway: null };
const online = { ...manual, id: 'd2', doador_nome: 'Caio', gateway: 'mercado_pago', status: 'falhou', metodo: 'cartao' };
// Doação mensal ativa.
const subscription = { id: 's1', doador_nome: 'Duda', doador_email: 'duda@example.org', valor: 25, status: 'ativa', criado_em: '2026-09-01T12:00:00.000Z', pagamentos_confirmados: 2, total_arrecadado: 50 };

// Antes de cada teste: respostas padrão das três buscas.
beforeEach(() => {
  listDonations.mockResolvedValue({ items: [manual, online], meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 } });
  fetchDonationSummary.mockResolvedValue({ arrecadado_mes_atual: 30, total_confirmado: 30, por_tipo: [] });
  listSubscriptions.mockResolvedValue({ items: [subscription], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } });
});

// Teste 1: registrar uma doação manual.
test('registers a donation made outside the site', async () => {
  createDonation.mockResolvedValue({ id: 'd3' });
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  // Abre o formulário e trabalha dentro da janela (within).
  fireEvent.click(await screen.findByRole('button', { name: /registrar doação/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /^doador/i }), { target: { value: 'Evento de sábado' } });
  // <input type="number"> tem o papel "spinbutton".
  fireEvent.change(form.getByRole('spinbutton', { name: /valor/i }), { target: { value: '120.5' } });
  fireEvent.change(form.getByLabelText(/^data/i), { target: { value: '2026-10-01' } });
  fireEvent.change(form.getByRole('combobox', { name: /método/i }), { target: { value: 'transferencia' } });
  fireEvent.click(form.getByRole('button', { name: 'Registrar doação' }));

  expect(await screen.findByText('Doação registrada.')).toBeInTheDocument();
  // Payload: e-mail null (registro novo sem e-mail) e data ao meio-dia de Brasília.
  expect(createDonation).toHaveBeenCalledWith({
    doador_nome: 'Evento de sábado', doador_email: null, tipo: 'unica', valor: 120.5, metodo: 'transferencia', status: 'confirmada', data: '2026-10-01T12:00:00-03:00',
  });
});

// Teste 2: doações online aparecem marcadas e sem botão de editar.
test('online donations are marked and cannot be edited by hand', async () => {
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  expect(await screen.findByText('Pagamento recusado', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getByText('Online (Mercado Pago)')).toBeInTheDocument();
  // A manual (Bia) tem botão de editar; a online (Caio), não.
  expect(screen.getByRole('button', { name: 'Editar doação de Bia' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar doação de Caio' })).not.toBeInTheDocument();
});

// Teste 3: cancelar uma doação mensal.
test('monthly donations can be cancelled', async () => {
  cancelSubscription.mockResolvedValue({ ...subscription, status: 'cancelada' });
  // Espiona window.confirm e faz ele responder "OK" (true).
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<MemoryRouter><DonationsPage user={finance} /></MemoryRouter>);

  // A seção (region) "Doações mensais".
  const section = within(await screen.findByRole('region', { name: 'Doações mensais' }));
  expect(await section.findByText('Duda')).toBeInTheDocument();
  expect(section.getByText(/R\$\s?50,00 \(2 pagamentos\)/)).toBeInTheDocument();
  fireEvent.click(section.getByRole('button', { name: 'Cancelar' }));

  await waitFor(() => expect(cancelSubscription).toHaveBeenCalledWith('s1'));
  expect(await section.findByText('Doação mensal de Duda cancelada.')).toBeInTheDocument();
  // Restaura o window.confirm original.
  window.confirm.mockRestore();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O service é falso. Os testes desenham a tela como usuário do financeiro e
 *   conferem: o payload do registro manual, a regra "online não é editável" e o
 *   cancelamento da doação mensal (com confirmação simulada).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - jest.spyOn(window, 'confirm') para simular diálogos do navegador.
 *   - Papéis: spinbutton (number), combobox (select), region (section nomeada).
 *   - within() para restringir consultas a uma janela ou seção.
 *   - Testar regras de negócio na interface.
 * ============================================================================
 */
