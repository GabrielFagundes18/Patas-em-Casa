// O quê: moldura das páginas internas do site (cabeçalho, conteúdo e rodapé).
// Como: o conteúdo fica em <main id="main-content">, alvo do link "pular para o conteúdo".
// Para quê: perfil do animal, "Como funciona", doação e 404 com a mesma navegação da Home.
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './PublicLayout.css';

export function PublicLayout({ children, className = '' }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
      <Header />
      <main id="main-content" className={`public-page ${className}`.trim()}>
        {children}
      </main>
      <Footer />
    </>
  );
}
