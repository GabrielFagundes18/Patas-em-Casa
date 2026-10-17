/*
 * ============================================================================
 * ARQUIVO: StatsStrip.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Faixa da página inicial com os NÚMEROS da ONG: animais resgatados, adoções
 *   realizadas, animais aguardando um lar e anos de atuação. Os três primeiros
 *   vêm da API; os anos são calculados a partir do ano de fundação. Quando a
 *   faixa aparece na tela, os números "sobem" de 0 até o valor (animação de contagem).
 *
 * PRINCIPAIS ITENS:
 *   - anosDeAtuacao(hoje): calcula há quantos anos a ONG existe (exportada).
 *   - buildStats(numeros): monta a lista dos 4 indicadores (interna).
 *   - CountUp({ value, suffix, inView }): número com animação de contagem (interno).
 *   - StatsStrip(): o componente da seção (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useRef, useState).
 *   - framer-motion (motion, useInView, useReducedMotion).
 *   - ./StatsStrip.css               → estilos da faixa.
 *   - api/content.js                 → buscarNumeros (GET /api/v1/public/stats).
 *   - shared/constants/organization  → ano de fundação.
 *   - Quem usa: features/home/LandingPage.jsx.
 * ============================================================================
 */

// O quê: faixa com os números da ONG (resgatados, adoções, aguardando um lar e anos de atuação).
// Como: os três primeiros vêm da API; os anos são calculados a partir do ano de fundação.
// Para quê: mostrar resultados reais, nunca números inventados ou que envelhecem no código.
// Hooks do React.
import { useEffect, useRef, useState } from 'react';
// motion: elementos animáveis; useInView: diz se um elemento está visível;
// useReducedMotion: diz se o visitante prefere menos movimento.
import { motion, useInView, useReducedMotion } from 'framer-motion';
// Estilos da faixa.
import './StatsStrip.css';
// Busca os números na API pública.
import { buscarNumeros } from 'api/content';
// Dados da ONG (ano de fundação).
import { ORGANIZACAO } from 'shared/constants/organization';

/*
 * FUNÇÃO: anosDeAtuacao (exportada)
 * O que faz: calcula quantos anos se passaram desde a fundação da ONG.
 * Parâmetros:
 *   - hoje (Date, padrão new Date()): a data atual (pode ser fixada em testes).
 * Retorno (number): ano atual − ano de fundação (ex.: 2026 − 2019 = 7).
 * Onde é usada: em buildStats.
 */
export function anosDeAtuacao(hoje = new Date()) {
  return hoje.getFullYear() - ORGANIZACAO.fundacao;
}

/*
 * FUNÇÃO: buildStats (interna)
 * O que faz: monta a lista dos quatro indicadores exibidos.
 * Parâmetros:
 *   - numeros (objeto | null): resposta da API ({ animais_resgatados, adocoes_realizadas,
 *     aguardando_lar }) ou null enquanto não carregou.
 * Retorno (array): 4 objetos { value, label, suffix? }. value é null se ainda não há dado.
 * Onde é usada: no JSX do StatsStrip.
 */
// Valores ainda não carregados (ou indisponíveis) ficam null e aparecem como "—".
function buildStats(numeros) {
  return [
    // "numeros?.campo ?? null": se numeros for null ou o campo não existir, usa null.
    { value: numeros?.animais_resgatados ?? null, label: 'animais resgatados' },
    { value: numeros?.adocoes_realizadas ?? null, label: 'adoções realizadas' },
    { value: numeros?.aguardando_lar ?? null, label: 'aguardando um lar' },
    // Anos de atuação: calculado na hora, com o sufixo " anos".
    { value: anosDeAtuacao(), suffix: ' anos', label: `de atuação, desde ${ORGANIZACAO.fundacao}` },
  ];
}

/*
 * COMPONENTE: CountUp (interno)
 * O que faz: mostra um número que "conta" de 0 até o valor final quando fica visível.
 * Parâmetros (props):
 *   - value (number): o valor final.
 *   - suffix (string, padrão ''): texto depois do número (ex.: ' anos').
 *   - inView (boolean): se a faixa já apareceu na tela (só então a contagem começa).
 * Retorno: o número (animado ou final) seguido do sufixo.
 * Onde é usado: dentro de cada indicador do StatsStrip.
 */
