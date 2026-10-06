// Arquivo único de rótulos e variantes visuais dos valores do banco (status, prioridades, métodos).
// "variant" escolhe a classe .admin-badge.is-* e "series" a cor de gráfico --admin-series-N
// (ambas definidas em src/admin/styles/admin.css somente com tokens do :root).
export const adoptionStatusMap = {
  novo: { label: 'Novo', variant: 'pending', series: 2 },
  em_analise: { label: 'Em análise', variant: 'pending', series: 5 },
  visita_agendada: { label: 'Visita agendada', variant: 'available', series: 1 },
  aprovado: { label: 'Aprovado', variant: 'success', series: 3 },
  reprovado: { label: 'Reprovado', variant: 'muted', series: 4 },
};

export const priorityMap = {
  alto: { label: 'Alta', variant: 'urgent' },
  medio: { label: 'Média', variant: 'pending' },
  baixo: { label: 'Baixa', variant: 'muted' },
};

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

export const adopterStatusMap = {
  em_analise: { label: 'Em análise', variant: 'pending' },
  visita_agendada: { label: 'Visita agendada', variant: 'available' },
  adotante: { label: 'Adotante', variant: 'success' },
  inativo: { label: 'Inativo', variant: 'muted' },
};

export const appointmentTypeLabels = { visita: 'Visita', entrevista: 'Entrevista' };

export const appointmentStatusMap = {
  agendado: { label: 'Agendado', variant: 'available' },
  realizado: { label: 'Realizado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'muted' },
};

export const donationTypeLabels = { unica: 'Única', recorrente: 'Recorrente' };

export const donationMethodSeries = { pix: 1, cartao: 2, boleto: 3, transferencia: 4, nao_informado: 5 };

export const donationMethodLabels = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  nao_informado: 'Não informado',
};

export const volunteerStatusMap = {
  ativo: { label: 'Ativo', variant: 'success' },
  inativo: { label: 'Inativo / em triagem', variant: 'muted' },
};

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

export function statusOf(map, value) {
  return map[value] || { label: value || '—', variant: 'muted', series: 5 };
}

export function seriesColor(index) {
  return `var(--admin-series-${index || 5})`;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

// Data e hora (horário de Brasília), para compromissos da agenda.
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : dateTimeFormatter.format(date);
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

// Datas AAAA-MM-DD (colunas DATE) não têm fuso; timestamps são exibidos no horário de Brasília.
export function formatDate(value) {
  if (!value) return '—';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.split('-').reverse().join('/');
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? '—' : dateFormatter.format(date);
}
