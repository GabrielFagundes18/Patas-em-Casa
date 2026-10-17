/*
 * ============================================================================
 * ARQUIVO: DashboardOverview.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da visão geral do painel: confere se os indicadores,
 *   listas e agenda vindos da API aparecem, e se há "Tentar novamente" quando a
 *   carga falha.
 *
 * PRINCIPAIS ITENS:
 *   - summary: um resumo de exemplo no formato da API.
 *   - 2 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./DashboardOverview.jsx → componente testado.
 *   - ./dashboardService       → fetchDashboardSummary substituído por mock.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { render, screen } from '@testing-library/react';
// O componente usa Link/useNavigate, então precisa de um roteador.
import { MemoryRouter } from 'react-router-dom';
// Componente testado.
import DashboardOverview from './DashboardOverview';
// Função de API (vira mock).
import { fetchDashboardSummary } from './dashboardService';

// Substitui o serviço por uma função falsa.
jest.mock('./dashboardService', () => ({ fetchDashboardSummary: jest.fn() }));

// Resumo de exemplo, imitando a resposta do backend.
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

// Teste 1: indicadores, listas e agenda reais aparecem.
test('shows real indicators, lists and agenda from the API', async () => {
  fetchDashboardSummary.mockResolvedValue(summary);
  render(<MemoryRouter><DashboardOverview /></MemoryRouter>);

  // Espera o destaque aparecer (a carga é assíncrona).
  expect(await screen.findByText('Animais sob cuidado')).toBeInTheDocument();
  // Número do destaque.
  expect(screen.getByText('7')).toBeInTheDocument();
  // Valor arrecadado formatado, procurado só dentro do elemento com a classe indicada (selector).
  expect(screen.getByText(/R\$\s?120,50/, { selector: '.dashboard-metric-value' })).toBeInTheDocument();
  // Animal urgente.
  expect(screen.getByText('Duque')).toBeInTheDocument();
  // Pedido recente com data formatada.
  expect(screen.getByText('quer adotar Nino · 04/10/2026')).toBeInTheDocument();
  // Agenda: selo "Visita".
  expect(screen.getByText('Visita', { selector: '.admin-badge' })).toBeInTheDocument();
  // Medidores: 90.9 arredondado vira 91% (aparece 2 vezes: vacinados e castrados).
  expect(screen.getAllByText('91%')).toHaveLength(2);
  // Taxa de adoção nas mini estatísticas (valor sem arredondar).
  expect(screen.getByText('36.4%')).toBeInTheDocument();
});

// Teste 2: falha na carga mostra o erro e o botão "Tentar novamente".
test('offers a retry when the indicators cannot be loaded', async () => {
  fetchDashboardSummary.mockRejectedValueOnce({ response: { data: { error: { message: 'Falha no servidor.' } } } });
  render(<MemoryRouter><DashboardOverview /></MemoryRouter>);

  expect(await screen.findByRole('alert')).toHaveTextContent('Falha no servidor.');
  expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O serviço falso devolve um resumo conhecido (ou um erro). O componente é
 *   desenhado e os testes conferem textos, números formatados e o estado de erro.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Dados de teste no mesmo formato da API.
 *   - getByText com a opção selector (restringir a um tipo de elemento/classe).
 *   - getAllByText + toHaveLength para contar ocorrências.
 *   - Testar formatação (moeda, datas, arredondamento).
 * ============================================================================
 */
