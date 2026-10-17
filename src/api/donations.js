/*
 * ============================================================================
 * ARQUIVO: donations.js (pasta api)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Funções do site público relacionadas a DOAÇÕES online pelo Mercado Pago:
 *   iniciar uma doação, consultar o resultado do pagamento e cancelar uma
 *   doação mensal (assinatura).
 *
 * PRINCIPAIS FUNÇÕES:
 *   - iniciarDoacao({ valor, nome, email, tipo }) → cria o checkout e devolve a URL de pagamento.
 *   - consultarDoacao(referencia, { signal })      → situação da doação na volta do pagamento.
 *   - pedirLinkCancelamento(email)                 → pede por e-mail o link de cancelamento.
 *   - cancelarDoacaoMensal(token)                  → cancela a assinatura com o token do link.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./client.js → instância do axios configurada.
 *   - Usado por: features/donation/DonationPage.jsx, DonationReturnPage.jsx
 *     e CancelSubscriptionPage.jsx.
 *   - No backend: rotas /api/v1/public/donations/... (módulo donations).
 * ============================================================================
 */

// Importa o cliente HTTP configurado (axios) do projeto.
import api from './client';

/*
 * FUNÇÃO: iniciarDoacao
 * O que faz: pede ao backend para criar um pagamento no Mercado Pago.
 * Parâmetros (um objeto, desestruturado):
 *   - valor (number): valor da doação em reais.
 *   - nome (string): nome do doador.
 *   - email (string): e-mail do doador.
 *   - tipo (string): tipo da doação — única ou mensal.
 * Retorno (Promise → objeto): dados do checkout, incluindo a URL para onde o doador
 *   deve ser redirecionado para pagar.
 * Onde é usada: no envio do formulário da DonationPage.jsx.
 */
// O quê: inicia a doação online (única ou mensal) no Mercado Pago.
// Como: POST /api/v1/public/donations/checkout devolve a URL do checkout para redirecionar o doador.
// Para quê: o pagamento (Pix, cartão ou boleto) acontece nas telas do Mercado Pago, fora do site.
export async function iniciarDoacao({ valor, nome, email, tipo }) {
  // Envia apenas os 4 campos esperados (atalho { valor } = { valor: valor }).
  const resposta = await api.post('/api/v1/public/donations/checkout', { valor, nome, email, tipo });
  // Devolve os dados do checkout.
  return resposta.data.data;
}

/*
 * FUNÇÃO: consultarDoacao
 * O que faz: consulta se a doação foi aprovada, está pendente ou foi recusada.
 * Parâmetros:
 *   - referencia (string): código que identifica a doação (vem na URL de retorno do Mercado Pago).
 *   - objeto opcional { signal }: AbortSignal para cancelar a requisição.
 * Retorno (Promise → objeto): a situação da doação (sem dados pessoais do doador).
 * Onde é usada: na DonationReturnPage.jsx (página /doar/retorno).
 */
// O quê: consulta a situação da doação na volta do Mercado Pago (sem dados pessoais).
export async function consultarDoacao(referencia, { signal } = {}) {
  // encodeURIComponent protege a URL contra caracteres especiais na referência.
  const resposta = await api.get(`/api/v1/public/donations/status/${encodeURIComponent(referencia)}`, { signal });
  // Devolve a situação.
  return resposta.data.data;
}

/*
 * FUNÇÃO: pedirLinkCancelamento
 * O que faz: pede ao backend para enviar, por e-mail, um link seguro de cancelamento
 *   da doação mensal.
 * Parâmetros:
 *   - email (string): e-mail usado na doação mensal.
 * Retorno (Promise → objeto): confirmação do pedido.
 * Onde é usada: na CancelSubscriptionPage.jsx (quando o visitante ainda não tem o link).
 */
// O quê: pede por e-mail o link para cancelar a doação mensal.
export async function pedirLinkCancelamento(email) {
  // POST com o e-mail no corpo.
  const resposta = await api.post('/api/v1/public/donations/subscriptions/cancel-link', { email });
  // Devolve a resposta do backend.
  return resposta.data.data;
}

/*
 * FUNÇÃO: cancelarDoacaoMensal
 * O que faz: cancela a assinatura usando o token que veio no link do e-mail.
 * Parâmetros:
 *   - token (string): código secreto e temporário que comprova que a pessoa recebeu o e-mail.
 * Retorno (Promise → objeto): confirmação do cancelamento.
 * Onde é usada: na CancelSubscriptionPage.jsx (quando a URL tem o token).
 */
// O quê: cancela a doação mensal com o token do link recebido por e-mail.
export async function cancelarDoacaoMensal(token) {
  // POST com o token no corpo.
  const resposta = await api.post('/api/v1/public/donations/subscriptions/cancel', { token });
  // Devolve a confirmação.
  return resposta.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Na página /doar, iniciarDoacao cria o pagamento e o site redireciona o
 *      doador para o Mercado Pago.
 *   2. Depois de pagar, o Mercado Pago devolve o doador para /doar/retorno, onde
 *      consultarDoacao mostra se deu certo.
 *   3. Para cancelar a doação mensal: pedirLinkCancelamento envia um e-mail com
 *      um link; ao abrir o link, cancelarDoacaoMensal usa o token para cancelar.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Integração com gateway de pagamento (checkout externo / redirecionamento).
 *   - Requisições GET x POST.
 *   - Tokens de uso único enviados por e-mail (confirmação de identidade).
 *   - Desestruturação de parâmetros e atalho de propriedades.
 *   - encodeURIComponent.
 * ============================================================================
 */
