import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsStrip from '../components/StatsStrip';
import PetSection from '../components/PetSection';
import HowItWorks from '../components/HowItWorks';
import Donation from '../components/Donation';
import Stories from '../components/Stories';
import Footer from '../components/Footer';

const pets = [
  {
    name: 'Mel',
    code: '#014',
    kind: 'Cão',
    size: 'Pequeno',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1517849845537-4d257902861a?q=80&w=600&auto=format&fit=crop',
    alt: 'Mel, cadela vira-lata de pequeno porte',
    stamp: 'CASTRADA<br>VACINADA',
    meta: 'Vira-lata · fêmea · 2 anos · pequeno porte',
    tags: ['se dá bem c/ crianças', 'ideal p/ apto'],
    urgent: false,
  },
  {
    name: 'Thor',
    code: '#031',
    kind: 'Cão',
    size: 'Grande',
    ageGroup: 'Adulto',
    apartmentFriendly: false,
    image:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600&auto=format&fit=crop',
    alt: 'Thor, cachorro de grande porte',
    stamp: 'CASTRADO<br>VERMIF.',
    meta: 'SRD · macho · 4 anos · grande porte',
    tags: ['se dá bem c/ cães', 'sociável'],
    urgent: false,
  },
  {
    name: 'Nina',
    code: '#048',
    kind: 'Gato',
    size: 'Pequeno',
    ageGroup: 'Filhote',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=600&auto=format&fit=crop',
    alt: 'Nina, gatinha filhote',
    stamp: 'VACINADA<br>1ª DOSE',
    meta: 'Gata SRD · fêmea · filhote · pequeno porte',
    tags: ['brincalhona', 'ideal p/ apto'],
    urgent: false,
  },
  {
    name: 'Duque',
    code: '#009',
    kind: 'Cão',
    size: 'Médio',
    ageGroup: 'Idoso',
    apartmentFriendly: false,
    image:
      'https://images.unsplash.com/photo-1583512603806-077998240c7a?q=80&w=600&auto=format&fit=crop',
    alt: 'Duque, cachorro idoso',
    stamp: 'APADRINHAR',
    meta: 'SRD · macho · idoso · em tratamento',
    tags: ['calmo', 'precisa de medicação'],
    urgent: true,
  },
  {
    name: 'Pipoca',
    code: '#052',
    kind: 'Cão',
    size: 'Pequeno',
    ageGroup: 'Filhote',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=600&auto=format&fit=crop',
    alt: 'Pipoca, filhote de cachorro caramelo',
    stamp: 'VACINADO<br>VERMIF.',
    meta: 'Vira-lata · macho · 4 meses · pequeno porte',
    tags: ['energia alta', 'ideal p/ apto', 'curioso'],
    urgent: false,
  },
  {
    name: 'Chico',
    code: '#064',
    kind: 'Gato',
    size: 'Médio',
    ageGroup: 'Idoso',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop',
    alt: 'Chico, gato rajado idoso',
    stamp: 'CASTRADO<br>VACINADO',
    meta: 'Gato SRD · macho · 9 anos · calmo',
    tags: ['dócil', 'gosta de colo', 'ideal p/ idosos'],
    urgent: false,
  },
  {
    name: 'Paçoca',
    code: '#077',
    kind: 'Cão',
    size: 'Médio',
    ageGroup: 'Jovem',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=600&auto=format&fit=crop',
    alt: 'Paçoca, cachorro brincalhão de porte médio',
    stamp: 'CASTRADO<br>VACINADO',
    meta: 'SRD · macho · 1 ano · médio porte',
    tags: ['sociável', 'se dá bem c/ gatos', 'brincalhão'],
    urgent: false,
  },
  {
    name: 'Luna',
    code: '#081',
    kind: 'Gato',
    size: 'Pequeno',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=600&auto=format&fit=crop',
    alt: 'Luna, gata preta com olhos verdes',
    stamp: 'CASTRADA<br>TESTADA FEV/FIV-',
    meta: 'Gata preta · fêmea · 3 anos · independente',
    tags: ['tranquila', 'ideal p/ quem trabalha fora'],
    urgent: false,
  },
  {
    name: 'Toby',
    code: '#019',
    kind: 'Cão',
    size: 'Grande',
    ageGroup: 'Adulto',
    apartmentFriendly: false,
    image:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=600&auto=format&fit=crop',
    alt: 'Toby, cachorro sorridente em área externa',
    stamp: 'URGENTE<br>LAR TEMPORÁRIO',
    meta: 'SRD · macho · 5 anos · grande porte',
    tags: ['precisa de quintal', 'protetor', 'carinhoso'],
    urgent: true,
  },
  {
    name: 'Mia',
    code: '#093',
    kind: 'Gato',
    size: 'Pequeno',
    ageGroup: 'Filhote',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=600&auto=format&fit=crop',
    alt: 'Mia, gatinha tricolor filhote',
    stamp: 'RESGATADA<br>EM TRATAMENTO',
    meta: 'Gata tricolor · fêmea · 3 meses',
    tags: ['muito dócil', 'precisa de atenção'],
    urgent: true,
  },
  {
    name: 'Zeus',
    code: '#102',
    kind: 'Cão',
    size: 'Grande',
    ageGroup: 'Jovem',
    apartmentFriendly: false,
    image:
      'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?q=80&w=600&auto=format&fit=crop',
    alt: 'Zeus, cachorro grande e brincalhão',
    stamp: 'CASTRADO<br>VACINADO',
    meta: 'SRD · macho · 1.5 anos · ativo',
    tags: ['gosta de passeios', 'ideal p/ casas grandes'],
    urgent: false,
  },
  {
    name: 'Amora',
    code: '#115',
    kind: 'Cão',
    size: 'Pequeno',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=600&auto=format&fit=crop',
    alt: 'Amora, cadela peluda de pequeno porte',
    stamp: 'CASTRADA<br>VERMIF.',
    meta: 'SRD · fêmea · 2 anos · muito carinhosa',
    tags: ['companheira', 'silenciosa', 'ideal p/ apto'],
    urgent: false,
  },
  {
    name: 'Simba',
    code: '#128',
    kind: 'Gato',
    size: 'Médio',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=600&auto=format&fit=crop',
    alt: 'Simba, gato alaranjado deitado no sol',
    stamp: 'CASTRADO<br>TESTADO FEV/FIV-',
    meta: 'Gato Laranja · macho · 4 anos',
    tags: ['preguiçoso', 'dócil', 'amantes de sol'],
    urgent: false,
  },
  {
    name: 'Bob',
    code: '#134',
    kind: 'Cão',
    size: 'Médio',
    ageGroup: 'Idoso',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=600&auto=format&fit=crop',
    alt: 'Bob, cachorro de porte médio olhar tranquilo',
    stamp: 'APADRINHAR<br>SÊNIOR',
    meta: 'SRD · macho · 10 anos · dócil',
    tags: ['calmo', 'ótimo p/ idosos', 'pouco latido'],
    urgent: false,
  },
  {
    name: 'Belinha',
    code: '#141',
    kind: 'Cão',
    size: 'Pequeno',
    ageGroup: 'Filhote',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop',
    alt: 'Belinha, filhote correndo no gramado',
    stamp: 'VACINADA<br>1ª DOSE',
    meta: 'Vira-lata · fêmea · 5 meses · brincalhona',
    tags: ['sociável', 'cheia de energia'],
    urgent: false,
  },
  {
    name: 'Tom',
    code: '#159',
    kind: 'Gato',
    size: 'Médio',
    ageGroup: 'Jovem',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=600&auto=format&fit=crop',
    alt: 'Tom, gato branco e cinza curioso',
    stamp: 'CASTRADO<br>VACINADO',
    meta: 'Gato SRD · macho · 1 ano',
    tags: ['curioso', 'se dá bem c/ outros gatos'],
    urgent: false,
  },
  {
    name: 'Marley',
    code: '#163',
    kind: 'Cão',
    size: 'Grande',
    ageGroup: 'Jovem',
    apartmentFriendly: false,
    image:
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=600&auto=format&fit=crop',
    alt: 'Marley, cachorro grande atleta',
    stamp: 'CASTRADO<br>VERMIF.',
    meta: 'SRD · macho · 2 anos · energético',
    tags: ['precisa de espaço', 'gosta de correr'],
    urgent: false,
  },
  {
    name: 'Pandora',
    code: '#172',
    kind: 'Gato',
    size: 'Pequeno',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=600&auto=format&fit=crop',
    alt: 'Pandora, gata de pelagem escama de peixe',
    stamp: 'CASTRADA<br>VACINADA',
    meta: 'Gata SRD · fêmea · 2.5 anos',
    tags: ['observadora', 'tranquila'],
    urgent: false,
  },
  {
    name: 'Max',
    code: '#188',
    kind: 'Cão',
    size: 'Médio',
    ageGroup: 'Adulto',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=600&auto=format&fit=crop',
    alt: 'Max, cachorro caramelo pequeno/médio',
    stamp: 'URGENTE<br>CASTRADO',
    meta: 'SRD Caramelo · macho · 3 anos',
    tags: ['muito dócil', 'se dá bem c/ crianças'],
    urgent: true,
  },
  {
    name: 'Lola',
    code: '#194',
    kind: 'Gato',
    size: 'Pequeno',
    ageGroup: 'Filhote',
    apartmentFriendly: true,
    image:
      'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=600&auto=format&fit=crop',
    alt: 'Lola, gatinha filhote deitada',
    stamp: 'VACINADA<br>VERMIF.',
    meta: 'Gata SRD · fêmea · 2 meses',
    tags: ['carinhosa', 'ideal p/ apto'],
    urgent: false,
  },
];

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
        <PetSection pets={pets} />
        <HowItWorks steps={steps} />
        <Donation />
        <Stories />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
