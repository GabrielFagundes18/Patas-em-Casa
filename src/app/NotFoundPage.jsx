// O quê: página para endereços que não existem no site.
// Como: usa a moldura pública e oferece caminhos para a Home e o catálogo.
// Para quê: links quebrados não caem na Home sem explicação.
import { Link } from 'react-router-dom';
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <section>
        <div className="wrap public-state">
          <span className="eyebrow">Erro 404</span>
          <h1>Página não encontrada</h1>
          <p>O endereço pode ter mudado ou o link está incompleto. Que tal conhecer os animais que esperam por um lar?</p>
          <div className="public-state-actions">
            <Link to="/adotar" className="btn btn-primary">Ver animais para adoção</Link>
            <Link to="/" className="btn btn-secondary">Ir para a página inicial</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
