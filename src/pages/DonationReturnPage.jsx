// O quê: página de volta do Mercado Pago (/doar/retorno?ref=... ou ?assinatura=...).
// Como: consulta a situação na API; enquanto estiver "pendente", consulta de novo algumas vezes,
//       porque a confirmação (webhook) pode chegar depois do retorno do doador.
// Para quê: agradecer e dizer claramente se a doação foi confirmada, está em processamento ou falhou.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout/PublicLayout';
import { consultarDoacao } from '../services/doacaoService';

const MAX_ATTEMPTS = 6;
export const POLL_INTERVAL_MS = { value: 3000 };
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MESSAGES = {
  confirmada: { eyebrow: 'Doação confirmada', title: 'Muito obrigado!', text: 'Sua doação foi confirmada e já está ajudando os animais.' },
  ativa: { eyebrow: 'Doação mensal ativa', title: 'Muito obrigado por ajudar todo mês!', text: 'Você vai receber por e-mail o link para cancelar quando quiser.' },
  pendente: { eyebrow: 'Em processamento', title: 'Recebemos sua doação', text: 'O pagamento ainda está sendo processado (boleto ou Pix podem levar alguns minutos). Assim que for confirmado, ele entra nas contas da ONG.' },
  falhou: { eyebrow: 'Pagamento recusado', title: 'O pagamento não foi aprovado', text: 'Nenhum valor foi cobrado. Você pode tentar de novo com outro meio de pagamento.' },
  cancelada: { eyebrow: 'Doação cancelada', title: 'A doação foi cancelada', text: 'Se foi engano, é só fazer uma nova doação.' },
};

export default function DonationReturnPage() {
  const [params] = useSearchParams();
  const reference = params.get('ref') || params.get('assinatura');
  const [state, setState] = useState({ status: reference ? 'loading' : 'missing' });

  useEffect(() => {
    if (!reference) return undefined;
    const controller = new AbortController();
    let timer;
    let attempts = 0;

    async function check() {
      attempts += 1;
      try {
        const donation = await consultarDoacao(reference, { signal: controller.signal });
        setState({ status: 'ready', donation });
        if (donation.status === 'pendente' && attempts < MAX_ATTEMPTS) timer = setTimeout(check, POLL_INTERVAL_MS.value);
      } catch {
        if (!controller.signal.aborted) setState({ status: 'missing' });
      }
    }

    check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [reference]);

  const message = state.status === 'ready' ? MESSAGES[state.donation.status] || MESSAGES.pendente : null;

  return (
    <PublicLayout>
      <section>
        <div className="wrap public-state" aria-live="polite">
          {state.status === 'loading' ? <h1>Conferindo sua doação...</h1> : null}
          {state.status === 'missing' ? (
            <>
              <span className="eyebrow">Doação</span>
              <h1>Não encontramos esta doação</h1>
              <p>Se você concluiu o pagamento, ele aparece para a equipe assim que o Mercado Pago confirmar.</p>
            </>
          ) : null}
          {message ? (
            <>
              <span className="eyebrow">{message.eyebrow}</span>
              <h1>{message.title}</h1>
              <p>
                {message.text}
                {state.donation.valor ? ` Valor: ${currency.format(state.donation.valor)}${state.donation.tipo === 'recorrente' ? ' por mês' : ''}.` : ''}
              </p>
            </>
          ) : null}
          {state.status !== 'loading' ? (
            <div className="public-state-actions">
              {state.donation?.status === 'falhou' ? <Link to="/doar" className="btn btn-primary">Tentar de novo</Link> : null}
              <Link to="/adotar" className={state.donation?.status === 'falhou' ? 'btn btn-secondary' : 'btn btn-primary'}>Conhecer os animais</Link>
            </div>
          ) : null}
        </div>
      </section>
    </PublicLayout>
  );
}
