import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import StatsStrip from '../components/StatsStrip/StatsStrip';



import HowItWorks from '../components/HowItWorks/HowItWorks';
import Donation from '../components/Donation/Donation';
import Stories from '../components/Stories/Stories';
import Footer from '../components/Footer/Footer';
import PetSectionContainer from '../components/PetSectionContainer/PetSectionContainer';



const steps=[
    { title: 'Encontre', description: 'Navegue pelos pets disponíveis perto de você.', icon: 'search' },
    { title: 'Conecte-se', description: 'Converse com o abrigo e conheça a história dele.', icon: 'heart' },
    { title: 'Cadastre-se', description: 'Preencha um formulário rápido de responsabilidade.', icon: 'clipboard' },
    { title: 'Leve para casa', description: 'Combine a retirada e comece a nova vida juntos.', icon: 'home' },
  ]

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
