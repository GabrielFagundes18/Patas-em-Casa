/*
 * ============================================================================
 * ARQUIVO: DashboardOverview.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a VISÃO GERAL do painel (aba inicial /admin). Mostra os indicadores da ONG:
 *   destaque de animais sob cuidado (com busca rápida), cartões de métricas com
 *   minigráficos, pedidos por status (pizza), saúde dos animais (medidores),
 *   origem das doações, gráfico mensal de doações/adoções, pedidos novos, animais
 *   urgentes e a agenda (visitas, entrevistas e termos pendentes), que pode ser
 *   exportada em CSV. Os dados se atualizam sozinhos a cada minuto.
 *
 * PRINCIPAIS ITENS:
 *   - REFRESH_INTERVAL_MS, monthFormatter, AGENDA_TYPES, MONTHLY_SOURCES: configurações.
 *   - monthLabel(month): "2026-10" → "out" (interna).
 *   - exportAgenda(rows): baixa a agenda em CSV (interna).
 *   - DashboardOverview(): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useNavigate), lucide-react.
 *   - ./dashboardService        → fetchDashboardSummary.
 *   - ./DashboardCharts         → Gauge, MonthlyBars, PieChart, Sparkline.
 *   - admin/constants/statusLabels → rótulos, cores e formatadores.
 *   - admin/shared/ListState    → estados de carregando/erro.
 *   - admin/shared/usePaginatedList → errorMessage.
 *   - ./DashboardOverview.css   → estilos.
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba padrão).
 *   - Testado em: ./DashboardOverview.test.js.
 * ============================================================================
 */

// Hooks do React.
import { useCallback, useEffect, useState } from 'react';
// Link e navegação pelo código.
import { Link, useNavigate } from 'react-router-dom';
// Ícones.
import { Download, PawPrint, RotateCw, Search } from 'lucide-react';
// Busca do resumo na API.
import { fetchDashboardSummary } from './dashboardService';
// Componentes de gráfico.
import { Gauge, MonthlyBars, PieChart, Sparkline } from './DashboardCharts';
// Rótulos, cores e formatadores.
import {
  adoptionStatusMap,
  donationMethodLabels,
  donationMethodSeries,
  formatCurrency,
  formatDate,
  formatDateTime,
  priorityMap,
  statusOf,
} from 'admin/constants/statusLabels';
// Estados de carregando/erro.
import ListState from 'admin/shared/ListState';
// Mensagem de erro da API.
import { errorMessage } from 'admin/shared/usePaginatedList';
// Estilos.
import './DashboardOverview.css';

// Atualiza os indicadores automaticamente a cada 60 segundos.
const REFRESH_INTERVAL_MS = 60000;
// Formatador do nome curto do mês ("out", "nov"...) em UTC (para não mudar o mês pelo fuso).
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
// Tipos de compromisso da agenda e seus rótulos.
const AGENDA_TYPES = { visita: 'Visita', entrevista: 'Entrevista', termo_pendente: 'Termo a assinar' };
// Fontes do gráfico mensal: rótulo, como formatar o valor e a cor (série).
const MONTHLY_SOURCES = {
  doacoes_total: { label: 'Doações (R$)', format: formatCurrency, series: 1 },
  doacoes_quantidade: { label: 'Doações (quantidade)', format: (value) => String(value), series: 2 },
  adocoes: { label: 'Adoções', format: (value) => String(value), series: 3 },
};

/*
 * FUNÇÃO: monthLabel (interna)
 * O que faz: transforma "AAAA-MM" no nome curto do mês, sem ponto.
 * Parâmetros: month (string) — ex.: '2026-10'.
 * Retorno (string): ex.: 'out'.
 */
