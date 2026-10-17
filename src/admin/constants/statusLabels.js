/*
 * ============================================================================
 * ARQUIVO: statusLabels.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Arquivo central de RÓTULOS e CORES do painel administrativo. Traduz os
 *   códigos que vêm do banco (ex.: 'em_analise', 'confirmada', 'pix') para textos
 *   amigáveis ('Em análise', 'Confirmada', 'Pix') e define a cor de cada um
 *   (selos e gráficos). Também traz funções de formatação de moeda e datas.
 *
 * PRINCIPAIS ITENS:
 *   - Mapas de status: adoptionStatusMap, priorityMap, donationStatusMap,
 *     subscriptionStatusMap, adopterStatusMap, appointmentStatusMap, volunteerStatusMap.
 *   - Rótulos simples: appointmentTypeLabels, donationTypeLabels, donationMethodLabels,
 *     volunteerAreaLabels; cores de gráfico: donationMethodSeries.
 *   - statusOf(map, value)     → procura um status com valor padrão seguro.
 *   - seriesColor(index)       → variável CSS da cor de gráfico.
 *   - formatDateTime(value)    → data e hora (Brasília).
 *   - formatCurrency(value)    → R$.
 *   - formatDate(value)        → data (Brasília ou AAAA-MM-DD).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por praticamente todas as telas do painel: adoptions, adopters,
 *     donations, volunteers, stories, team, dashboard...
 *   - "variant" → classes .admin-badge.is-* e "series" → variáveis --admin-series-N,
 *     ambas em admin/styles/admin.css.
 * ============================================================================
 */

// Arquivo único de rótulos e variantes visuais dos valores do banco (status, prioridades, métodos).
// "variant" escolhe a classe .admin-badge.is-* e "series" a cor de gráfico --admin-series-N
// (ambas definidas em src/admin/styles/admin.css somente com tokens do :root).
// Status dos pedidos de adoção.
export const adoptionStatusMap = {
  novo: { label: 'Novo', variant: 'pending', series: 2 },
  em_analise: { label: 'Em análise', variant: 'pending', series: 5 },
  visita_agendada: { label: 'Visita agendada', variant: 'available', series: 1 },
  aprovado: { label: 'Aprovado', variant: 'success', series: 3 },
  reprovado: { label: 'Reprovado', variant: 'muted', series: 4 },
};

// Prioridade de um pedido de adoção (calculada na triagem).
export const priorityMap = {
  alto: { label: 'Alta', variant: 'urgent' },
  medio: { label: 'Média', variant: 'pending' },
  baixo: { label: 'Baixa', variant: 'muted' },
};

