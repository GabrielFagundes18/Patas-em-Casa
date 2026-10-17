/*
 * ============================================================================
 * ARQUIVO: NotFoundPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a página de "erro 404": aparece quando o visitante acessa um endereço que
 *   não existe no site (ex.: /pagina-que-nao-existe). Em vez de uma tela em
 *   branco, mostra uma mensagem amigável e links para voltar ao site.
 *
 * PRINCIPAIS ITENS:
 *   - NotFoundPage(): componente da página (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react-router-dom → componente Link (navegação interna sem recarregar a página).
 *   - shared/components/layout/PublicLayout/PublicLayout.jsx → "moldura" com
 *     cabeçalho e rodapé do site.
 *   - Classes CSS (wrap, eyebrow, btn, public-state...) vêm de styles/globals.css
 *     e do PublicLayout.css.
 *   - Quem usa: app/App.js, na rota coringa path="*".
 * ============================================================================
 */

// O quê: página para endereços que não existem no site.
// Como: usa a moldura pública e oferece caminhos para a Home e o catálogo.
// Para quê: links quebrados não caem na Home sem explicação.
// Link: é como a tag <a>, mas troca de página pelo React Router, sem recarregar o site inteiro.
import { Link } from 'react-router-dom';
// PublicLayout: componente que coloca cabeçalho e rodapé em volta do conteúdo.
// Está entre chaves { } porque é uma exportação NOMEADA (não é o "export default" do arquivo).
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';

/*
 * COMPONENTE: NotFoundPage
 * O que faz: mostra a mensagem de página não encontrada com dois atalhos de navegação.
 * Parâmetros: nenhum.
 * Retorno: JSX da página.
 * Onde é usado: em App.js, na <Route path="*">, que pega qualquer URL desconhecida.
 */
export default function NotFoundPage() {
  return (
    // Tudo o que estiver dentro do PublicLayout vira o "children" dele e aparece
    // entre o cabeçalho e o rodapé.
    <PublicLayout>
      <section>
        {/* "wrap" limita a largura e centraliza; "public-state" estiliza mensagens de estado. */}
        <div className="wrap public-state">
          {/* "eyebrow" é um texto pequeno acima do título (padrão visual do site). */}
          <span className="eyebrow">Erro 404</span>
          <h1>Página não encontrada</h1>
          <p>O endereço pode ter mudado ou o link está incompleto. Que tal conhecer os animais que esperam por um lar?</p>
          {/* Botões de saída: o atributo "to" do Link indica para onde navegar. */}
          <div className="public-state-actions">
            {/* Leva ao catálogo de adoção. */}
            <Link to="/adotar" className="btn btn-primary">Ver animais para adoção</Link>
            {/* Leva à página inicial. */}
            <Link to="/" className="btn btn-secondary">Ir para a página inicial</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O visitante acessa uma URL que nenhuma rota do App.js reconhece.
 *   2. A rota coringa (path="*") desenha a NotFoundPage.
 *   3. A página aparece dentro do PublicLayout (com cabeçalho e rodapé).
 *   4. O visitante pode clicar em um dos Links para voltar ao catálogo ou à Home.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Página 404 em SPAs e a rota coringa "*" do React Router.
 *   - Componente Link x tag <a> (navegação sem recarregar).
 *   - Composição com a prop especial "children" (layout que envolve conteúdo).
 *   - Export nomeado x export default.
 * ============================================================================
 */
