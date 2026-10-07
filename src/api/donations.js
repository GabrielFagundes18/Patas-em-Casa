import api from './client';

// O quê: inicia a doação online (única ou mensal) no Mercado Pago.
// Como: POST /api/v1/public/donations/checkout devolve a URL do checkout para redirecionar o doador.
// Para quê: o pagamento (Pix, cartão ou boleto) acontece nas telas do Mercado Pago, fora do site.
export async function iniciarDoacao({ valor, nome, email, tipo }) {
  const resposta = await api.post('/api/v1/public/donations/checkout', { valor, nome, email, tipo });
  return resposta.data.data;
}

// O quê: consulta a situação da doação na volta do Mercado Pago (sem dados pessoais).
export async function consultarDoacao(referencia, { signal } = {}) {
  const resposta = await api.get(`/api/v1/public/donations/status/${encodeURIComponent(referencia)}`, { signal });
  return resposta.data.data;
}

// O quê: pede por e-mail o link para cancelar a doação mensal.
export async function pedirLinkCancelamento(email) {
  const resposta = await api.post('/api/v1/public/donations/subscriptions/cancel-link', { email });
  return resposta.data.data;
}

// O quê: cancela a doação mensal com o token do link recebido por e-mail.
export async function cancelarDoacaoMensal(token) {
  const resposta = await api.post('/api/v1/public/donations/subscriptions/cancel', { token });
  return resposta.data.data;
}