// Status de uma doação.
export const donationStatusMap = {
  pendente: { label: 'Pendente', variant: 'pending' },
  confirmada: { label: 'Confirmada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'muted' },
  falhou: { label: 'Pagamento recusado', variant: 'urgent' },
};

// Doação mensal (assinatura no Mercado Pago).
export const subscriptionStatusMap = {
  pendente: { label: 'Aguardando pagamento', variant: 'pending' },
  ativa: { label: 'Ativa', variant: 'success' },
  pausada: { label: 'Pausada', variant: 'pending' },
  cancelada: { label: 'Cancelada', variant: 'muted' },
};

// Status do cadastro de um adotante.
export const adopterStatusMap = {
  em_analise: { label: 'Em análise', variant: 'pending' },
  visita_agendada: { label: 'Visita agendada', variant: 'available' },
  adotante: { label: 'Adotante', variant: 'success' },
  inativo: { label: 'Inativo', variant: 'muted' },
};

// Tipos de compromisso na agenda da adoção.
export const appointmentTypeLabels = { visita: 'Visita', entrevista: 'Entrevista' };

// Status de um compromisso.
export const appointmentStatusMap = {
  agendado: { label: 'Agendado', variant: 'available' },
  realizado: { label: 'Realizado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'muted' },
};

// Tipo de doação.
export const donationTypeLabels = { unica: 'Única', recorrente: 'Recorrente' };

// Cor de gráfico (número da série) de cada forma de pagamento.
export const donationMethodSeries = { pix: 1, cartao: 2, boleto: 3, transferencia: 4, nao_informado: 5 };

// Texto de cada forma de pagamento.
export const donationMethodLabels = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  nao_informado: 'Não informado',
};

// Status de um voluntário.
export const volunteerStatusMap = {
  ativo: { label: 'Ativo', variant: 'success' },
  inativo: { label: 'Inativo / em triagem', variant: 'muted' },
};

// Texto de cada área de voluntariado (mesmos códigos de features/volunteers/volunteerAreas.js).
export const volunteerAreaLabels = {
  passeios: 'Passeios',
  banho_e_tosa: 'Banho e tosa',
  divulgacao: 'Divulgação',
  eventos: 'Eventos',
  transporte: 'Transporte',
  fotografia: 'Fotografia',
  socializacao: 'Socialização',
  captacao: 'Captação',
  manutencao: 'Manutenção',
};

/*
 * FUNÇÃO: statusOf
 * O que faz: procura um valor num mapa de status; se não achar, devolve um padrão seguro.
 * Parâmetros:
 *   - map (objeto): um dos mapas acima (ex.: donationStatusMap).
 *   - value (string): o código vindo do banco (ex.: 'confirmada').
 * Retorno (objeto): { label, variant, series? } — para códigos desconhecidos, usa o próprio
 *   código como texto (ou "—" se vazio), cor neutra e série 5.
 * Onde é usada: em tabelas e selos do painel, para nunca quebrar com valores inesperados.
 */
export function statusOf(map, value) {
  return map[value] || { label: value || '—', variant: 'muted', series: 5 };
}

/*
 * FUNÇÃO: seriesColor
 * O que faz: devolve a cor de gráfico correspondente a um número de série.
 * Parâmetros: index (number) — 1 a 5 (sem valor, usa 5).
 * Retorno (string): ex.: "var(--admin-series-2)" (usada em style={{ background: ... }}).
 * Onde é usada: nos gráficos do painel (dashboard).
 */
export function seriesColor(index) {
  return `var(--admin-series-${index || 5})`;
}

// Formatadores criados uma vez (reaproveitados em todas as chamadas).
// Moeda: 1234.5 → "R$ 1.234,50".
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Data curta no horário de Brasília: "16/10/2026".
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });
// Data e hora curtas no horário de Brasília: "16/10/2026 14:30".
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

/*
 * FUNÇÃO: formatDateTime
 * O que faz: formata data e hora no horário de Brasília.
 * Parâmetros: value (string | Date | null) — ex.: '2026-10-16T17:30:00Z'.
 * Retorno (string): ex.: '16/10/2026 14:30', ou '—' se vazio/inválido.
 * Onde é usada: agenda de visitas/entrevistas e históricos.
 */
// Data e hora (horário de Brasília), para compromissos da agenda.
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  // Data inválida → valueOf() é NaN.
  return Number.isNaN(date.valueOf()) ? '—' : dateTimeFormatter.format(date);
}

/*
 * FUNÇÃO: formatCurrency
 * O que faz: formata um valor em reais.
 * Parâmetros: value (number | string) — ex.: 50 ou "50.00".
 * Retorno (string): ex.: 'R$ 50,00'. Valores inválidos viram 'R$ 0,00' (Number(...) || 0).
 * Onde é usada: doações, dashboard.
 */
export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

/*
 * FUNÇÃO: formatDate
 * O que faz: formata uma data para o padrão brasileiro.
 * Parâmetros: value (string | Date | null).
 * Retorno (string): ex.: '16/10/2026', ou '—' se vazio/inválido.
 * Detalhe: datas "puras" AAAA-MM-DD (colunas DATE do banco) são apenas reordenadas
 *   (sem converter fuso, para não "voltar um dia"); datas com horário usam Brasília.
 */
// Datas AAAA-MM-DD (colunas DATE) não têm fuso; timestamps são exibidos no horário de Brasília.
export function formatDate(value) {
  if (!value) return '—';
  const text = String(value);
  // Exatamente AAAA-MM-DD? Separa por "-", inverte (DD, MM, AAAA) e junta com "/".
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.split('-').reverse().join('/');
  // Senão, interpreta como data com horário.
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? '—' : dateFormatter.format(date);
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   As telas do painel importam os mapas para transformar códigos em textos e
 *   cores (sempre via statusOf, que tem um valor padrão), e as funções de
 *   formatação para exibir valores e datas no padrão brasileiro e no horário
 *   de Brasília.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Mapas de tradução (lookup) e valores padrão para dados inesperados.
 *   - Intl.NumberFormat (moeda) e Intl.DateTimeFormat (dateStyle, timeStyle, timeZone).
 *   - Fusos horários: por que datas "puras" (DATE) não devem ser convertidas.
 *   - Expressões regulares para validar formato.
 *   - Variáveis CSS geradas pelo JavaScript (var(--admin-series-N)).
 * ============================================================================
 */
