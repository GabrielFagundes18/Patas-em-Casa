/*
 * ============================================================================
 * ARQUIVO: LandingPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a PÁGINA INICIAL do site ("/"). Ela monta, em ordem, todas as seções da
 *   home: topo (Hero), números, vitrine de animais, como funciona, doação,
 *   histórias e voluntariado, com cabeçalho e rodapé. Também controla:
 *     - a rolagem até uma seção quando a URL tem "#" (ex.: /#adotar);
 *     - a animação de "revelação" das seções ao aparecerem na tela;
 *     - a barra de progresso de leitura no topo.
 *
 * PRINCIPAIS ITENS:
 *   - LandingPage(): o componente da página (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, framer-motion (MotionConfig).
 *   - shared/components/layout/Header e Footer.
 *   - ./sections/Hero, StatsStrip, PetSection, HowItWorks, Donation, Stories.
 *   - features/volunteers/VolunteerSignup (formulário de voluntariado).
 *   - shared/hooks/useAdoptionSteps (etapas) e useAvailableAnimals (animais).
 *   - ./LandingPage.css (estilos da home).
 *   - Classes .reveal/.is-visible (globals.css) e .scroll-progress/.skip-link (Header.css).
 *   - Quem usa: app/App.js, na rota "/".
 * ============================================================================
 */

// O quê: importa hooks e seções que compõem a página inicial.
// Como: cada seção é um componente independente, enquanto useEffect controla observadores e scroll.
// Para quê: organiza a experiência institucional e de descoberta de adoção em uma única página.
// Ordem: topo, números, vitrine, como funciona, doação, histórias, voluntariado.
// Hooks do React.
import { useEffect, useState } from 'react';
// MotionConfig: configuração global das animações do Framer Motion para os componentes de dentro.
import { MotionConfig } from 'framer-motion';
// Cabeçalho do site.
import Header from 'shared/components/layout/Header/Header';
// Seções da página inicial.
import Hero from './sections/Hero/Hero';
import StatsStrip from './sections/StatsStrip/StatsStrip';
import PetSection from './sections/PetSection/PetSection';
import HowItWorks from './sections/HowItWorks/HowItWorks';
import Donation from './sections/Donation/Donation';
import Stories from './sections/Stories/Stories';
// Formulário de inscrição de voluntários.
import VolunteerSignup from 'features/volunteers/VolunteerSignup/VolunteerSignup';
// Rodapé do site.
import Footer from 'shared/components/layout/Footer/Footer';
// Hook com as etapas do processo de adoção.
import { useAdoptionSteps } from 'shared/hooks/useAdoptionSteps';
// Hook com os animais disponíveis.
import { useAvailableAnimals } from 'shared/hooks/useAvailableAnimals';
// Estilos da página inicial.
import './LandingPage.css';

/*
 * COMPONENTE: LandingPage
 * O que faz: monta a página inicial e controla rolagem, animações de revelação e barra de progresso.
 * Parâmetros: nenhum.
 * Retorno: JSX da página completa.
 * Onde é usado: app/App.js, rota "/".
 */
