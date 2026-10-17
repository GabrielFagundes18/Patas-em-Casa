/*
 * ============================================================================
 * ARQUIVO: HowItWorks.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Seção "Como funciona a adoção" da página inicial: um texto curto à esquerda
 *   e as etapas do processo numeradas (01, 02, 03...) à direita, com um link
 *   para a página completa "Como funciona".
 *
 * PRINCIPAIS ITENS:
 *   - HowItWorks({ steps }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./HowItWorks.css → estilos da seção.
 *   - react-router-dom → Link.
 *   - Recebe as etapas de features/home/LandingPage.jsx, que as obtém com
 *     shared/hooks/useAdoptionSteps.js.
 *   - Classes home-* de features/home/LandingPage.css; ".home-step" também recebe
 *     a animação de revelação controlada pela LandingPage.
 * ============================================================================
 */

// O quê: resumo do processo de adoção na Home, com as etapas numeradas.
// Como: as etapas vêm da API (useAdoptionSteps, as mesmas da página "Como funciona"); o link leva aos detalhes.
// Para quê: deixar claro, em poucas linhas, o que acontece entre escolher um animal e levá-lo para casa.
// Estilos da seção.
import './HowItWorks.css';
// Link: navegação interna.
import { Link } from 'react-router-dom';

/*
 * COMPONENTE: HowItWorks
 * O que faz: desenha o resumo do processo de adoção.
 * Parâmetros (props):
 *   - steps (array): etapas no formato { title, description } (vindas do useAdoptionSteps).
 * Retorno: JSX da <section id="como-funciona">.
 * Onde é usado: LandingPage.jsx.
 */
function HowItWorks({ steps }) {
  return (
    // id="como-funciona" permite chegar aqui por âncora (/#como-funciona).
    <section id="como-funciona" className="home-section home-how" aria-labelledby="how-title">
      <div className="wrap home-how-layout">
        {/* Coluna da esquerda: texto e link. */}
        <div className="home-head">
          <p className="home-eyebrow">Adoção responsável</p>
          {/* "home-title--side": versão um pouco menor do título, para coluna lateral. */}
          <h2 id="how-title" className="home-title home-title--side">Como funciona a adoção</h2>
          <p className="home-lead">
            Não tem custo. A equipe conversa com você, faz uma visita e acompanha as primeiras semanas.
          </p>
          <Link to="/como-funciona" className="home-link">Ver requisitos e documentos</Link>
        </div>

        {/* <ol> = lista ORDENADA (a ordem importa, como nas etapas de um processo). */}
        <ol className="home-steps">
          {/* Um item por etapa. "index" começa em 0, por isso index + 1. */}
          {steps.map((step, index) => (
            <li className="home-step" key={step.title}>
              {/* Número com dois dígitos: String(1).padStart(2, '0') → "01".
                  aria-hidden porque a própria lista ordenada já informa a posição a leitores de tela. */}
              <span className="home-step-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {/* Título e descrição da etapa. */}
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Exporta a seção como padrão do arquivo.
export default HowItWorks;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A LandingPage obtém as etapas (padrão ou da API) e as passa via prop "steps".
 *   O componente desenha o texto de apresentação e percorre as etapas com .map,
 *   numerando cada uma com dois dígitos.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componentes "apresentacionais" (só exibem o que recebem por props).
 *   - Listas ordenadas (<ol>) e semântica HTML.
 *   - .map com índice e String.prototype.padStart.
 *   - Hierarquia de títulos (h2 da seção, h3 de cada etapa).
 *   - Acessibilidade: aria-labelledby e aria-hidden.
 * ============================================================================
 */
