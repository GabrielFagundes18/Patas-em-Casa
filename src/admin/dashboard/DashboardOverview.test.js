import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import { fetchDashboardSummary } from './dashboardService';

jest.mock('./dashboardService', () => ({ fetchDashboardSummary: jest.fn() }));

const summary = {
  atualizado_em: '2026-10-05T01:30:00.000Z',
  indicadores: { total_animais: 11, animais_sob_cuidado: 7, adocoes_mes: 1, adocoes_ano: 2, total_adocoes: 4, arrecadado_mes: 120.5, pedidos_pendentes: 5 },
  animais: {
    por_status: [],
    saude: { total: 11, vacinados: 10, castrados: 10, adotados: 4, percentual_vacinados: 90.9, percentual_castrados: 90.9, percentual_adotados: 36.4 },
    urgentes: [{ id: 'a1', nome: 'Duque', especie: 'cachorro', data_entrada: '2026-07-02' }],
  },
  pedidos: {
    por_status: [{ status: 'novo', total: 3 }],
    recentes: [{ id: 'p1', status: 'novo', prioridade: 'alto', data_pedido: '2026-10-04T12:00:00.000Z', animal: { id: 'a2', nome: 'Nino' }, adotante_nome: 'Ana' }],
  },
  doacoes: { por_metodo: [{ metodo: 'pix', quantidade: 5, total: 210 }] },
  series_mensais: [{ mes: '2026-10', adocoes: 1, doacoes_total: 120.5, doacoes_quantidade: 2 }],
  agenda: [{ tipo: 'visita', pedido_id: 'p3', referencia_em: '2026-10-01T12:00:00.000Z', animal_nome: 'Mel', adotante_nome: 'Rafael', responsavel_nome: null }],
};

test('shows real indicators, lists and agenda from the API', async () => {
  fetchDashboardSummary.mockResolvedValue(summary);
  render(<MemoryRouter><DashboardOverview /></MemoryRouter>);

  expect(await screen.findByText('Animais sob cuidado')).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s?120,50/, { selector: '.dashboard-metric-value' })).toBeInTheDocument();
  expect(screen.getByText('Duque')).toBeInTheDocument();
  expect(screen.getByText('quer adotar Nino · 04/10/2026')).toBeInTheDocument();
  expect(screen.getByText('Visita', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getAllByText('91%')).toHaveLength(2);
  expect(screen.getByText('36.4%')).toBeInTheDocument();
});

test('offers a retry when the indicators cannot be loaded', async () => {
  fetchDashboardSummary.mockRejectedValueOnce({ response: { data: { error: { message: 'Falha no servidor.' } } } });
  render(<MemoryRouter><DashboardOverview /></MemoryRouter>);

  expect(await screen.findByRole('alert')).toHaveTextContent('Falha no servidor.');
  expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
});
