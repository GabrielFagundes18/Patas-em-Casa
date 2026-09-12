// O quê: importa estilos, hooks e componentes de navegação.
// Como: useEffect observa a rolagem, useState controla o menu e Link usa o roteador sem recarregar a aplicação.
// Para quê: construir a navegação responsiva e o acesso ao catálogo.
import './Header.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// O quê: define os destinos da navegação principal.
// Como: cada item combina href e label para ser iterado em desktop e mobile.
// Para quê: manter os menus sincronizados e evitar duplicação de conteúdo.
const navLinks = [
  { href: '#adotar', label: 'Adotar' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#ajudar', label: 'Ajudar' },
  { href: '#historias', label: 'Histórias' },
];

function Header() {
  // O quê: armazena se o drawer mobile está aberto e se a página foi rolada.
  // Como: estados booleanos alteram atributos acessíveis e classes CSS.
  // Para quê: controlar a visibilidade do menu e a aparência persistente do cabeçalho.
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // O quê: acompanha a rolagem para atualizar o estado visual do header.
  // Como: compara scrollY com 20 pixels, registra listener passivo e remove-o no cleanup.
  // Para quê: aplicar o estilo compacto somente após o usuário começar a navegar pela página.
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // O quê: renderiza cabeçalho desktop, ações e drawer mobile.
  // Como: map percorre navLinks e expressões condicionais refletem isOpen/scrolled no DOM.
  // Para quê: oferecer navegação consistente em diferentes larguras de tela.
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
