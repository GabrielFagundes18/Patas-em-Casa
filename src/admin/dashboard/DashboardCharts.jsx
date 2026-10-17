/*
 * ============================================================================
 * ARQUIVO: DashboardCharts.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Componentes de GRÁFICO da visão geral do painel, feitos só com CSS e SVG
 *   (sem biblioteca de gráficos). Cada gráfico tem também uma alternativa em
 *   texto para leitores de tela (acessibilidade).
 *
 * PRINCIPAIS ITENS (todos exportados):
 *   - Sparkline({ values, series })              → minigráfico de linha (SVG).
 *   - PieChart({ items, label })                 → gráfico de pizza (conic-gradient) com legenda.
 *   - Gauge({ label, value, detail, series })    → medidor circular com percentual.
 *   - MonthlyBars({ rows, formatValue, caption, series }) → barras por mês + tabela oculta.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useRef).
 *   - admin/constants/statusLabels → seriesColor (cores --admin-series-N).
 *   - Estilos .dashboard-* em admin/dashboard/DashboardOverview.css.
 *   - Usado por: admin/dashboard/DashboardOverview.jsx.
 * ============================================================================
 */

// Gráficos do painel em CSS/SVG puros (sem biblioteca), com alternativa em texto para leitores de tela.
// Cores sempre via --admin-series-N (mapa em constants/statusLabels.js).
// Hooks do React.
import { useEffect, useRef } from 'react';
// Converte o número da série numa cor CSS: 2 → "var(--admin-series-2)".
import { seriesColor } from 'admin/constants/statusLabels';

/*
 * COMPONENTE: Sparkline
 * O que faz: desenha uma linha pequena mostrando a tendência de uma série de números.
 * Parâmetros (props):
 *   - values (array de números): os valores, em ordem (ex.: por mês).
 *   - series (number, padrão 1): qual cor de série usar.
 * Retorno: um <svg> com uma <polyline>, ou null se houver menos de 2 valores.
 * Onde é usado: nos cartões de indicador do DashboardOverview.
 */
