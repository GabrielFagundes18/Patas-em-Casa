/*
 * ============================================================================
 * ARQUIVO: DonationReturnPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Página para onde o Mercado Pago devolve o doador depois do pagamento
 *   (/doar/retorno?ref=... ou ?assinatura=...). Consulta na API a situação da
 *   doação e mostra uma mensagem clara: confirmada, mensal ativa, pendente,
 *   recusada ou cancelada. Se estiver "pendente", consulta de novo algumas vezes,
 *   porque a confirmação do pagamento (webhook) pode chegar alguns segundos depois.
 *
 * PRINCIPAIS ITENS:
 *   - MAX_ATTEMPTS: número máximo de consultas (6).
 *   - POLL_INTERVAL_MS: intervalo entre consultas (exportado como objeto para os testes mudarem).
 *   - currency: formatador de moeda.
 *   - MESSAGES: textos de cada situação.
 *   - DonationReturnPage(): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useSearchParams).
 *   - shared/components/layout/PublicLayout → cabeçalho e rodapé.
 *   - api/donations.js                      → consultarDoacao (GET /api/v1/public/donations/status/:ref).
 *   - Classes .public-state (PublicLayout.css) e .btn (globals.css).
 *   - Quem usa: app/App.js (rota /doar/retorno).
 *   - Testado em: features/donation/DonationPages.test.js.
 * ============================================================================
 */

// O quê: página de volta do Mercado Pago (/doar/retorno?ref=... ou ?assinatura=...).
// Como: consulta a situação na API; enquanto estiver "pendente", consulta de novo algumas vezes,
//       porque a confirmação (webhook) pode chegar depois do retorno do doador.
// Para quê: agradecer e dizer claramente se a doação foi confirmada, está em processamento ou falhou.
// Hooks do React.
import { useEffect, useState } from 'react';
// Link (navegação) e useSearchParams (ler a URL).
import { Link, useSearchParams } from 'react-router-dom';
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
// Consulta a situação da doação.
import { consultarDoacao } from 'api/donations';

// Quantas vezes no máximo consultar a API enquanto a doação estiver pendente.
const MAX_ATTEMPTS = 6;
// Intervalo entre consultas: 3 segundos. Fica dentro de um objeto (e exportado) para que os
// testes possam diminuir o tempo (POLL_INTERVAL_MS.value = 0) sem esperar de verdade.
export const POLL_INTERVAL_MS = { value: 3000 };
// Formatador de moeda brasileira.
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Textos para cada situação da doação (chave = status vindo da API).
const MESSAGES = {
  confirmada: { eyebrow: 'Doação confirmada', title: 'Muito obrigado!', text: 'Sua doação foi confirmada e já está ajudando os animais.' },
  ativa: { eyebrow: 'Doação mensal ativa', title: 'Muito obrigado por ajudar todo mês!', text: 'Você vai receber por e-mail o link para cancelar quando quiser.' },
  pendente: { eyebrow: 'Em processamento', title: 'Recebemos sua doação', text: 'O pagamento ainda está sendo processado (boleto ou Pix podem levar alguns minutos). Assim que for confirmado, ele entra nas contas da ONG.' },
  falhou: { eyebrow: 'Pagamento recusado', title: 'O pagamento não foi aprovado', text: 'Nenhum valor foi cobrado. Você pode tentar de novo com outro meio de pagamento.' },
  cancelada: { eyebrow: 'Doação cancelada', title: 'A doação foi cancelada', text: 'Se foi engano, é só fazer uma nova doação.' },
};

/*
 * COMPONENTE: DonationReturnPage
 * O que faz: consulta a doação (com novas tentativas enquanto pendente) e mostra o resultado.
 * Parâmetros: nenhum (a referência vem da URL).
 * Retorno: JSX da página.
 * Onde é usado: App.js, rota /doar/retorno.
 */
