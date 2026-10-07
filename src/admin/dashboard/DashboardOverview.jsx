import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, PawPrint, RotateCw, Search } from 'lucide-react';
import { fetchDashboardSummary } from './dashboardService';
import { Gauge, MonthlyBars, PieChart, Sparkline } from './DashboardCharts';
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
import ListState from 'admin/shared/ListState';
import { errorMessage } from 'admin/shared/usePaginatedList';
import './DashboardOverview.css';

const REFRESH_INTERVAL_MS = 60000;
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const AGENDA_TYPES = { visita: 'Visita', entrevista: 'Entrevista', termo_pendente: 'Termo a assinar' };
const MONTHLY_SOURCES = {
  doacoes_total: { label: 'Doações (R$)', format: formatCurrency, series: 1 },
  doacoes_quantidade: { label: 'Doações (quantidade)', format: (value) => String(value), series: 2 },
  adocoes: { label: 'Adoções', format: (value) => String(value), series: 3 },
};

function monthLabel(month) {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`)).replace('.', '');
}

// Exporta a agenda filtrada em CSV (separador ";" e BOM para o Excel em português).
function exportAgenda(rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['Tipo', 'Adotante', 'Animal', 'Responsável', 'Quando'].map(escape).join(';'),
    ...rows.map((item) => [
      AGENDA_TYPES[item.tipo],
      item.adotante_nome,
      item.animal_nome,
      item.responsavel_nome || 'Sem responsável',
      item.tipo === 'termo_pendente' ? `Aprovado em ${formatDate(item.referencia_em)}` : formatDateTime(item.referencia_em),
    ].map(escape).join(';')),
  ];
  const url = URL.createObjectURL(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `agenda-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animalQuery, setAnimalQuery] = useState('');
  const [monthlySource, setMonthlySource] = useState('doacoes_total');
  const [monthlyPeriod, setMonthlyPeriod] = useState('12');
  const [agendaType, setAgendaType] = useState('');

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
    load();
    const timer = window.setInterval(() => load(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!summary) {
    return <ListState loading={loading} error={error} onRetry={() => load({ fresh: true })} />;
  }

  const { indicadores, animais, pedidos, doacoes, series_mensais: series, agenda } = summary;
  const countByStatus = Object.fromEntries(animais.por_status.map((row) => [row.status, row.total]));
  const months = series.slice(-Number(monthlyPeriod));
  const source = MONTHLY_SOURCES[monthlySource];
  const agendaRows = agendaType ? agenda.filter((item) => item.tipo === agendaType) : agenda;

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
      <div className="dashboard-toolbar">
        <p>
          Atualizado em {formatDate(summary.atualizado_em)} às{' '}
          {new Date(summary.atualizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <button className="admin-button" onClick={() => load({ fresh: true })} type="button">
          <RotateCw aria-hidden="true" size={15} /> Atualizar
        </button>
      </div>
      {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

      <div className="dashboard-grid">
        <section aria-labelledby="dash-destaque" className="dashboard-highlight">
          <div className="dashboard-highlight-head">
            <span aria-hidden="true" className="dashboard-highlight-icon"><PawPrint size={20} /></span>
            <h2 id="dash-destaque">Animais sob cuidado</h2>
          </div>
          <p className="dashboard-highlight-value">{indicadores.animais_sob_cuidado}</p>
          <p className="dashboard-highlight-caption">{indicadores.total_animais} animais cadastrados no total</p>
          <dl className="dashboard-mini-stats">
            <div><dt>Disponíveis</dt><dd>{countByStatus.disponivel || 0}</dd></div>
            <div><dt>Em processo</dt><dd>{countByStatus.em_processo || 0}</dd></div>
            <div><dt>Urgentes</dt><dd>{countByStatus.urgente || 0}</dd></div>
            <div><dt>Taxa de adoção</dt><dd>{animais.saude.percentual_adotados}%</dd></div>
          </dl>
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

        <section aria-label="Indicadores" className="dashboard-metrics">
          {metricCards.map((card) => (
            <article className="dashboard-metric" key={card.label}>
              <div>
                <span className="dashboard-metric-label">{card.label}</span>
                <strong className="dashboard-metric-value">{card.value}</strong>
                <small>{card.period}</small>
              </div>
              <div className="dashboard-metric-side">
                <Sparkline series={card.series} values={card.spark} />
                <span className={`admin-badge is-${card.badge.variant}`}>{card.badge.label}</span>
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="dash-pedidos" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-pedidos">Pedidos por status</h2>
            <Link className="dashboard-link" to="/admin/adocoes">Ver pedidos</Link>
          </div>
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

        <section aria-labelledby="dash-origem" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-origem">Origem das doações</h2>
            <p>Confirmadas · 12 meses</p>
          </div>
          {doacoes.por_metodo.length === 0 ? <p className="dashboard-empty">Nenhuma doação confirmada no período.</p> : (
            <PieChart
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

        <section aria-labelledby="dash-mensal" className="admin-card dashboard-two-thirds">
          <div className="admin-card-header">
            <h2 id="dash-mensal">Doações e adoções por mês</h2>
            <div className="dashboard-chart-filters">
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
          <MonthlyBars
            caption={`${source.label} por mês`}
            formatValue={source.format}
            rows={months.map((month) => ({ key: month.mes, label: monthLabel(month.mes), value: month[monthlySource] }))}
            series={source.series}
          />
        </section>

        <section aria-labelledby="dash-listas" className="admin-card dashboard-third">
          <div className="admin-card-header">
            <h2 id="dash-listas">Pedidos novos</h2>
            <Link className="dashboard-link" to="/admin/adocoes?status=novo">Ver todos</Link>
          </div>
          {pedidos.recentes.length === 0 ? <p className="dashboard-empty">Nenhum pedido novo aguardando triagem.</p> : (
            <ul className="dashboard-list">
              {pedidos.recentes.map((pedido) => {
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
                    <th scope="col">Tipo</th>
                    <th scope="col">Adotante</th>
                    <th scope="col">Animal</th>
                    <th scope="col">Responsável</th>
                    <th scope="col">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaRows.map((item) => (
                    <tr key={`${item.tipo}-${item.id || item.pedido_id}`}>
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
