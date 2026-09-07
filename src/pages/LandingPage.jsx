import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Hero from '../components/home/Hero';
import StatsStrip from '../components/home/StatsStrip';


import HowItWorks from '../components/home/HowItWorks';
import Donation from '../components/home/Donation';
import Stories from '../components/home/Stories';
import Footer from '../components/common/Footer';
import PetSectionContainer from '../components/home/PetSectionContainer';



const steps = [
  {
    title: 'Escolha',
    description:
      'Navegue pela vitrine e encontre um animal com o perfil que combina com sua rotina.',
  },
  {
    title: 'Formulário',
    description:
      'Responda o questionário de posse responsável — leva cerca de 5 minutos.',
  },
  {
    title: 'Entrevista',
    description:
      'Nossa equipe entra em contato para uma conversa rápida e, se preciso, visita ao lar.',
  },
  {
    title: 'Adoção',
    description:
      'Assinatura do termo de adoção responsável e boas-vindas ao novo lar.',
  },
];

function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);

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
