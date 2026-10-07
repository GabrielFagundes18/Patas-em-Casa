// O quê: importa hooks e seções que compõem a página inicial.
// Como: cada seção é um componente independente, enquanto useEffect controla observadores e scroll.
// Para quê: organiza a experiência institucional e de descoberta de adoção em uma única página.
// Ordem: topo, números, vitrine, como funciona, doação, histórias, voluntariado.
import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import Header from '../shared/components/layout/Header/Header';
import Hero from '../components/Hero/Hero';
import StatsStrip from '../components/StatsStrip/StatsStrip';
import PetSection from '../components/PetSectionContainer/PetSectionContainer';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Donation from '../components/Donation/Donation';
import Stories from '../components/Stories/Stories';
import VolunteerSignup from '../components/VolunteerSignup/VolunteerSignup';
import Footer from '../shared/components/layout/Footer/Footer';
import { useAdoptionSteps } from '../shared/hooks/useAdoptionSteps';
import { useAvailableAnimals } from '../shared/hooks/useAvailableAnimals';
import './LandingPage.css';

function LandingPage() {
  // O quê: declara o progresso de rolagem e a visibilidade da barra correspondente.
  // Como: useState preserva os valores entre eventos de scroll e renderizações.
  // Para quê: dá ao visitante uma indicação visual de quanto falta para concluir a página.
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const steps = useAdoptionSteps();
  // Uma busca só alimenta o destaque do topo e a vitrine.
  const { pets, loading, error } = useAvailableAnimals();

  // O quê: rola até a seção do endereço (ex.: /#adotar vindo de outra página).
  // Como: espera o primeiro desenho da Home e chama scrollIntoView no elemento do hash.
  // Para quê: os links do menu funcionam a partir de qualquer página do site.
  useEffect(() => {
    if (!window.location.hash) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // O quê: prepara a animação de revelação das seções ao entrarem na viewport.
  // Como: respeita prefers-reduced-motion e usa IntersectionObserver para adicionar classes uma única vez.
  // Para quê: cria movimento progressivo sem impor animações a usuários que solicitaram redução de movimento.
  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    const revealTargets = document.querySelectorAll('.home-head, .home-step');

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
  // Como: MotionConfig faz as animações do framer-motion respeitarem "reduzir movimento" do sistema.
  // Para quê: apresentar a ONG e levar a adotar, doar ou ser voluntário.
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <div className={`scroll-progress ${showProgressBar ? 'visible' : ''}`} aria-hidden="true">
          <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="main-content">
          <Hero pets={pets} />
          <StatsStrip />
          <PetSection pets={pets} loading={loading} error={error} />
          <HowItWorks steps={steps} />
          <Donation />
          <Stories />
          <VolunteerSignup />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
