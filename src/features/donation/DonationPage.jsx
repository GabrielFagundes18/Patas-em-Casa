/*
 * ============================================================================
 * ARQUIVO: DonationPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a PÁGINA DE DOAÇÃO online (/doar). O visitante escolhe o tipo (única ou
 *   mensal) e o valor (sugerido ou livre), informa nome e e-mail e é levado ao
 *   Mercado Pago para pagar (Pix, cartão ou boleto). Ao lado, mostra a chave Pix
 *   como alternativa e um link para cancelar a doação mensal.
 *   Pode receber a escolha pela URL (ex.: /doar?tipo=recorrente&valor=50), vinda
 *   da seção de doação da página inicial.
 *
 * PRINCIPAIS ITENS:
 *   - SUGGESTED_VALUES, MIN_VALUE, MAX_VALUE, currency: valores e formatador de moeda.
 *   - readError(error): traduz o erro da API (interna).
 *   - redirectTo: objeto com a função de redirecionar (exportado, para os testes trocarem).
 *   - readInitialChoice(params): lê tipo e valor da URL (interna).
 *   - DonationPage(): o componente da página (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useSearchParams), lucide-react.
 *   - shared/components/layout/PublicLayout → cabeçalho e rodapé.
 *   - shared/components/PixKey              → chave Pix.
 *   - api/donations.js                      → iniciarDoacao (POST /api/v1/public/donations/checkout).
 *   - ./DonationPage.css                    → estilos (também usados pelas outras páginas de doação).
 *   - Quem usa: app/App.js (rota /doar). Recebe dados de features/home/sections/Donation.
 *   - Testado em: features/donation/DonationPages.test.js.
 * ============================================================================
 */

// O quê: página de doação online (/doar): valor sugerido ou livre, única ou mensal, pelo Mercado Pago.
// Como: envia valor, nome, e-mail e tipo para a API, que devolve a URL do checkout; o navegador vai para lá.
// Para quê: aceitar Pix, cartão e boleto sem que dados de pagamento passem pelo site da ONG.
// Se a doação online estiver indisponível (503), mostra a chave Pix como alternativa.
// Hook de estado.
import { useState } from 'react';
// Link (navegação) e useSearchParams (ler a URL).
import { Link, useSearchParams } from 'react-router-dom';
// Ícones: mãos com coração e cadeado.
import { HeartHandshake, Lock } from 'lucide-react';
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
// Chave Pix.
import { PixKey } from 'shared/components/PixKey/PixKey';
// Inicia a doação no backend.
import { iniciarDoacao } from 'api/donations';
// Estilos.
import './DonationPage.css';

// Valores sugeridos (em reais).
const SUGGESTED_VALUES = [25, 50, 100, 200];
// Valor mínimo e máximo aceitos.
const MIN_VALUE = 5;
const MAX_VALUE = 10000;
// Formatador de moeda brasileira: 50 → "R$ 50,00".
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/*
 * FUNÇÃO: readError (interna)
 * O que faz: transforma o erro da requisição em { status, message, details }.
 * Parâmetros: error (erro do axios).
 * Retorno (objeto): sem resposta → mensagem de conexão; com resposta → status HTTP,
 *   mensagem do backend e lista de detalhes.
 * Onde é usada: no catch do envio.
 */
