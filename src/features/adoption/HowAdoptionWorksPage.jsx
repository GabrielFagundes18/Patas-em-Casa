/*
 * ============================================================================
 * ARQUIVO: HowAdoptionWorksPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a página "Como funciona a adoção" (/como-funciona). Explica o passo a passo
 *   (etapas vindas da API), os requisitos, os documentos, as dúvidas frequentes e
 *   termina com uma chamada para ver os animais ou falar com a equipe.
 *
 * PRINCIPAIS ITENS:
 *   - HowAdoptionWorksPage(): o componente da página (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react-router-dom (Link), lucide-react (ícones).
 *   - shared/components/layout/PublicLayout → cabeçalho e rodapé.
 *   - shared/hooks/useAdoptionSteps         → etapas do processo.
 *   - ./adoptionGuide.js                    → requisitos, documentos e FAQ.
 *   - shared/constants/organization         → e-mail da ONG.
 *   - ./HowAdoptionWorksPage.css            → estilos.
 *   - Quem usa: app/App.js (rota /como-funciona).
 *   - Testado em: features/adoption/HowAdoptionWorksPage.test.js.
 * ============================================================================
 */

// O quê: página detalhada "Como funciona a adoção" (/como-funciona).
// Como: etapas oficiais da API (useAdoptionSteps), requisitos, documentos e dúvidas frequentes.
// Para quê: o adotante saber o que esperar antes de enviar o pedido, com chamada para ver os animais.
// Link: navegação interna.
import { Link } from 'react-router-dom';
// Ícones: ✓ em círculo e documento.
import { CheckCircle2, FileText } from 'lucide-react';
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
// Hook das etapas de adoção.
import { useAdoptionSteps } from 'shared/hooks/useAdoptionSteps';
// Textos da página.
import { ADOPTION_DOCUMENTS, ADOPTION_FAQ, ADOPTION_REQUIREMENTS } from './adoptionGuide';
// Dados da ONG.
import { ORGANIZACAO } from 'shared/constants/organization';
// Estilos da página.
import './HowAdoptionWorksPage.css';

/*
 * COMPONENTE: HowAdoptionWorksPage
 * O que faz: desenha a página explicativa do processo de adoção.
 * Parâmetros: nenhum.
 * Retorno: JSX da página dentro do PublicLayout.
 * Onde é usado: App.js, rota /como-funciona.
 */
export default function HowAdoptionWorksPage() {
  // Etapas (padrão ou vindas da API).
  const steps = useAdoptionSteps();

  return (
    <PublicLayout className="how-page">
      <section>
        <div className="wrap">
          {/* ===== Cabeçalho da página ===== */}
          <div className="section-head">
            <span className="eyebrow">Adoção responsável</span>
            <h1>Como funciona a adoção</h1>
            <p>
              Cada adoção é acompanhada pela equipe para que o animal e a família comecem a vida juntos com segurança.
              Veja o passo a passo, o que pedimos e o que levar.
            </p>
          </div>

          {/* ===== Passo a passo (lista ordenada) ===== */}
          <ol className="how-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                {/* Número da etapa (index começa em 0). aria-hidden: a lista ordenada já informa a posição. */}
                <span className="how-step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* ===== Requisitos e documentos (duas colunas) ===== */}
          <div className="how-columns">
            <div className="how-card">
              <h2><CheckCircle2 aria-hidden="true" size={20} /> Requisitos</h2>
              <ul>
                {/* O próprio texto serve de key (os textos são únicos). */}
                {ADOPTION_REQUIREMENTS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="how-card">
              <h2><FileText aria-hidden="true" size={20} /> Documentos para a assinatura do termo</h2>
              <ul>
                {ADOPTION_DOCUMENTS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          {/* ===== Dúvidas frequentes =====
              <details> + <summary>: elemento nativo do HTML que abre/fecha ao clicar (sem JavaScript). */}
          <div className="how-faq">
            <h2>Dúvidas frequentes</h2>
            {/* Desestrutura cada item em question e answer. */}
            {ADOPTION_FAQ.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>

          {/* ===== Chamada final (CTA) ===== */}
          <div className="how-cta">
            <div>
              <h2>Pronto para conhecer quem espera por você?</h2>
              <p>Escolha um animal e envie o pedido pelo perfil dele. Dúvidas: {ORGANIZACAO.email}.</p>
            </div>
            <div className="how-cta-actions">
              <Link to="/adotar" className="btn btn-primary">Ver animais para adoção</Link>
              {/* mailto: abre o programa de e-mail com o endereço da ONG. */}
              <a href={`mailto:${ORGANIZACAO.email}`} className="btn btn-secondary">Falar com a equipe</a>
            </div>
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
 *   A página obtém as etapas pelo hook useAdoptionSteps (começa com as padrão e
 *   troca pelas da API) e desenha: cabeçalho, passo a passo numerado, requisitos e
 *   documentos, perguntas frequentes (com <details>) e a chamada final.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Conteúdo vindo de arquivos de dados (adoptionGuide.js) e da API (hook).
 *   - Listas ordenadas e não ordenadas com .map e key.
 *   - Elementos nativos interativos: <details>/<summary>.
 *   - Links mailto: e Link do React Router.
 *   - Reaproveitar layout (PublicLayout) e classes globais (.section-head, .btn).
 * ============================================================================
 */
