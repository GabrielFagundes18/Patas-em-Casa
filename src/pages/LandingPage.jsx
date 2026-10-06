// O quê: importa hooks e seções que compõem a página inicial.
// Como: cada seção é um componente independente, enquanto useEffect controla observadores e scroll.
// Para quê: organiza a experiência institucional e de descoberta de adoção em uma única página.
import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import StatsStrip from '../components/StatsStrip/StatsStrip';



import HowItWorks from '../components/HowItWorks/HowItWorks';
import Donation from '../components/Donation/Donation';
import Stories from '../components/Stories/Stories';
import Footer from '../components/Footer/Footer';
import PetSectionContainer from '../components/PetSectionContainer/PetSectionContainer';
import { buscarEtapasAdocao } from '../services/conteudoService';

// O quê: descreve as etapas apresentadas na seção “Como funciona”.
// Como: cada objeto reúne título, explicação e chave de ícone consumidos pelo componente filho.
// Para quê: mantém conteúdo e renderização separados, facilitando a evolução do fluxo de adoção.
// Etapas padrão usadas só se o backend estiver indisponível; o conteúdo oficial vem de adoption_steps.
const defaultSteps = [
  { title: 'Encontre', description: 'Navegue pelos pets disponíveis perto de você.', icon: 'search' },
  { title: 'Conecte-se', description: 'Converse com o abrigo e conheça a história dele.', icon: 'heart' },
  { title: 'Cadastre-se', description: 'Preencha um formulário rápido de responsabilidade.', icon: 'clipboard' },
  { title: 'Leve para casa', description: 'Combine a retirada e comece a nova vida juntos.', icon: 'home' },
];

function LandingPage() {
  // O quê: declara o progresso de rolagem e a visibilidade da barra correspondente.
  // Como: useState preserva os valores entre eventos de scroll e renderizações.
  // Para quê: dá ao visitante uma indicação visual de quanto falta para concluir a página.
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [steps, setSteps] = useState(defaultSteps);

  // O quê: carrega as etapas de adoção cadastradas no banco.
  // Como: substitui as etapas padrão quando a API responde com ao menos uma etapa ativa.
  // Para quê: a seção "Como funciona" refletir o que a equipe mantém no sistema.
  useEffect(() => {
    const controller = new AbortController();
    buscarEtapasAdocao({ signal: controller.signal })
      .then((etapas) => {
        if (!controller.signal.aborted && etapas.length > 0) {
          setSteps(etapas.map((etapa) => ({ title: etapa.titulo, description: etapa.descricao })));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // O quê: prepara a animação de revelação das seções ao entrarem na viewport.
  // Como: respeita prefers-reduced-motion e usa IntersectionObserver para adicionar classes uma única vez.
  // Para quê: cria movimento progressivo sem impor animações a usuários que solicitaram redução de movimento.
  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    const revealTargets = document.querySelectorAll('.section-head, .pet-card, .impact-card, .donate, .step');

    revealTargets.forEach((element) => element.classList.add('reveal'));

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      revealTargets.forEach((element) => observer.observe(element));
      return () => observer.disconnect();
    }

    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }, []);

  // O quê: acompanha a posição vertical da janela e calcula o percentual percorrido.
  // Como: mede scrollHeight menos innerHeight, limita o resultado entre 0 e 100 e registra listener passivo.
  // Para quê: alimenta a barra de progresso sem bloquear a rolagem do navegador.
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

      setScrollProgress(progress);
      setShowProgressBar(scrollTop > 220);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // O quê: renderiza a estrutura completa da landing page.
  // Como: combina navegação, hero, estatísticas, vitrine, processo, doação, histórias e rodapé.
  // Para quê: apresentar a proposta da ONG e conduzir o usuário ao catálogo de adoção.
  return (
    <div className="app-shell">
      <div className={`scroll-progress ${showProgressBar ? 'visible' : ''}`} aria-hidden="true">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <StatsStrip />
        <PetSectionContainer />
        <HowItWorks steps={steps} />
        <Donation />
        <Stories />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
