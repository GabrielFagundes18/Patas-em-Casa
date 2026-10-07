// O quê: cancelamento da doação mensal pelo doador (/doar/cancelar).
// Como: com ?token= (link do e-mail), pede confirmação e cancela; sem token, pede o e-mail e envia um link novo.
// Para quê: o doador cancelar sozinho, sem login e sem expor dados de outras pessoas.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../../shared/components/layout/PublicLayout/PublicLayout';
import { cancelarDoacaoMensal, pedirLinkCancelamento } from '../../api/donations';
import './DonationPage.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback;
}

export default function CancelSubscriptionPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ status: 'idle' });

  async function confirmCancel() {
    setState({ status: 'sending' });
    try {
      const result = await cancelarDoacaoMensal(token);
      setState({ status: 'cancelled', valor: result.valor });
    } catch (error) {
      setState({ status: 'error', message: errorMessage(error, 'Não foi possível cancelar agora. Tente novamente.') });
    }
  }

  async function requestLink(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    setState({ status: 'sending' });
    try {
      const result = await pedirLinkCancelamento(email);
      setState({ status: 'requested', message: result.mensagem });
    } catch (error) {
      setState({ status: 'error', message: errorMessage(error, 'Não foi possível enviar o link agora. Tente novamente.') });
    }
  }

  return (
    <PublicLayout className="donation-page">
      <section>
        <div className="wrap public-state" aria-live="polite">
          <span className="eyebrow">Doação mensal</span>
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
              {state.status === 'error' ? <p className="donation-error" role="alert">{state.message}</p> : null}
              <div className="public-state-actions">
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