function monthLabel(month) {
  // Monta o dia 1 do mês em UTC, formata ("out.") e remove o ponto.
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`)).replace('.', '');
}

/*
 * FUNÇÃO: exportAgenda (interna)
 * O que faz: gera um arquivo CSV com a agenda filtrada e faz o download.
 * Parâmetros: rows (array) — itens da agenda.
 * Retorno: nada.
 * Detalhes: usa ";" como separador e começa com um BOM (caractere invisível U+FEFF)
 *   para o Excel em português reconhecer os acentos (UTF-8).
 */
// Exporta a agenda filtrada em CSV (separador ";" e BOM para o Excel em português).
function exportAgenda(rows) {
  // Coloca o valor entre aspas e duplica aspas internas (regra do formato CSV).
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  // Linhas do CSV: cabeçalho + uma linha por item.
  const lines = [
    ['Tipo', 'Adotante', 'Animal', 'Responsável', 'Quando'].map(escape).join(';'),
    ...rows.map((item) => [
      AGENDA_TYPES[item.tipo],
      item.adotante_nome,
      item.animal_nome,
      item.responsavel_nome || 'Sem responsável',
      // Termo pendente mostra a data de aprovação; visita/entrevista, a data e hora marcadas.
      item.tipo === 'termo_pendente' ? `Aprovado em ${formatDate(item.referencia_em)}` : formatDateTime(item.referencia_em),
    ].map(escape).join(';')),
  ];
  // Cria o arquivo em memória (BOM + linhas separadas por "\r\n", o padrão de quebra do Windows).
  // ATENÇÃO: logo depois da crase de abertura há um caractere invisível (BOM, U+FEFF).
  const url = URL.createObjectURL(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
  // Link temporário para baixar com o nome "agenda-AAAA-MM-DD.csv".
  const link = document.createElement('a');
  link.href = url;
  link.download = `agenda-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  // Libera a memória.
  URL.revokeObjectURL(url);
}