function readError(error) {
  // Sem resposta = falha de conexão.
  if (!error?.response) return { message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.', details: [] };
  const apiError = error.response.data?.error;
  return {
    // O status é usado para trocar o título do Pix quando a doação online está indisponível (503).
    status: error.response.status,
    message: apiError?.message || 'Não foi possível iniciar a doação agora.',
    details: (apiError?.details || []).map((detail) => detail.message),
  };
}

// Redirecionamento isolado para poder ser substituído nos testes.
// window.location.assign(url) leva o navegador para outro endereço (sai do site).
// Por estar dentro de um objeto, o teste pode trocar redirectTo.go por uma função falsa.
export const redirectTo = { go: (url) => window.location.assign(url) };

/*
 * FUNÇÃO: readInitialChoice (interna)
 * O que faz: lê da URL o tipo e o valor escolhidos (ex.: vindos da página inicial).
 * Parâmetros: params (URLSearchParams).
 * Retorno (objeto): { tipo: 'unica' | 'recorrente', choice: número | 'outro', custom: string }.
 *   Valores inválidos caem no padrão: única, R$ 50.
 * Onde é usada: no estado inicial da página.
 */
// Escolha vinda da Home (/doar?tipo=recorrente&valor=50): valor sugerido, "outro" ou um valor livre.
// Parâmetros ausentes ou inválidos caem no padrão (única, R$ 50).
function readInitialChoice(params) {
  // Só aceita "recorrente"; qualquer outra coisa vira "unica".
  const tipo = params.get('tipo') === 'recorrente' ? 'recorrente' : 'unica';
  // Valor como veio na URL (texto) e convertido em número.
  const raw = params.get('valor');
  const numeric = Number(raw);
  // "outro": abre o campo de valor livre vazio.
  if (raw === 'outro') return { tipo, choice: 'outro', custom: '' };
  // Um dos valores sugeridos: seleciona-o.
  if (raw && SUGGESTED_VALUES.includes(numeric)) return { tipo, choice: numeric, custom: '' };
  // Outro número válido: abre o campo livre já preenchido.
  if (raw && Number.isFinite(numeric) && numeric >= MIN_VALUE && numeric <= MAX_VALUE) {
    return { tipo, choice: 'outro', custom: raw };
  }
  // Padrão.
  return { tipo, choice: 50, custom: '' };
}

/*
 * COMPONENTE: DonationPage
 * O que faz: desenha a página de doação e envia o visitante ao checkout do Mercado Pago.
 * Parâmetros: nenhum.
 * Retorno: JSX da página.
 * Onde é usado: App.js, rota /doar.
 */
export default function DonationPage() {
  // Parâmetros da URL (só leitura aqui).
  const [searchParams] = useSearchParams();
  // Escolha inicial calculada UMA vez (inicialização preguiçosa com função).
  // Só o primeiro item do par é usado (não precisamos do "setInitial").
  const [initial] = useState(() => readInitialChoice(searchParams));
  // Tipo de doação.
  const [tipo, setTipo] = useState(initial.tipo);
  // Valor escolhido: número sugerido ou 'outro'.
  const [choice, setChoice] = useState(initial.choice);
  // Texto do valor livre.
  const [custom, setCustom] = useState(initial.custom);
  // true enquanto aguarda a API.
  const [sending, setSending] = useState(false);
  // Erro a exibir ou null.
  const [error, setError] = useState(null);

  // Valor final em número: do campo livre (trocando vírgula por ponto) ou o sugerido.
  const valor = choice === 'outro' ? Number(String(custom).replace(',', '.')) : choice;
  // O valor está dentro dos limites?
  const validValue = Number.isFinite(valor) && valor >= MIN_VALUE && valor <= MAX_VALUE;

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: valida o valor, chama a API e redireciona ao Mercado Pago.
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    // Impede o recarregamento.
    event.preventDefault();
    // Valor fora dos limites: mostra erro e para.
    if (!validValue) {
      setError({ message: `Escolha um valor entre ${currency.format(MIN_VALUE)} e ${currency.format(MAX_VALUE)}.`, details: [] });
      return;
    }
    // Nome e e-mail são lidos direto do formulário (campos não controlados).
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    try {
      const result = await iniciarDoacao({
        // Arredonda para 2 casas decimais (centavos): ×100, arredonda, ÷100.
        valor: Math.round(valor * 100) / 100,
        nome: data.get('nome'),
        email: data.get('email'),
        tipo,
      });
      // Vai para a página de pagamento do Mercado Pago (o "sending" continua true).
      redirectTo.go(result.checkout_url);
    } catch (requestError) {
      // Erro: mostra a mensagem e reabilita o botão.
      setError(readError(requestError));
      setSending(false);
    }
  }

  return (
    <PublicLayout className="donation-page">
      <section>
        {/* Duas colunas: formulário e Pix. */}
        <div className="wrap donation-layout">
          <div>
            {/* Cabeçalho. */}
            <div className="section-head">
              <span className="eyebrow">Doação</span>
              <h1>Ajude a manter ração, vacinas e tratamentos em dia</h1>
              <p>Escolha um valor e pague pelo Mercado Pago com Pix, cartão ou boleto. A doação mensal ajuda a ONG a planejar os cuidados.</p>
            </div>

            {/* Formulário de doação. aria-busy indica processamento. */}
            <form className="donation-form" onSubmit={handleSubmit} aria-busy={sending}>
              {/* Tipo: rádios gerados a partir de uma lista de pares [valor, rótulo]. */}
              <fieldset className="donation-type">
                <legend>Tipo de doação</legend>
                {[['unica', 'Doação única'], ['recorrente', 'Todo mês']].map(([value, label]) => (
                  <label key={value} className={tipo === value ? 'is-selected' : ''}>
                    <input checked={tipo === value} name="tipo" onChange={() => setTipo(value)} type="radio" value={value} />
                    {label}
                  </label>
                ))}
              </fieldset>

              {/* Valor: sugeridos + "Outro valor". A legenda acrescenta " por mês" na doação mensal. */}
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

              {/* Campo de valor livre (só com "Outro valor").
                  autoFocus coloca o cursor nele ao aparecer; inputMode="decimal" mostra teclado numérico com vírgula. */}
              {choice === 'outro' ? (
                <label className="donation-field">
                  Quanto você quer doar (R$)
                  <input autoFocus inputMode="decimal" max={MAX_VALUE} min={MIN_VALUE} name="valor_livre" onChange={(event) => setCustom(event.target.value)} required step="0.01" type="number" value={custom} />
                </label>
              ) : null}

              {/* Nome e e-mail (campos NÃO controlados: sem value/onChange; lidos via FormData). */}
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
              {/* Campo-isca anti-robô (escondido pelo CSS e fora do Tab). */}
              <input aria-hidden="true" autoComplete="off" className="donation-honeypot" name="website" tabIndex={-1} />

              {/* Mensagem de erro. */}
              {error ? (
                <div className="donation-error" role="alert">
                  <p>{error.message}</p>
                  {error.details.length > 0 ? <ul>{error.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
                </div>
              ) : null}

              {/* Botão de envio: texto muda durante o envio e mostra o valor formatado. */}
              <button className="btn btn-primary donation-submit" disabled={sending} type="submit">
                <HeartHandshake aria-hidden="true" size={18} />
                {sending ? 'Indo para o Mercado Pago...' : `Doar ${validValue ? currency.format(valor) : ''}${tipo === 'recorrente' ? ' por mês' : ''}`}
              </button>
              {/* Nota de segurança (e aviso de cancelamento para a doação mensal). */}
              <p className="donation-secure">
                <Lock aria-hidden="true" size={14} /> O pagamento é feito no Mercado Pago: dados de cartão não passam pelo nosso site.
                {tipo === 'recorrente' ? ' Você pode cancelar a doação mensal quando quiser.' : ''}
              </p>
            </form>
          </div>

          {/* Coluna lateral: Pix e link de cancelamento.
              Se a API respondeu 503 (doação online indisponível), o título incentiva o Pix. */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir /doar, a página lê tipo e valor da URL (ou usa o padrão).
 *   2. O visitante ajusta tipo/valor (rádios controlados) e preenche nome e e-mail.
 *   3. Ao enviar: valida o valor, chama iniciarDoacao e redireciona ao checkout_url
 *      do Mercado Pago (o pagamento acontece fora do site).
 *   4. Em erro, mostra a mensagem; se for 503, destaca o Pix como alternativa.
 *   5. Depois do pagamento, o Mercado Pago devolve o visitante para /doar/retorno.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Integração com gateway de pagamento via redirecionamento (checkout externo).
 *   - Intl.NumberFormat para moeda.
 *   - Estado inicial a partir da URL (useSearchParams + useState com função).
 *   - Campos controlados (tipo/valor) x não controlados (nome/e-mail com FormData).
 *   - Validação de faixa de valores e arredondamento de centavos.
 *   - window.location.assign e a técnica de "injeção" para testes (redirectTo).
 *   - Honeypot e HTTP 503 (serviço indisponível).
 * ============================================================================
 */
