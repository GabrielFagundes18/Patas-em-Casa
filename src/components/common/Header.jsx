import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
const navLinks = [
  { href: '#adotar', label: 'Adotar' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#ajudar', label: 'Ajudar' },
  { href: '#historias', label: 'Histórias' },
];

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <nav className="nav">
        <a href="#main-content" className="logo" aria-label="Ir para o início">
          Patas em Casa
        </a>

        <div className="nav-links" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <Link to="/adotar" className="nav-cta">
            Ver animais para adoção
          </Link>
          <button
            type="button"
            className="menu-toggle"
            id="menuToggle"
            aria-expanded={isOpen}
            aria-controls="mobileDrawer"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </nav>

      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`} id="mobileDrawer">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <Link to="/adotar" className="mobile-cta" onClick={() => setIsOpen(false)}>
          Quero adotar →
        </Link>
      </div>
    </header>
  );
}

export default Header;