// O quê: conta de 0 até o valor quando a faixa aparece na tela.
// Como: requestAnimationFrame com easing cúbico; quem pediu menos movimento vê o número final direto.
function CountUp({ value, suffix = '', inView }) {
  // true se o visitante configurou "reduzir movimento" no sistema.
  const reduceMotion = useReducedMotion();
  // Número mostrado durante a animação (começa em 0).
  const [displayValue, setDisplayValue] = useState(0);

  // Efeito da animação: roda quando a faixa aparece, quando a preferência muda ou quando o valor muda.
  useEffect(() => {
    // Não anima se ainda não está visível ou se o visitante prefere menos movimento.
    if (!inView || reduceMotion) return undefined;

    // Identificador do quadro agendado (para poder cancelar).
    let frameId = 0;
    // Momento em que a animação começou (preenchido no primeiro quadro).
    let startTime = 0;
    // Duração total da animação: 1400 ms (1,4 s).
    const duration = 1400;

    // Função chamada a cada quadro de desenho do navegador (cerca de 60 vezes por segundo).
    // "timestamp" é o horário atual em milissegundos, fornecido pelo navegador.
    const animate = (timestamp) => {
      // No primeiro quadro, guarda o horário de início.
      if (!startTime) startTime = timestamp;
      // Progresso de 0 a 1 (Math.min impede passar de 1).
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // "Easing cúbico" (ease-out): 1 − (1 − p)³ faz a contagem começar rápida e terminar devagar.
      // "**" é o operador de potência. Math.round arredonda para número inteiro.
      setDisplayValue(Math.round(value * (1 - (1 - progress) ** 3)));
      // Se ainda não terminou, agenda o próximo quadro (a função chama a si mesma via navegador).
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    // Agenda o primeiro quadro.
    frameId = requestAnimationFrame(animate);
    // Limpeza: cancela a animação se o componente sair da tela ou o efeito rodar de novo.
    return () => cancelAnimationFrame(frameId);
  }, [inView, reduceMotion, value]);

  return (
    <>
      {/* Com menos movimento, mostra o valor final direto; senão, o valor animado. */}
      {reduceMotion ? value : displayValue}
      {/* Sufixo (ex.: " anos"). */}
      {suffix}
    </>
  );
}

/*
 * COMPONENTE: StatsStrip
 * O que faz: busca os números na API e desenha a faixa com os 4 indicadores animados.
 * Parâmetros: nenhum.
 * Retorno: JSX da <section> da faixa.
 * Onde é usado: LandingPage.jsx.
 */
function StatsStrip() {
  // Ref ligada à <section>, para saber quando ela aparece na tela.
  const ref = useRef(null);
  // useInView(ref, opções): true quando 40% (amount: 0.4) da seção estiver visível.
  // once: true → depois de ficar true, não volta a false (anima uma vez só).
  const inView = useInView(ref, { once: true, amount: 0.4 });
  // Números vindos da API (null enquanto carrega).
  const [numeros, setNumeros] = useState(null);

  // Busca os números uma vez ao montar.
  useEffect(() => {
    // Permite cancelar a requisição.
    const controller = new AbortController();
    buscarNumeros({ signal: controller.signal })
      .then((dados) => {
        // Só guarda se não foi cancelado.
        if (!controller.signal.aborted) setNumeros(dados);
      })
      // Em caso de erro, os números continuam "—" (sem quebrar a página).
      .catch(() => {});
    // Limpeza: cancela a requisição.
    return () => controller.abort();
  }, []);

  return (
    // aria-label dá um nome à seção para leitores de tela; ref liga a seção ao useInView.
    <section className="home-stats" aria-label="A Patas em Casa em números" ref={ref}>
      <div className="wrap home-stats-grid">
        {/* Um bloco por indicador. "index" (posição na lista) é usado para atrasar cada animação. */}
        {buildStats(numeros).map((stat, index) => (
          <motion.div
            key={stat.label}
            className="home-stat"
            // Começa transparente e 16px abaixo.
            initial={{ opacity: 0, y: 16 }}
            // Quando visível, aparece e sobe; senão, fica no estado inicial.
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            // Cada bloco começa 0,1 s depois do anterior (efeito "cascata").
            transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
          >
            {/* Traço âmbar decorativo. */}
            <span className="home-stat-bar" aria-hidden="true" />
            {/* O número: "—" se ainda não há valor; senão, a contagem animada. */}
            <strong className="home-stat-value">
              {stat.value === null ? '—' : <CountUp value={stat.value} suffix={stat.suffix} inView={inView} />}
            </strong>
            {/* Descrição do indicador. */}
            <span className="home-stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Exporta a seção como padrão do arquivo.
export default StatsStrip;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao montar, o StatsStrip busca os números na API (enquanto isso, mostra "—").
 *   2. buildStats junta os números da API com os anos de atuação calculados.
 *   3. Quando 40% da faixa aparece na tela, inView vira true:
 *        - cada bloco aparece em cascata (Framer Motion);
 *        - cada CountUp anima de 0 até o valor com requestAnimationFrame.
 *   4. Quem prefere menos movimento vê os valores finais direto.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Animações com requestAnimationFrame e funções de "easing".
 *   - Operador de potência (**), Math.min e Math.round.
 *   - Detecção de visibilidade (useInView / IntersectionObserver).
 *   - useRef para ligar um elemento a um hook.
 *   - Acessibilidade: useReducedMotion, aria-label e aria-hidden.
 *   - Dados reais da API com estado de "carregando" (null → "—").
 *   - Animações em cascata com delay baseado no índice.
 * ============================================================================
 */