function LandingPage() {
  // O quê: declara o progresso de rolagem e a visibilidade da barra correspondente.
  // Como: useState preserva os valores entre eventos de scroll e renderizações.
  // Para quê: dá ao visitante uma indicação visual de quanto falta para concluir a página.
  // scrollProgress: de 0 a 100 (% da página já percorrida).
  const [scrollProgress, setScrollProgress] = useState(0);
  // showProgressBar: a barra só aparece depois de rolar um pouco.
  const [showProgressBar, setShowProgressBar] = useState(false);
  // Etapas do processo de adoção (padrão ou vindas da API).
  const steps = useAdoptionSteps();
  // Uma busca só alimenta o destaque do topo e a vitrine.
  // Desestruturação: pega pets, loading e error do objeto devolvido pelo hook.
  const { pets, loading, error } = useAvailableAnimals();

  // O quê: rola até a seção do endereço (ex.: /#adotar vindo de outra página).
  // Como: espera o primeiro desenho da Home e chama scrollIntoView no elemento do hash.
  // Para quê: os links do menu funcionam a partir de qualquer página do site.
  useEffect(() => {
    // window.location.hash é a parte da URL depois do "#" (incluindo o "#"). Sem hash, não faz nada.
    if (!window.location.hash) return undefined;
    // requestAnimationFrame agenda a função para o próximo "quadro" de desenho do navegador,
    // garantindo que as seções já existam na tela.
    const frame = window.requestAnimationFrame(() => {
      // .slice(1) tira o "#"; decodeURIComponent desfaz caracteres codificados (ex.: %C3%A7 → ç).
      // getElementById acha a seção; "?." evita erro se não existir; scrollIntoView rola até ela.
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    });
    // Limpeza: cancela o agendamento se a página sair antes.
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // O quê: prepara a animação de revelação das seções ao entrarem na viewport.
  // Como: respeita prefers-reduced-motion e usa IntersectionObserver para adicionar classes uma única vez.
  // Para quê: cria movimento progressivo sem impor animações a usuários que solicitaram redução de movimento.
  useEffect(() => {
    // Verifica se o visitante prefere menos movimento. matchMedia testa uma media query pelo JS.
    // O ternário protege ambientes sem matchMedia (ex.: alguns testes).
    const prefersReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    // Elementos que terão a animação: cabeçalhos de seção e passos.
    const revealTargets = document.querySelectorAll('.home-head, .home-step');

    // Adiciona a classe "reveal" (estado inicial da animação, definido no globals.css).
    revealTargets.forEach((element) => element.classList.add('reveal'));

    // Se pode animar E o navegador tem IntersectionObserver ("in" verifica se a propriedade existe)...
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      // IntersectionObserver avisa quando um elemento entra (ou sai) da área visível.
      const observer = new IntersectionObserver(
        // Função chamada com a lista de elementos que mudaram de visibilidade.
        (entries) => {
          entries.forEach((entry) => {
            // isIntersecting = o elemento está aparecendo na tela.
            if (entry.isIntersecting) {
              // Adiciona "is-visible" (estado final da animação).
              entry.target.classList.add('is-visible');
              // Para de observar: a animação acontece uma vez só.
              observer.unobserve(entry.target);
            }
          });
        },
        // threshold: 0.12 → dispara quando 12% do elemento estiver visível.
        // rootMargin: reduz 40px da parte de baixo da área considerada visível.
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      // Começa a observar cada elemento.
      revealTargets.forEach((element) => observer.observe(element));
      // Limpeza: desliga o observador.
      return () => observer.disconnect();
    }

    // Sem animação (preferência do usuário ou navegador antigo): mostra tudo imediatamente.
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }, []);

  // O quê: acompanha a posição vertical da janela e calcula o percentual percorrido.
  // Como: mede scrollHeight menos innerHeight, limita o resultado entre 0 e 100 e registra listener passivo.
  // Para quê: alimenta a barra de progresso sem bloquear a rolagem do navegador.
  useEffect(() => {
    // Função chamada a cada rolagem.
    const handleScroll = () => {
      // Quantos pixels já rolaram.
      const scrollTop = window.scrollY;
      // Quanto é possível rolar no total: altura do documento menos a altura da janela.
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      // Percentual percorrido, limitado entre 0 e 100 (Math.max e Math.min "prendem" o valor).
      // Se não houver o que rolar (docHeight 0), o progresso é 0.
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

      // Atualiza o estado (a barra redesenha com a nova largura).
      setScrollProgress(progress);
      // A barra só aparece depois de 220px de rolagem.
      setShowProgressBar(scrollTop > 220);
    };

    // Calcula uma vez no início.
    handleScroll();
    // Escuta a rolagem (listener passivo = não bloqueia a rolagem).
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Limpeza: para de escutar.
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // O quê: renderiza a estrutura completa da landing page.
  // Como: MotionConfig faz as animações do framer-motion respeitarem "reduzir movimento" do sistema.
  // Para quê: apresentar a ONG e levar a adotar, doar ou ser voluntário.
  return (
    // reducedMotion="user": segue a configuração de "reduzir movimento" do sistema do visitante.
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        {/* Barra de progresso: a classe "visible" a mostra; aria-hidden porque é só decorativa. */}
        <div className={`scroll-progress ${showProgressBar ? 'visible' : ''}`} aria-hidden="true">
          {/* A largura da parte preenchida vem do estado. "style" recebe um objeto JS:
              as chaves duplas {{ }} são: { } para código JS + { } do objeto. */}
          <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>
        {/* Link de acessibilidade para pular direto ao conteúdo principal. */}
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        {/* Cabeçalho do site. */}
        <Header />
        {/* Conteúdo principal, com as seções em ordem. */}
        <main id="main-content">
          {/* Topo, com destaque de um animal (recebe a lista de animais). */}
          <Hero pets={pets} />
          {/* Faixa de números de impacto (busca seus próprios dados). */}
          <StatsStrip />
          {/* Vitrine de animais (recebe a lista e os estados de carregamento/erro). */}
          <PetSection pets={pets} loading={loading} error={error} />
          {/* Como funciona a adoção (recebe as etapas). */}
          <HowItWorks steps={steps} />
          {/* Chamada para doação. */}
          <Donation />
          {/* Histórias de adoção (busca seus próprios dados). */}
          <Stories />
          {/* Formulário de voluntariado. */}
          <VolunteerSignup />
        </main>
        {/* Rodapé do site. */}
        <Footer />
      </div>
    </MotionConfig>
  );
}

// Exporta a página como padrão do arquivo.
export default LandingPage;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir "/", o App desenha a LandingPage.
 *   2. Os hooks buscam as etapas de adoção e os animais (uma só busca de animais
 *      alimenta o topo e a vitrine).
 *   3. Três efeitos rodam uma vez ao montar:
 *        a) se a URL tiver "#secao", rola até ela;
 *        b) prepara a animação de revelação com IntersectionObserver (ou mostra tudo,
 *           se o visitante prefere menos movimento);
 *        c) começa a calcular o progresso de rolagem para a barra do topo.
 *   4. A página desenha cabeçalho, as 7 seções em ordem e o rodapé.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Composição de página a partir de componentes de seção.
 *   - "Elevar o estado" (lifting state up): buscar os animais uma vez e passar como props.
 *   - useEffect para integrar APIs do navegador: requestAnimationFrame, IntersectionObserver,
 *     matchMedia e eventos de scroll — sempre com função de limpeza.
 *   - Manipulação de classes CSS (classList.add) para animações.
 *   - Estilo inline com objeto (style={{ width: ... }}).
 *   - Acessibilidade: skip link, aria-hidden, prefers-reduced-motion e MotionConfig.
 *   - window.location.hash, decodeURIComponent e scrollIntoView.
 * ============================================================================
 */
