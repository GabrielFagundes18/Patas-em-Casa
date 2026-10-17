/*
 * ============================================================================
 * ARQUIVO: dashboardService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Busca no backend o RESUMO de indicadores do painel (visão geral): números
 *   de animais, adoções, doações, voluntários, gráficos por mês etc.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - fetchDashboardSummary({ fresh }): busca o resumo (opcionalmente sem cache).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - api/client.js → instância do axios.
 *   - Usado por: admin/dashboard/DashboardOverview.jsx.
 *   - No backend: rota GET /api/v1/dashboard/summary (módulo dashboard).
 * ============================================================================
 */

// Cliente HTTP configurado.
import api from 'api/client';

/*
 * FUNÇÃO: fetchDashboardSummary
 * O que faz: busca o resumo de indicadores do painel.
 * Parâmetros:
 *   - objeto opcional { fresh } (padrão {}):
 *       fresh (boolean, padrão false): true pede ao backend dados recalculados na hora
 *       (envia ?atualizar=true), ignorando o resumo guardado em cache.
 * Retorno (Promise → objeto): o resumo com os indicadores.
 * Onde é usada: DashboardOverview.jsx (ao abrir e no botão "Atualizar").
 */
export async function fetchDashboardSummary({ fresh = false } = {}) {
  // params: { atualizar: 'true' } só quando fresh for true; senão, nenhum parâmetro (undefined).
  const response = await api.get('/api/v1/dashboard/summary', { params: fresh ? { atualizar: 'true' } : undefined });
  // Devolve só os dados do resumo.
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   A visão geral do painel chama fetchDashboardSummary() ao abrir; o backend
 *   devolve os indicadores (possivelmente de um cache). Ao clicar em "Atualizar",
 *   a tela chama fetchDashboardSummary({ fresh: true }) para forçar o recálculo.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Cache no servidor e como pedir dados "frescos" (parâmetro de consulta).
 *   - Parâmetros opcionais com desestruturação e valor padrão.
 *   - Ternário para enviar ou não parâmetros.
 * ============================================================================
 */
