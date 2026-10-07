// O quê: página detalhada "Como funciona a adoção" (/como-funciona).
// Como: etapas oficiais da API (useAdoptionSteps), requisitos, documentos e dúvidas frequentes.
// Para quê: o adotante saber o que esperar antes de enviar o pedido, com chamada para ver os animais.
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText } from 'lucide-react';
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
import { useAdoptionSteps } from 'shared/hooks/useAdoptionSteps';
import { ADOPTION_DOCUMENTS, ADOPTION_FAQ, ADOPTION_REQUIREMENTS } from './adoptionGuide';
import { ORGANIZACAO } from 'shared/constants/organization';
import './HowAdoptionWorksPage.css';

export default function HowAdoptionWorksPage() {
  const steps = useAdoptionSteps();

  return (
    <PublicLayout className="how-page">
      <section>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Adoção responsável</span>
            <h1>Como funciona a adoção</h1>
            <p>
              Cada adoção é acompanhada pela equipe para que o animal e a família comecem a vida juntos com segurança.
              Veja o passo a passo, o que pedimos e o que levar.
            </p>
          </div>

          <ol className="how-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="how-step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="how-columns">
            <div className="how-card">
              <h2><CheckCircle2 aria-hidden="true" size={20} /> Requisitos</h2>
              <ul>
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

          <div className="how-faq">
            <h2>Dúvidas frequentes</h2>
            {ADOPTION_FAQ.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>

          <div className="how-cta">
            <div>
              <h2>Pronto para conhecer quem espera por você?</h2>
              <p>Escolha um animal e envie o pedido pelo perfil dele. Dúvidas: {ORGANIZACAO.email}.</p>
            </div>
            <div className="how-cta-actions">
              <Link to="/adotar" className="btn btn-primary">Ver animais para adoção</Link>
              <a href={`mailto:${ORGANIZACAO.email}`} className="btn btn-secondary">Falar com a equipe</a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
