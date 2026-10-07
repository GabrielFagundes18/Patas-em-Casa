// O quê: resumo do processo de adoção na Home, com as etapas numeradas.
// Como: as etapas vêm da API (useAdoptionSteps, as mesmas da página "Como funciona"); o link leva aos detalhes.
// Para quê: deixar claro, em poucas linhas, o que acontece entre escolher um animal e levá-lo para casa.
import './HowItWorks.css';
import { Link } from 'react-router-dom';

function HowItWorks({ steps }) {
  return (
    <section id="como-funciona" className="home-section home-how" aria-labelledby="how-title">
      <div className="wrap home-how-layout">
        <div className="home-head">
          <p className="home-eyebrow">Adoção responsável</p>
          <h2 id="how-title" className="home-title home-title--side">Como funciona a adoção</h2>
          <p className="home-lead">
            Não tem custo. A equipe conversa com você, faz uma visita e acompanha as primeiras semanas.
          </p>
          <Link to="/como-funciona" className="home-link">Ver requisitos e documentos</Link>
        </div>

        <ol className="home-steps">
          {steps.map((step, index) => (
            <li className="home-step" key={step.title}>
              <span className="home-step-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
