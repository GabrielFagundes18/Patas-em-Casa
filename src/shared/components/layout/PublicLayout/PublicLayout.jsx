/*
 * ============================================================================
 * ARQUIVO: PublicLayout.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a "MOLDURA" das páginas internas do site público: coloca o cabeçalho em
 *   cima, o conteúdo da página no meio e o rodapé embaixo. Também inclui um link
 *   escondido "Pular para o conteúdo", que aparece ao usar o teclado (Tab) e
 *   leva direto ao conteúdo principal (recurso de acessibilidade).
 *
 * PRINCIPAIS ITENS:
 *   - PublicLayout({ children, className }): o componente (exportação nomeada).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - shared/components/layout/Header/Header.jsx → cabeçalho do site.
 *   - shared/components/layout/Footer/Footer.jsx → rodapé do site.
 *   - ./PublicLayout.css                         → estilos da moldura.
 *   - A classe "skip-link" é estilizada em shared/components/layout/Header/Header.css.
 *   - Usado por: app/NotFoundPage.jsx, features/animal-profile/AnimalProfilePage.jsx,
 *     features/adoption/HowAdoptionWorksPage.jsx e as páginas de doação.
 * ============================================================================
 */

// O quê: moldura das páginas internas do site (cabeçalho, conteúdo e rodapé).
// Como: o conteúdo fica em <main id="main-content">, alvo do link "pular para o conteúdo".
// Para quê: perfil do animal, "Como funciona", doação e 404 com a mesma navegação da Home.
// Cabeçalho do site (logo e menu).
import Header from 'shared/components/layout/Header/Header';
// Rodapé do site (contatos e links).
import Footer from 'shared/components/layout/Footer/Footer';
// Estilos da moldura.
import './PublicLayout.css';

/*
 * COMPONENTE: PublicLayout
 * O que faz: envolve o conteúdo de uma página com cabeçalho e rodapé.
 * Parâmetros (props):
 *   - children (JSX): o conteúdo da página — tudo o que for colocado entre
 *     <PublicLayout> e </PublicLayout>. "children" é uma prop especial do React.
 *   - className (string, padrão ''): classe CSS extra para o <main> (estilos de cada página).
 * Retorno: JSX com link de pular, Header, <main> com o conteúdo e Footer.
 * Onde é usado: nas páginas internas do site público (404, perfil, como funciona, doação).
 */
export function PublicLayout({ children, className = '' }) {
  return (
    // <> </> (Fragment): agrupa vários elementos sem criar uma <div> extra.
    <>
      {/* Link "Pular para o conteúdo": href="#main-content" leva ao elemento com esse id.
          O CSS o esconde até ele receber foco pelo teclado. */}
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
      {/* Cabeçalho do site. */}
      <Header />
      {/* <main> é a tag semântica do conteúdo principal da página (deve haver só um por página).
          A classe junta "public-page" com a classe extra; .trim() tira o espaço final se a extra for vazia. */}
      <main id="main-content" className={`public-page ${className}`.trim()}>
        {/* Aqui aparece o conteúdo específico de cada página. */}
        {children}
      </main>
      {/* Rodapé do site. */}
      <Footer />
    </>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Uma página escreve <PublicLayout>...conteúdo...</PublicLayout>. O React passa
 *   o conteúdo como "children". O PublicLayout desenha: link de pular → Header →
 *   <main> com o conteúdo → Footer. Assim todas as páginas internas têm a mesma
 *   estrutura sem repetir código.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componentes de layout e a prop especial "children" (composição).
 *   - Fragment (<> </>).
 *   - HTML semântico: <main>, <header>, <footer>.
 *   - Acessibilidade: "skip link" (pular para o conteúdo) e âncoras com #id.
 *   - Classes dinâmicas com template string e .trim().
 *   - Props com valor padrão.
 * ============================================================================
 */