/*
 * COMPONENTE: DashboardOverview
 * O que faz: carrega o resumo e desenha todos os blocos da visão geral.
 * Parâmetros: nenhum.
 * Retorno: JSX da visão geral (ou o estado de carregando/erro).
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function DashboardOverview() {
  // Navegação (busca rápida de animais).
  const navigate = useNavigate();
  // Resumo vindo da API.
  const [summary, setSummary] = useState(null);
  // Carregando o primeiro resumo?
  const [loading, setLoading] = useState(true);
  // Mensagem de erro.
  const [error, setError] = useState('');
  // Texto da busca rápida de animais.
  const [animalQuery, setAnimalQuery] = useState('');
  // Fonte e período do gráfico mensal.
  const [monthlySource, setMonthlySource] = useState('doacoes_total');
  const [monthlyPeriod, setMonthlyPeriod] = useState('12');
  // Filtro da agenda ('' = tudo).
  const [agendaType, setAgendaType] = useState('');

  // Função que carrega (ou recarrega) o resumo. useCallback com [] a mantém estável
  // (ela é dependência do useEffect abaixo).
  const load = useCallback(async ({ fresh = false } = {}) => {
    setError('');
    try {
      setSummary(await fetchDashboardSummary({ fresh }));
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar os indicadores.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualização automática periódica, além do botão "Atualizar".
  useEffect(() => {
    // Carrega já ao abrir.
    load();
    // setInterval repete a função a cada intervalo (aqui, 60 s).
    const timer = window.setInterval(() => load(), REFRESH_INTERVAL_MS);
    // Limpeza: para de repetir ao sair da tela.
    return () => window.clearInterval(timer);
  }, [load]);

  // Ainda sem resumo: mostra carregando ou erro (com "Tentar novamente" pedindo dados frescos).
  if (!summary) {
    return <ListState loading={loading} error={error} onRetry={() => load({ fresh: true })} />;
  }

  // Desestrutura as partes do resumo ("series_mensais: series" renomeia para "series").
  const { indicadores, animais, pedidos, doacoes, series_mensais: series, agenda } = summary;
  // Contagem de animais por status, como objeto: { disponivel: 10, urgente: 2, ... }.
  const countByStatus = Object.fromEntries(animais.por_status.map((row) => [row.status, row.total]));
  // Últimos N meses (6 ou 12): slice com número negativo pega do fim.
  const months = series.slice(-Number(monthlyPeriod));
  // Configuração da fonte escolhida para o gráfico mensal.
  const source = MONTHLY_SOURCES[monthlySource];
  // Agenda filtrada pelo tipo (ou toda).
  const agendaRows = agendaType ? agenda.filter((item) => item.tipo === agendaType) : agenda;

  // Dados dos 4 cartões de métrica (rótulo, valor, período, selo, minigráfico e cor).
  const metricCards = [
    {
      label: 'Adoções no mês',
      value: indicadores.adocoes_mes,
      period: `${indicadores.adocoes_ano} no ano`,
      badge: { label: `${indicadores.total_adocoes} no total`, variant: 'success' },
      spark: series.map((month) => month.adocoes),
      series: 3,
    },
    {
      label: 'Arrecadado no mês',
      value: formatCurrency(indicadores.arrecadado_mes),
      period: 'Doações confirmadas',
      badge: { label: '12 meses', variant: 'available' },
      spark: series.map((month) => month.doacoes_total),
      series: 1,
    },
    {
      label: 'Pedidos pendentes',
      value: indicadores.pedidos_pendentes,
      period: 'Novos, em análise ou com visita',
      // Selo muda conforme haja pedidos pendentes ou não.
      badge: { label: indicadores.pedidos_pendentes > 0 ? 'Aguardando triagem' : 'Em dia', variant: indicadores.pedidos_pendentes > 0 ? 'pending' : 'success' },
      spark: [],
    },
    {
      label: 'Animais urgentes',
      value: countByStatus.urgente || 0,
      period: 'Precisam de lar com prioridade',
      badge: { label: (countByStatus.urgente || 0) > 0 ? 'Urgente' : 'Nenhum', variant: (countByStatus.urgente || 0) > 0 ? 'urgent' : 'muted' },
      spark: [],
    },
  ];

  return (
    <div className="dashboard">
      {/* ===== Barra: horário da atualização e botão "Atualizar" ===== */}
      <div className="dashboard-toolbar">
        <p>
          Atualizado em {formatDate(summary.atualizado_em)} às{' '}
          {new Date(summary.atualizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {/* Pede dados recalculados (fresh: true). */}
        <button className="admin-button" onClick={() => load({ fresh: true })} type="button">
          <RotateCw aria-hidden="true" size={15} /> Atualizar
        </button>
      </div>
      {/* Erro numa atualização (o resumo anterior continua na tela). */}
      {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

      {/* ===== Grade de blocos ===== */}
      <div className="dashboard-grid">
        {/* --- Destaque: animais sob cuidado --- */}
        <section aria-labelledby="dash-destaque" className="dashboard-highlight">
          <div className="dashboard-highlight-head">
            <span aria-hidden="true" className="dashboard-highlight-icon"><PawPrint size={20} /></span>
            <h2 id="dash-destaque">Animais sob cuidado</h2>
          </div>
          <p className="dashboard-highlight-value">{indicadores.animais_sob_cuidado}</p>
          <p className="dashboard-highlight-caption">{indicadores.total_animais} animais cadastrados no total</p>
          {/* Mini estatísticas (lista de definições). */}
          <dl className="dashboard-mini-stats">
            <div><dt>Disponíveis</dt><dd>{countByStatus.disponivel || 0}</dd></div>
            <div><dt>Em processo</dt><dd>{countByStatus.em_processo || 0}</dd></div>
            <div><dt>Urgentes</dt><dd>{countByStatus.urgente || 0}</dd></div>
            <div><dt>Taxa de adoção</dt><dd>{animais.saude.percentual_adotados}%</dd></div>
          </dl>
          {/* Busca rápida: ao enviar, abre a aba Animais já filtrada (?q=nome). */}
          <form
            className="dashboard-highlight-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(animalQuery.trim() ? `/admin/animais?q=${encodeURIComponent(animalQuery.trim())}` : '/admin/animais');
            }}
            role="search"
          >
            <Search aria-hidden="true" size={16} />
            <input aria-label="Buscar animal pelo nome" onChange={(event) => setAnimalQuery(event.target.value)} placeholder="Buscar animal pelo nome" value={animalQuery} />
          </form>
        </section>

        {/* --- Cartões de métrica --- */}
        <section aria-label="Indicadores" className="dashboard-metrics">
          {metricCards.map((card) => (
            <article className="dashboard-metric" key={card.label}>
              <div>
                <span className="dashboard-metric-label">{card.label}</span>
                <strong className="dashboard-metric-value">{card.value}</strong>
                <small>{card.period}</small>
              </div>
              {/* Minigráfico (some se não houver dados) e selo. */}
              <div className="dashboard-metric-side">
                <Sparkline series={card.series} values={card.spark} />
                <span className={`admin-badge is-${card.badge.variant}`}>{card.badge.label}</span>
              </div>
            </article>
          ))}
        </section>

        {/* --- Pedidos por status (pizza) --- */}
        <section aria-labelledby="dash-pedidos" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-pedidos">Pedidos por status</h2>
            <Link className="dashboard-link" to="/admin/adocoes">Ver pedidos</Link>
          </div>
          {/* Sem pedidos: mensagem; com pedidos: converte cada linha em fatia (rótulo e cor do status). */}
          {pedidos.por_status.length === 0 ? <p className="dashboard-empty">Nenhum pedido registrado.</p> : (
            <PieChart
              items={pedidos.por_status.map((row) => {
                const status = statusOf(adoptionStatusMap, row.status);
                return { key: row.status, label: status.label, value: row.total, series: status.series };
              })}
              label="Pedidos de adoção por status"
            />
          )}
        </section>

        {/* --- Saúde dos animais (3 medidores) --- */}
        <section aria-labelledby="dash-saude" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-saude">Saúde dos animais</h2>
            <p>{animais.saude.total} cadastrados</p>
          </div>
          <div className="dashboard-gauges">
            <Gauge detail={`${animais.saude.vacinados} animais`} label="Vacinados" series={1} value={animais.saude.percentual_vacinados} />
            <Gauge detail={`${animais.saude.castrados} animais`} label="Castrados" series={2} value={animais.saude.percentual_castrados} />
            <Gauge detail={`${animais.saude.adotados} animais`} label="Adotados" series={3} value={animais.saude.percentual_adotados} />
          </div>
        </section>

        {/* --- Origem das doações (pizza por método de pagamento) --- */}
        <section aria-labelledby="dash-origem" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-origem">Origem das doações</h2>
            <p>Confirmadas · 12 meses</p>
          </div>
          {doacoes.por_metodo.length === 0 ? <p className="dashboard-empty">Nenhuma doação confirmada no período.</p> : (
            <PieChart
              // O rótulo junta o nome do método e o total em reais; o tamanho da fatia é a quantidade.
              items={doacoes.por_metodo.map((row) => ({
                key: row.metodo,
                label: `${donationMethodLabels[row.metodo] || row.metodo} · ${formatCurrency(row.total)}`,
                value: row.quantidade,
                series: donationMethodSeries[row.metodo],
              }))}
              label="Quantidade de doações por método"
            />
          )}
        </section>

        {/* --- Gráfico mensal (fonte e período escolhidos) --- */}
        <section aria-labelledby="dash-mensal" className="admin-card dashboard-two-thirds">
          <div className="admin-card-header">
            <h2 id="dash-mensal">Doações e adoções por mês</h2>
            <div className="dashboard-chart-filters">
              {/* Rótulos escondidos visualmente, mas lidos por leitores de tela. */}
              <label>
                <span className="admin-visually-hidden">Fonte</span>
                <select className="admin-select" onChange={(event) => setMonthlySource(event.target.value)} value={monthlySource}>
                  {Object.entries(MONTHLY_SOURCES).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <span className="admin-visually-hidden">Período</span>
                <select className="admin-select" onChange={(event) => setMonthlyPeriod(event.target.value)} value={monthlyPeriod}>
                  <option value="6">Últimos 6 meses</option>
                  <option value="12">Últimos 12 meses</option>
                </select>
              </label>
            </div>
          </div>
          {/* month[monthlySource] lê o campo escolhido (ex.: month.doacoes_total). */}
          <MonthlyBars
            caption={`${source.label} por mês`}
            formatValue={source.format}
            rows={months.map((month) => ({ key: month.mes, label: monthLabel(month.mes), value: month[monthlySource] }))}
            series={source.series}
          />
        </section>

        {/* --- Pedidos novos e animais urgentes --- */}
        <section aria-labelledby="dash-listas" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-listas">Pedidos novos</h2>
            <Link className="dashboard-link" to="/admin/adocoes?status=novo">Ver todos</Link>
          </div>
          {pedidos.recentes.length === 0 ? <p className="dashboard-empty">Nenhum pedido novo aguardando triagem.</p> : (
            <ul className="dashboard-list">
              {pedidos.recentes.map((pedido) => {
                // Rótulo e cor da prioridade.
                const priority = statusOf(priorityMap, pedido.prioridade);
                return (
                  <li key={pedido.id}>
                    <strong>{pedido.adotante_nome}</strong>
                    <span>quer adotar {pedido.animal.nome} · {formatDate(pedido.data_pedido)}</span>
                    <span className={`admin-badge is-${priority.variant}`}>{priority.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <h3 className="dashboard-subtitle">Animais urgentes</h3>
          {animais.urgentes.length === 0 ? <p className="dashboard-empty">Nenhum animal marcado como urgente.</p> : (
            <ul className="dashboard-list">
              {animais.urgentes.map((animal) => (
                <li key={animal.id}>
                  <strong>{animal.nome}</strong>
                  <span>{animal.especie} · na ONG desde {formatDate(animal.data_entrada)}</span>
                  <span className="admin-badge is-urgent">Urgente</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Agenda (tabela com filtro e exportação) --- */}
        <section aria-labelledby="dash-agenda" className="admin-card dashboard-full">
          <div className="admin-card-header">
            <div>
              <h2 id="dash-agenda">Agenda</h2>
              <p>Visitas e entrevistas marcadas e termos de adoção pendentes</p>
            </div>
            <div className="dashboard-chart-filters">
              <label>
                <span className="admin-visually-hidden">Filtrar agenda</span>
                <select className="admin-select" onChange={(event) => setAgendaType(event.target.value)} value={agendaType}>
                  <option value="">Filtrar: tudo</option>
                  {Object.entries(AGENDA_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {/* Exportar fica desabilitado quando não há linhas. */}
              <button className="admin-button" disabled={agendaRows.length === 0} onClick={() => exportAgenda(agendaRows)} type="button">
                <Download aria-hidden="true" size={15} /> Exportar
              </button>
            </div>
          </div>
          {agendaRows.length === 0 ? <p className="dashboard-empty">Nenhum compromisso pendente.</p> : (
            <div className="admin-table-wrap dashboard-agenda">
              <table className="admin-table">
                <thead>
                  <tr>
                    {/* scope="col": cabeçalho de coluna (acessibilidade de tabelas). */}
                    <th scope="col">Tipo</th>
                    <th scope="col">Adotante</th>
                    <th scope="col">Animal</th>
                    <th scope="col">Responsável</th>
                    <th scope="col">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaRows.map((item) => (
                    // key combina tipo e id (termos pendentes usam o id do pedido).
                    <tr key={`${item.tipo}-${item.id || item.pedido_id}`}>
                      {/* data-label: nome da coluna mostrado pelo CSS no celular. */}
                      <td data-label="Tipo">
                        <span className={`admin-badge is-${item.tipo === 'termo_pendente' ? 'pending' : 'available'}`}>{AGENDA_TYPES[item.tipo] || item.tipo}</span>
                      </td>
                      <td data-label="Adotante"><span className="admin-cell-title">{item.adotante_nome}</span></td>
                      <td data-label="Animal">{item.animal_nome}</td>
                      <td data-label="Responsável">{item.responsavel_nome || 'Sem responsável'}</td>
                      <td data-label="Quando">
                        {item.tipo === 'termo_pendente' ? `Aprovado em ${formatDate(item.referencia_em)}` : formatDateTime(item.referencia_em)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir, carrega o resumo e programa uma nova carga a cada 60 s.
 *   2. Sem resumo ainda: mostra carregando/erro (ListState).
 *   3. Com o resumo: calcula dados derivados (contagem por status, meses do gráfico,
 *      agenda filtrada, cartões) e desenha os blocos com os componentes de gráfico.
 *   4. Interações: "Atualizar" (dados frescos), busca rápida de animal (navega para a
 *      aba Animais), filtros do gráfico mensal e da agenda, exportação da agenda em CSV.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Atualização periódica com setInterval/clearInterval no useEffect.
 *   - useCallback para funções usadas como dependência.
 *   - Dados derivados calculados na renderização (sem guardar em estado).
 *   - Geração de CSV no navegador: escape de aspas, separador ";", BOM UTF-8 e "\r\n".
 *   - Desestruturação com renomeação e slice com índice negativo.
 *   - Tabelas acessíveis (scope, caption) e rótulos escondidos visualmente.
 *   - Intl.DateTimeFormat e toLocaleTimeString.
 * ============================================================================
 */