// Linha pequena (sparkline) para os cartões de indicador.
export function Sparkline({ values, series = 1 }) {
  // Com menos de 2 pontos não dá para desenhar uma linha.
  if (values.length < 2) return null;
  // Maior valor (no mínimo 1, para não dividir por zero). "...values" passa cada valor como argumento.
  const max = Math.max(...values, 1);
  // Converte cada valor num ponto "x,y" dentro de um quadro de 100 × 32:
  //   x vai de 0 a 100, distribuído igualmente pelos índices;
  //   y: no SVG o eixo cresce PARA BAIXO, então "30 − (valor/max)·26" põe valores maiores mais acima.
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${30 - (value / max) * 26}`)
    .join(' ');

  return (
    // aria-hidden: puramente decorativo (o número do cartão já informa o valor).
    // viewBox define o sistema de coordenadas (0 0 100 32); preserveAspectRatio="none" estica para caber.
    <svg aria-hidden="true" className="dashboard-sparkline" preserveAspectRatio="none" viewBox="0 0 100 32">
      {/* polyline liga os pontos com retas. vectorEffect="non-scaling-stroke" mantém a espessura da linha
          mesmo quando o SVG é esticado. */}
      <polyline fill="none" points={points} stroke={seriesColor(series)} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/*
 * COMPONENTE: PieChart
 * O que faz: desenha uma pizza (com CSS conic-gradient) e a legenda com quantidades e percentuais.
 * Parâmetros (props):
 *   - items (array): { key, label, value, series } de cada fatia.
 *   - label (string): nome do gráfico (usado no texto acessível).
 * Retorno: JSX com o gráfico e a legenda.
 * Onde é usado: DashboardOverview (ex.: adoções por status).
 */
// Pizza com legenda (rótulo, quantidade e percentual em texto).
export function PieChart({ items, label }) {
  // Soma de todos os valores. reduce acumula: começa em 0 e soma item.value a cada passo.
  const total = items.reduce((sum, item) => sum + item.value, 0);
  // Onde a próxima fatia começa (em %).
  let start = 0;
  // Cada fatia vira um trecho do conic-gradient: "cor início% fim%".
  const segments = items.map((item) => {
    // Fim desta fatia = início + percentual dela (0 se total for 0).
    const end = start + (total ? (item.value / total) * 100 : 0);
    const segment = `${seriesColor(item.series)} ${start}% ${end}%`;
    // A próxima fatia começa onde esta termina.
    start = end;
    return segment;
  });

  return (
    <div className="dashboard-pie">
      {/* O círculo: role="img" + aria-label descreve o gráfico em texto para leitores de tela.
          conic-gradient desenha cores "girando" em volta do centro, formando as fatias. */}
      <div
        aria-label={`${label}: ${items.map((item) => `${item.label} ${item.value}`).join(', ')}`}
        className="dashboard-pie-chart"
        role="img"
        style={{ background: total ? `conic-gradient(${segments.join(', ')})` : undefined }}
      >
        {/* Total no centro. */}
        <span><strong>{total}</strong> total</span>
      </div>
      {/* Legenda: cor, rótulo, quantidade e percentual de cada fatia. */}
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

/*
 * COMPONENTE: Gauge
 * O que faz: medidor circular (anel) preenchido até o percentual, com o número no centro.
 * Parâmetros (props):
 *   - label (string): nome do indicador.
 *   - value (number): percentual (0 a 100).
 *   - detail (string): texto complementar (ex.: "12 de 20").
 *   - series (number, padrão 1): cor.
 * Retorno: JSX de um <figure>.
 * Onde é usado: DashboardOverview (ex.: taxa de adoção).
 */
// Medidor circular (donut) com o percentual no centro.
export function Gauge({ label, value, detail, series = 1 }) {
  return (
    // <figure> + <figcaption>: conteúdo ilustrativo com legenda.
    <figure className="dashboard-gauge">
      {/* conic-gradient: cor da série até value%, e cor de fundo ("0" = continua dali até o fim). */}
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

/*
 * COMPONENTE: MonthlyBars
 * O que faz: barras verticais por mês, com o valor acima de cada barra, e uma tabela
 *   escondida visualmente com os mesmos dados (para leitores de tela).
 * Parâmetros (props):
 *   - rows (array): { key, label, value } por mês.
 *   - formatValue (função): formata o valor (ex.: formatCurrency).
 *   - caption (string): título da tabela acessível.
 *   - series (number, padrão 1): cor das barras.
 * Retorno: JSX (fragmento com o gráfico e a tabela).
 * Onde é usado: DashboardOverview (ex.: doações por mês).
 */
// Barras verticais por mês, com valor sobre cada barra e tabela alternativa.
export function MonthlyBars({ rows, formatValue, caption, series = 1 }) {
  // Maior valor (mínimo 1), para calcular a altura proporcional das barras.
  const max = Math.max(...rows.map((row) => row.value), 1);
  // Referência ao contêiner das colunas (para controlar a rolagem horizontal).
  const columnsRef = useRef(null);

  // No celular as colunas rolam na horizontal: começa mostrando os meses mais recentes (à direita).
  useEffect(() => {
    const element = columnsRef.current;
    // scrollLeft = scrollWidth rola até o fim (direita).
    if (element) element.scrollLeft = element.scrollWidth;
  }, [rows]);

  return (
    <>
      {/* Gráfico visual (escondido dos leitores de tela; eles leem a tabela abaixo). */}
      <div aria-hidden="true" className="dashboard-columns" ref={columnsRef}>
        {rows.map((row) => (
          <div className="dashboard-column" key={row.key}>
            {/* Valor acima da barra (vazio se for 0). */}
            <small>{row.value ? formatValue(row.value) : ''}</small>
            {/* "Trilho" da barra e o preenchimento com altura proporcional ao valor. */}
            <span className="dashboard-column-track">
              <span className="dashboard-column-fill" style={{ height: `${(row.value / max) * 100}%`, background: seriesColor(series) }} />
            </span>
            {/* Nome do mês. */}
            <span className="dashboard-column-label">{row.label}</span>
          </div>
        ))}
      </div>
      {/* Tabela com os mesmos dados, escondida visualmente (classe admin-visually-hidden). */}
      <table className="admin-visually-hidden">
        <caption>{caption}</caption>
        <tbody>
          {/* scope="row": a célula <th> é o cabeçalho da linha. */}
          {rows.map((row) => (
            <tr key={row.key}><th scope="row">{row.label}</th><td>{formatValue(row.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   - Sparkline: transforma valores em pontos de um SVG e liga com uma polyline.
 *   - PieChart e Gauge: usam conic-gradient (CSS) para desenhar fatias/anel a partir
 *     de percentuais calculados no JavaScript.
 *   - MonthlyBars: barras com altura em % do maior valor; no celular, rola até o fim.
 *   - Todos têm texto acessível: aria-label com role="img" ou uma tabela oculta.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - SVG básico: viewBox, polyline, stroke, preserveAspectRatio, vector-effect.
 *   - CSS conic-gradient para gráficos de pizza e anéis.
 *   - Array.reduce (somar), Math.max com spread, proporções e percentuais.
 *   - Estilos inline dinâmicos (style={{ ... }}).
 *   - Acessibilidade de gráficos: role="img" + aria-label, tabelas alternativas, aria-hidden.
 *   - useRef + useEffect para controlar a rolagem de um elemento.
 * ============================================================================
 */
