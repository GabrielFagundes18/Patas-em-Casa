// O quê: moldura das telas de acesso ao painel (entrar, esqueci a senha, criar/redefinir senha).
// Como: painel lateral com a marca e um cartão com título, descrição e o formulário passado em children.
// Para quê: as três telas têm a mesma aparência sem repetir a estrutura.
import { PawPrint } from 'lucide-react';
import 'admin/styles/admin.css';
import './AdminLoginPage.css';

export default function AdminAuthShell({ titleId, eyebrow = 'Área administrativa', title, description, children }) {
  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <aside className="admin-login-aside">
          <span aria-hidden="true" className="admin-login-mark"><PawPrint size={26} /></span>
          <p className="admin-login-aside-title">Painel Patas em Casa</p>
          <p>Animais, adoções, doações e voluntários da ONG em um só lugar.</p>
        </aside>
        <section aria-labelledby={titleId} className="admin-login-card">
          <a aria-label="Patas em Casa, página inicial" className="admin-login-brand" href="/">
            <PawPrint aria-hidden="true" size={21} />
            <span>Patas em Casa</span>
          </a>

          <div className="admin-login-heading">
            <p className="admin-login-eyebrow">{eyebrow}</p>
            <h1 id={titleId}>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
