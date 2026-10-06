// Gráficos do painel em CSS/SVG puros (sem biblioteca), com alternativa em texto para leitores de tela.
// Cores sempre via --admin-series-N (mapa em constants/statusLabels.js).
import { useEffect, useRef } from 'react';
import { seriesColor } from '../constants/statusLabels';

// Linha pequena (sparkline) para os cartões de indicador.
export function Sparkline({ values, series = 1 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${30 - (value / max) * 26}`)
    .join(' ');

  return (
    <svg aria-hidden="true" className="dashboard-sparkline" preserveAspectRatio="none" viewBox="0 0 100 32">
      <polyline fill="none" points={points} stroke={seriesColor(series)} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Pizza com legenda (rótulo, quantidade e percentual em texto).
export function PieChart({ items, label }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;
  const segments = items.map((item) => {
    const end = start + (total ? (item.value / total) * 100 : 0);
    const segment = `${seriesColor(item.series)} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  return (
    <div className="dashboard-pie">
      <div
        aria-label={`${label}: ${items.map((item) => `${item.label} ${item.value}`).join(', ')}`}
        className="dashboard-pie-chart"
        role="img"
        style={{ background: total ? `conic-gradient(${segments.join(', ')})` : undefined }}
      >
        <span><strong>{total}</strong> total</span>
      </div>
      <ul className="dashboard-legend">
        {items.map((item) => (
          <li key={item.key}>
            <span className="dashboard-swatch" style={{ background: seriesColor(item.series) }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{total ? Math.round((item.value / total) * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Medidor circular (donut) com o percentual no centro.
export function Gauge({ label, value, detail, series = 1 }) {
  return (
    <figure className="dashboard-gauge">
      <div
        aria-label={`${label}: ${value}%`}
        className="dashboard-gauge-ring"
        role="img"
        style={{ background: `conic-gradient(${seriesColor(series)} ${value}%, var(--admin-surface-sunken) 0)` }}
      >
        <span>{Math.round(value)}%</span>
      </div>
      <figcaption>
        <strong>{label}</strong>
        <small>{detail}</small>
      </figcaption>
    </figure>
  );
}

// Barras verticais por mês, com valor sobre cada barra e tabela alternativa.
export function MonthlyBars({ rows, formatValue, caption, series = 1 }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const columnsRef = useRef(null);

  // No celular as colunas rolam na horizontal: começa mostrando os meses mais recentes (à direita).
  useEffect(() => {
    const element = columnsRef.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, [rows]);

  return (
    <>
      <div aria-hidden="true" className="dashboard-columns" ref={columnsRef}>
        {rows.map((row) => (
          <div className="dashboard-column" key={row.key}>
            <small>{row.value ? formatValue(row.value) : ''}</small>
            <span className="dashboard-column-track">
              <span className="dashboard-column-fill" style={{ height: `${(row.value / max) * 100}%`, background: seriesColor(series) }} />
            </span>
            <span className="dashboard-column-label">{row.label}</span>
          </div>
        ))}
      </div>
      <table className="admin-visually-hidden">
        <caption>{caption}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}><th scope="row">{row.label}</th><td>{formatValue(row.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
