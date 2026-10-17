/*
 * ============================================================================
 * ARQUIVO: CancelSubscriptionPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Página para o doador CANCELAR a doação mensal sozinho (/doar/cancelar),
 *   sem precisar de login. Funciona em dois modos:
 *     - COM token na URL (?token=..., vindo do link enviado por e-mail): pede
 *       confirmação e cancela;
 *     - SEM token: pede o e-mail e envia um link de cancelamento para ele.
 *   Assim ninguém consegue cancelar a doação de outra pessoa só sabendo o e-mail.
 *
 * PRINCIPAIS ITENS:
 *   - currency: formatador de moeda.
 *   - errorMessage(error, fallback): mensagem de erro da API (interna).
 *   - CancelSubscriptionPage(): o componente (exportado como padrão).
 *       Dentro dele: confirmCancel e requestLink.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useSearchParams).
 *   - shared/components/layout/PublicLayout → cabeçalho e rodapé.
 *   - api/donations.js → cancelarDoacaoMensal e pedirLinkCancelamento.
 *   - ./DonationPage.css → estilos de formulário e erro das páginas de doação.
 *   - Quem usa: app/App.js (rota /doar/cancelar); link na DonationPage.
 *   - Testado em: features/donation/DonationPages.test.js.
 * ============================================================================
 */

// O quê: cancelamento da doação mensal pelo doador (/doar/cancelar).
// Como: com ?token= (link do e-mail), pede confirmação e cancela; sem token, pede o e-mail e envia um link novo.
// Para quê: o doador cancelar sozinho, sem login e sem expor dados de outras pessoas.
// Hook de estado.
import { useState } from 'react';
// Link (navegação) e useSearchParams (ler a URL).
import { Link, useSearchParams } from 'react-router-dom';
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
// Funções da API de doações.
import { cancelarDoacaoMensal, pedirLinkCancelamento } from 'api/donations';
// Estilos compartilhados das páginas de doação.
import './DonationPage.css';

// Formatador de moeda brasileira.
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/*
 * FUNÇÃO: errorMessage (interna)
 * O que faz: pega a mensagem de erro enviada pelo backend ou usa um texto padrão.
 * Parâmetros: error (erro do axios) e fallback (string padrão).
 * Retorno (string).
 */
function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback;
}

/*
 * COMPONENTE: CancelSubscriptionPage
 * O que faz: desenha o fluxo de cancelamento (confirmar com token ou pedir o link por e-mail).
 * Parâmetros: nenhum (o token vem da URL).
 * Retorno: JSX da página.
 * Onde é usado: App.js, rota /doar/cancelar.
 */
export default function CancelSubscriptionPage() {
  // Parâmetros da URL.
  const [params] = useSearchParams();
  // Token do link do e-mail (ou null).
  const token = params.get('token');
  // Estado: 'idle' (parado), 'sending', 'cancelled', 'requested' ou 'error' (+ dados extras).
  const [state, setState] = useState({ status: 'idle' });

  /*
   * FUNÇÃO INTERNA: confirmCancel
   * O que faz: cancela a doação mensal usando o token.
   */
  async function confirmCancel() {
    setState({ status: 'sending' });
    try {
      const result = await cancelarDoacaoMensal(token);
      // Guarda o valor cancelado para mostrar na mensagem.
      setState({ status: 'cancelled', valor: result.valor });
    } catch (error) {
      setState({ status: 'error', message: errorMessage(error, 'Não foi possível cancelar agora. Tente novamente.') });
    }
  }

  /*
   * FUNÇÃO INTERNA: requestLink
   * O que faz: envia o e-mail digitado para o backend mandar o link de cancelamento.
   * Parâmetros: event (envio do formulário).
   */
  async function requestLink(event) {
    // Impede o recarregamento.
    event.preventDefault();
    // Lê o e-mail do formulário (campo não controlado).
    const email = new FormData(event.currentTarget).get('email');
    setState({ status: 'sending' });
    try {
      const result = await pedirLinkCancelamento(email);
      // A mensagem do backend é genérica de propósito (não revela se o e-mail tem doação).
      setState({ status: 'requested', message: result.mensagem });
    } catch (error) {
      setState({ status: 'error', message: errorMessage(error, 'Não foi possível enviar o link agora. Tente novamente.') });
    }
  }

  return (
    <PublicLayout className="donation-page">
      <section>
        {/* aria-live anuncia as mudanças de conteúdo. */}
        <div className="wrap public-state" aria-live="polite">
          <span className="eyebrow">Doação mensal</span>
          {/* Ternário encadeado escolhe UM dos 4 conteúdos:
              1) cancelada; 2) com token (confirmar); 3) link enviado; 4) pedir o e-mail. */}
          {state.status === 'cancelled' ? (
            <>
              <h1>Doação mensal cancelada</h1>
              <p>Não haverá novas cobranças{state.valor ? ` de ${currency.format(state.valor)}` : ''}. Obrigado por todo o apoio até aqui!</p>
              <div className="public-state-actions"><Link to="/" className="btn btn-primary">Voltar ao site</Link></div>
            </>
          ) : token ? (
            <>
              <h1>Cancelar a doação mensal?</h1>
              <p>As próximas cobranças no Mercado Pago serão canceladas. As doações já feitas continuam valendo.</p>
              {/* Erro (se houver). */}
              {state.status === 'error' ? <p className="donation-error" role="alert">{state.message}</p> : null}
              <div className="public-state-actions">
                {/* Desabilitado durante o envio; o texto muda para "Cancelando...". */}
                <button className="btn btn-primary" disabled={state.status === 'sending'} onClick={confirmCancel} type="button">
                  {state.status === 'sending' ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
                <Link to="/" className="btn btn-secondary">Manter a doação</Link>
              </div>
            </>
          ) : state.status === 'requested' ? (
            <>
              <h1>Confira seu e-mail</h1>
              <p>{state.message}</p>
            </>
          ) : (
            <>
              <h1>Cancelar a doação mensal</h1>
              <p>Informe o e-mail usado na doação. Enviaremos um link para você confirmar o cancelamento.</p>
              {/* Formulário com um único campo de e-mail. */}
              <form className="donation-form donation-inline-form" onSubmit={requestLink}>
                <label className="donation-field">
                  E-mail
                  <input autoComplete="email" name="email" required type="email" />
                </label>
                {state.status === 'error' ? <p className="donation-error" role="alert">{state.message}</p> : null}
                <button className="btn btn-primary" disabled={state.status === 'sending'} type="submit">
                  {state.status === 'sending' ? 'Enviando...' : 'Enviar link de cancelamento'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   - Sem token: a pessoa informa o e-mail → requestLink → o backend envia um link
 *     com token → a tela mostra "Confira seu e-mail".
 *   - Com token (abrindo o link do e-mail): a pessoa confirma → confirmCancel →
 *     o backend cancela no Mercado Pago → a tela mostra "Doação mensal cancelada".
 *   - Erros aparecem com role="alert" e o botão é reabilitado.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Confirmação por e-mail com token (prova de posse do e-mail, sem login).
 *   - Mensagens genéricas para não revelar dados (privacidade).
 *   - Máquina de estados simples na interface (idle/sending/cancelled/requested/error).
 *   - Ternários encadeados para escolher o conteúdo.
 *   - FormData para ler campos não controlados.
 * ============================================================================
 */