export default function DonationReturnPage() {
  // Parâmetros da URL.
  const [params] = useSearchParams();
  // Referência da doação: "ref" (doação única) ou "assinatura" (mensal).
  const reference = params.get('ref') || params.get('assinatura');
  // Estado: 'loading' se há referência; 'missing' se não há. Em 'ready', guarda a doação.
  const [state, setState] = useState({ status: reference ? 'loading' : 'missing' });

  // Consulta a doação quando a referência existe (e de novo se mudar).
  useEffect(() => {
    // Sem referência, nada a consultar.
    if (!reference) return undefined;
    // Permite cancelar a requisição.
    const controller = new AbortController();
    // Guarda o agendamento da próxima consulta (para cancelar na limpeza).
    let timer;
    // Contador de tentativas.
    let attempts = 0;

    /*
     * FUNÇÃO INTERNA: check
     * O que faz: consulta a API uma vez; se ainda estiver pendente, agenda nova consulta.
     * Técnica chamada "polling" (perguntar de tempos em tempos).
     */
    async function check() {
      attempts += 1;
      try {
        const donation = await consultarDoacao(reference, { signal: controller.signal });
        // Mostra o que chegou (mesmo que pendente).
        setState({ status: 'ready', donation });
        // Pendente e ainda há tentativas: agenda outra consulta (a função chama a si mesma via setTimeout).
        if (donation.status === 'pendente' && attempts < MAX_ATTEMPTS) timer = setTimeout(check, POLL_INTERVAL_MS.value);
      } catch {
        // Erro (ex.: referência desconhecida): "não encontrada", se não foi cancelado.
        if (!controller.signal.aborted) setState({ status: 'missing' });
      }
    }

    // Primeira consulta.
    check();
    // Limpeza: cancela a requisição e o próximo agendamento.
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [reference]);

  // Mensagem a mostrar: a do status da doação (ou a de "pendente" se o status for desconhecido).
  const message = state.status === 'ready' ? MESSAGES[state.donation.status] || MESSAGES.pendente : null;

  return (
    <PublicLayout>
      <section>
        {/* aria-live="polite": leitores de tela anunciam quando o conteúdo muda (ex.: de pendente para confirmada). */}
        <div className="wrap public-state" aria-live="polite">
          {/* Carregando. */}
          {state.status === 'loading' ? <h1>Conferindo sua doação...</h1> : null}
          {/* Não encontrada. <> </> agrupa vários elementos sem criar uma div. */}
          {state.status === 'missing' ? (
            <>
              <span className="eyebrow">Doação</span>
              <h1>Não encontramos esta doação</h1>
              <p>Se você concluiu o pagamento, ele aparece para a equipe assim que o Mercado Pago confirmar.</p>
            </>
          ) : null}
          {/* Situação conhecida: rótulo, título, texto e o valor (se houver). */}
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
          {/* Botões (depois de carregar). "?." porque state.donation pode não existir (estado missing). */}
          {state.status !== 'loading' ? (
            <div className="public-state-actions">
              {/* Pagamento recusado: oferece tentar de novo. */}
              {state.donation?.status === 'falhou' ? <Link to="/doar" className="btn btn-primary">Tentar de novo</Link> : null}
              <Link to="/adotar" className={state.donation?.status === 'falhou' ? 'btn btn-secondary' : 'btn btn-primary'}>Conhecer os animais</Link>
            </div>
          ) : null}
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
 *   1. O Mercado Pago redireciona o doador para /doar/retorno?ref=...
 *   2. A página lê a referência e consulta a API.
 *   3. Se a doação estiver "pendente", consulta de novo a cada 3 s (até 6 vezes),
 *      pois a confirmação do pagamento pode chegar depois.
 *   4. Mostra a mensagem da situação; se falhou, oferece "Tentar de novo".
 *   5. Ao sair da página, cancela a consulta e o agendamento.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Polling com setTimeout recursivo e limite de tentativas.
 *   - Webhooks (confirmação assíncrona de pagamento) e por que o retorno pode chegar antes.
 *   - Limpeza de efeitos: AbortController + clearTimeout.
 *   - Objetos de configuração exportados para facilitar testes (POLL_INTERVAL_MS).
 *   - Mapa de mensagens por status e valor padrão (|| MESSAGES.pendente).
 *   - Fragmentos (<> </>) e aria-live.
 * ============================================================================
 */
