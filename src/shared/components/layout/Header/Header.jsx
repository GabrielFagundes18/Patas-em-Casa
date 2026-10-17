/*
 * ============================================================================
 * ARQUIVO: Header.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o CABEÇALHO do site público: logotipo, menu de navegação, botão "Quero
 *   adotar" e, no celular, um botão "hambúrguer" que abre uma gaveta (drawer)
 *   com o menu. Quando a página é rolada, o cabeçalho muda de aparência.
 *
 * PRINCIPAIS ITENS:
 *   - navLinks: lista dos itens do menu.
 *   - NavItem({ link, onClick }): desenha um item do menu (âncora <a> ou Link).
 *   - Header(): o componente do cabeçalho (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./Header.css      → estilos do cabeçalho, do menu e da gaveta.
 *   - react             → useEffect e useState.
 *   - react-router-dom  → Link.
 *   - lucide-react      → ícone PawPrint (pata do logotipo).
 *   - Usado por: shared/components/layout/PublicLayout/PublicLayout.jsx e pela
 *     página inicial (features/home/LandingPage.jsx).
 * ============================================================================
 */

// O quê: importa estilos, hooks e componentes de navegação.
// Como: useEffect observa a rolagem, useState controla o menu e Link usa o roteador sem recarregar a aplicação.
// Para quê: construir a navegação responsiva e o acesso ao catálogo.
// Estilos do cabeçalho.
import './Header.css';
// Hooks do React.
import { useEffect, useState } from 'react';
// Link: navegação interna sem recarregar.
import { Link } from 'react-router-dom';
// Ícone de pata (logotipo).
import { PawPrint } from 'lucide-react';
// O quê: define os destinos da navegação principal.
// Como: cada item combina href e label para ser iterado em desktop e mobile.
// Para quê: manter os menus sincronizados e evitar duplicação de conteúdo.
// Endereços absolutos: o menu também aparece nas páginas internas (perfil, doação, "Como funciona").
// "/#adotar" = página inicial + rolar até a seção com id="adotar".
const navLinks = [
  { href: '/#adotar', label: 'Adotar' },
  { href: '/como-funciona', label: 'Como funciona' },
  { href: '/doar', label: 'Doar' },
  { href: '/#historias', label: 'Histórias' },
  { href: '/#voluntariado', label: 'Voluntariado' },
];

/*
 * COMPONENTE: NavItem (interno)
 * O que faz: desenha um item do menu, escolhendo a tag certa para o tipo de destino.
 * Parâmetros (props):
 *   - link (objeto { href, label }): o destino e o texto do item.
 *   - onClick (função | undefined): o que fazer ao clicar (ex.: fechar a gaveta no celular).
 * Retorno: JSX de um <a> (para âncoras "/#...") ou de um <Link> (para páginas).
 * Onde é usado: no menu do desktop e na gaveta do celular, logo abaixo.
 */
// Âncoras da Home usam <a> (o navegador rola até a seção); páginas usam Link (sem recarregar).
function NavItem({ link, onClick }) {
  // Ternário: se o endereço começa com "/#", é uma âncora → usa <a>; senão → usa <Link>.
  return link.href.startsWith('/#')
    ? <a href={link.href} className="nav-link" onClick={onClick}>{link.label}</a>
    : <Link to={link.href} className="nav-link" onClick={onClick}>{link.label}</Link>;
}

/*
 * COMPONENTE: Header
 * O que faz: desenha o cabeçalho completo e controla a gaveta do celular e o estilo ao rolar.
 * Parâmetros: nenhum.
 * Retorno: JSX do <header>.
 * Onde é usado: PublicLayout.jsx e LandingPage.jsx.
 */
