// O quê: página de doação online (/doar): valor sugerido ou livre, única ou mensal, pelo Mercado Pago.
// Como: envia valor, nome, e-mail e tipo para a API, que devolve a URL do checkout; o navegador vai para lá.
// Para quê: aceitar Pix, cartão e boleto sem que dados de pagamento passem pelo site da ONG.
// Se a doação online estiver indisponível (503), mostra a chave Pix como alternativa.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HeartHandshake, Lock } from 'lucide-react';
import { PublicLayout } from '../shared/components/layout/PublicLayout/PublicLayout';
import { PixKey } from '../shared/components/PixKey/PixKey';
import { iniciarDoacao } from '../api/donations';
import './DonationPage.css';

const SUGGESTED_VALUES = [25, 50, 100, 200];
const MIN_VALUE = 5;
const MAX_VALUE = 10000;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function readError(error) {
  if (!error?.response) return { message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.', details: [] };
  const apiError = error.response.data?.error;
  return {
    status: error.response.status,
    message: apiError?.message || 'Não foi possível iniciar a doação agora.',
    details: (apiError?.details || []).map((detail) => detail.message),
  };
}

// Redirecionamento isolado para poder ser substituído nos testes.
export const redirectTo = { go: (url) => window.location.assign(url) };

// Escolha vinda da Home (/doar?tipo=recorrente&valor=50): valor sugerido, "outro" ou um valor livre.
// Parâmetros ausentes ou inválidos caem no padrão (única, R$ 50).
function readInitialChoice(params) {
  const tipo = params.get('tipo') === 'recorrente' ? 'recorrente' : 'unica';
  const raw = params.get('valor');
  const numeric = Number(raw);
  if (raw === 'outro') return { tipo, choice: 'outro', custom: '' };
  if (raw && SUGGESTED_VALUES.includes(numeric)) return { tipo, choice: numeric, custom: '' };
  if (raw && Number.isFinite(numeric) && numeric >= MIN_VALUE && numeric <= MAX_VALUE) {
    return { tipo, choice: 'outro', custom: raw };
  }
  return { tipo, choice: 50, custom: '' };
}

export default function DonationPage() {
  const [searchParams] = useSearchParams();
  const [initial] = useState(() => readInitialChoice(searchParams));
  const [tipo, setTipo] = useState(initial.tipo);
  const [choice, setChoice] = useState(initial.choice);
  const [custom, setCustom] = useState(initial.custom);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const valor = choice === 'outro' ? Number(String(custom).replace(',', '.')) : choice;
  const validValue = Number.isFinite(valor) && valor >= MIN_VALUE && valor <= MAX_VALUE;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validValue) {
      setError({ message: `Escolha um valor entre ${currency.format(MIN_VALUE)} e ${currency.format(MAX_VALUE)}.`, details: [] });
      return;
    }
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    try {
      const result = await iniciarDoacao({
        valor: Math.round(valor * 100) / 100,
        nome: data.get('nome'),
        email: data.get('email'),
        tipo,
      });
      redirectTo.go(result.checkout_url);
    } catch (requestError) {
      setError(readError(requestError));
      setSending(false);
    }
  }

  return (
    <PublicLayout className="donation-page">
      <section>
        <div className="wrap donation-layout">
          <div>
            <div className="section-head">
              <span className="eyebrow">Doação</span>
              <h1>Ajude a manter ração, vacinas e tratamentos em dia</h1>
              <p>Escolha um valor e pague pelo Mercado Pago com Pix, cartão ou boleto. A doação mensal ajuda a ONG a planejar os cuidados.</p>
            </div>

            <form className="donation-form" onSubmit={handleSubmit} aria-busy={sending}>
              <fieldset className="donation-type">
                <legend>Tipo de doação</legend>
                {[['unica', 'Doação única'], ['recorrente', 'Todo mês']].map(([value, label]) => (
                  <label key={value} className={tipo === value ? 'is-selected' : ''}>
                    <input checked={tipo === value} name="tipo" onChange={() => setTipo(value)} type="radio" value={value} />
                    {label}
                  </label>
                ))}
              </fieldset>

              <fieldset className="donation-values">
                <legend>Valor{tipo === 'recorrente' ? ' por mês' : ''}</legend>
                {SUGGESTED_VALUES.map((value) => (
                  <label key={value} className={choice === value ? 'is-selected' : ''}>
                    <input checked={choice === value} name="valor" onChange={() => setChoice(value)} type="radio" value={value} />
                    {currency.format(value)}
                  </label>
                ))}
                <label className={choice === 'outro' ? 'is-selected' : ''}>
                  <input checked={choice === 'outro'} name="valor" onChange={() => setChoice('outro')} type="radio" value="outro" />
                  Outro valor
                </label>
              </fieldset>

              {choice === 'outro' ? (
                <label className="donation-field">
                  Quanto você quer doar (R$)
                  <input autoFocus inputMode="decimal" max={MAX_VALUE} min={MIN_VALUE} name="valor_livre" onChange={(event) => setCustom(event.target.value)} required step="0.01" type="number" value={custom} />
                </label>
              ) : null}

              <div className="donation-fields">
                <label className="donation-field">
                  Nome
                  <input autoComplete="name" maxLength={150} minLength={2} name="nome" required />
                </label>
                <label className="donation-field">
                  E-mail
                  <input autoComplete="email" maxLength={150} name="email" required type="email" />
                </label>
              </div>
              <input aria-hidden="true" autoComplete="off" className="donation-honeypot" name="website" tabIndex={-1} />

              {error ? (
                <div className="donation-error" role="alert">
                  <p>{error.message}</p>
                  {error.details.length > 0 ? <ul>{error.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
                </div>
              ) : null}

              <button className="btn btn-primary donation-submit" disabled={sending} type="submit">
                <HeartHandshake aria-hidden="true" size={18} />
                {sending ? 'Indo para o Mercado Pago...' : `Doar ${validValue ? currency.format(valor) : ''}${tipo === 'recorrente' ? ' por mês' : ''}`}
              </button>
              <p className="donation-secure">
                <Lock aria-hidden="true" size={14} /> O pagamento é feito no Mercado Pago: dados de cartão não passam pelo nosso site.
                {tipo === 'recorrente' ? ' Você pode cancelar a doação mensal quando quiser.' : ''}
              </p>
            </form>
          </div>

          <aside className="donation-aside" aria-label="Outras formas de ajudar">
            <h2>{error?.status === 503 ? 'Doe agora pelo Pix' : 'Prefere o Pix direto?'}</h2>
            <p>Copie a chave e faça a transferência pelo app do seu banco.</p>
            <PixKey />
            <p className="donation-aside-note">
              Já doa todo mês e quer cancelar? <Link to="/doar/cancelar">Cancelar doação mensal</Link>
            </p>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