function Header() {
  // O quê: armazena se o drawer mobile está aberto e se a página foi rolada.
  // Como: estados booleanos alteram atributos acessíveis e classes CSS.
  // Para quê: controlar a visibilidade do menu e a aparência persistente do cabeçalho.
  // isOpen: a gaveta do celular está aberta?
  const [isOpen, setIsOpen] = useState(false);
  // scrolled: a página já foi rolada mais de 20px?
  const [scrolled, setScrolled] = useState(false);

  // O quê: acompanha a rolagem para atualizar o estado visual do header.
  // Como: compara scrollY com 20 pixels, registra listener passivo e remove-o no cleanup.
  // Para quê: aplicar o estilo compacto somente após o usuário começar a navegar pela página.
  useEffect(() => {
    // Função chamada a cada rolagem: window.scrollY é quantos pixels a página já rolou.
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Chama uma vez já no início (a página pode abrir já rolada, ex.: ao voltar).
    handleScroll();
    // Escuta o evento de rolagem. { passive: true } avisa o navegador que não vamos
    // impedir a rolagem (preventDefault), o que deixa a rolagem mais fluida.
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Limpeza: para de escutar quando o cabeçalho sai da tela.
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // O quê: renderiza cabeçalho desktop, ações e drawer mobile.
  // Como: map percorre navLinks e expressões condicionais refletem isOpen/scrolled no DOM.
  // Para quê: oferecer navegação consistente em diferentes larguras de tela.
  return (
    // A classe "scrolled" é aplicada quando a página foi rolada (o CSS muda o visual).
    <header className={scrolled ? 'scrolled' : ''}>
      {/* <nav> é a tag semântica para blocos de navegação. */}
      <nav className="nav">
        {/* Logotipo: leva à página inicial. O aria-label descreve o link para leitores de tela. */}
        <Link to="/" className="logo" aria-label="Patas em Casa — página inicial">
          {/* Ícone decorativo (aria-hidden). */}
          <span className="logo-mark" aria-hidden="true">
            <PawPrint size={20} />
          </span>
          Patas em Casa
        </Link>

        {/* Menu do computador: um NavItem para cada item de navLinks. */}
        <div className="nav-links" aria-label="Navegação principal">
          {navLinks.map((link) => <NavItem key={link.href} link={link} />)}
        </div>

        {/* Ações à direita: botão "Quero adotar" e botão do menu do celular. */}
        <div className="nav-actions">
          <Link to="/adotar" className="nav-cta">
            Quero adotar
          </Link>
          {/* Botão "hambúrguer" (3 barrinhas), visível só em telas pequenas (via CSS). */}
          <button
            type="button"
            className="menu-toggle"
            id="menuToggle"
            // aria-expanded diz a leitores de tela se o menu controlado está aberto.
            aria-expanded={isOpen}
            // aria-controls aponta o id do elemento que este botão abre/fecha.
            aria-controls="mobileDrawer"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            // Inverte o estado: aberto ↔ fechado. "(open) => !open" usa o valor mais recente.
            onClick={() => setIsOpen((open) => !open)}
          >
            {/* As três barrinhas do ícone (desenhadas pelo CSS). */}
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </nav>

      {/* Gaveta do celular: recebe a classe "open" quando isOpen é true (o CSS a mostra). */}
      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`} id="mobileDrawer">
        {/* Os mesmos itens do menu; ao clicar em um, a gaveta fecha. */}
        {navLinks.map((link) => <NavItem key={link.href} link={link} onClick={() => setIsOpen(false)} />)}
        {/* Botão de destaque na gaveta; também fecha a gaveta ao clicar. */}
        <Link to="/adotar" className="mobile-cta" onClick={() => setIsOpen(false)}>
          Quero adotar →
        </Link>
      </div>
    </header>
  );
}

// Exporta o cabeçalho como padrão do arquivo.
export default Header;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao aparecer, o Header começa a escutar a rolagem da página.
 *   2. Se a página rolar mais de 20px, "scrolled" vira true e o <header> ganha a classe "scrolled".
 *   3. No computador, o menu aparece em linha; no celular, o botão hambúrguer
 *      alterna "isOpen", que mostra/esconde a gaveta (classe "open").
 *   4. Cada item do menu é desenhado pelo NavItem: âncoras da home com <a>, páginas com <Link>.
 *   5. Clicar num item da gaveta fecha a gaveta.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Menu responsivo (desktop x mobile) e o padrão "hambúrguer + gaveta".
 *   - Eventos de rolagem (scroll), listeners passivos e limpeza no useEffect.
 *   - Estado booleano e alternância com setState(v => !v).
 *   - Link (navegação interna) x <a href="/#secao"> (âncora com rolagem).
 *   - Componentes pequenos dentro do mesmo arquivo (NavItem).
 *   - Acessibilidade: <nav>, aria-expanded, aria-controls, aria-label, aria-hidden.
 *   - Classes CSS condicionais.
 * ============================================================================
 */
