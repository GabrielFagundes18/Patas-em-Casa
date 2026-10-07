// O quê: rodapé do site: marca, links (Adote / Ajude), contato e acesso da equipe.
// Como: os dados de contato vêm de ORGANIZACAO (shared/constants/organization.js), o único lugar a atualizar.
// Para quê: encerrar todas as páginas públicas com os mesmos caminhos e canais de contato.
import './Footer.css';
import { Link } from 'react-router-dom';
import { AtSign, Clock3, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { ORGANIZACAO } from 'shared/constants/organization';

const linkGroups = [
  {
    title: 'Adote',
    links: [
      { label: 'Animais para adoção', to: '/adotar' },
      { label: 'Como funciona', to: '/como-funciona' },
      { label: 'Histórias', href: '/#historias' },
    ],
  },
  {
    title: 'Ajude',
    links: [
      { label: 'Doar agora', to: '/doar' },
      { label: 'Doação mensal', to: '/doar?tipo=recorrente' },
      { label: 'Seja voluntário', href: '/#voluntariado' },
    ],
  },
];

const contactItems = [
  { icon: Mail, label: ORGANIZACAO.email, href: `mailto:${ORGANIZACAO.email}` },
  { icon: Phone, label: ORGANIZACAO.telefone },
  { icon: MapPin, label: ORGANIZACAO.endereco },
  { icon: Clock3, label: ORGANIZACAO.horario },
  { icon: AtSign, label: ORGANIZACAO.instagram },
];

// Âncoras da Home usam <a> (o navegador rola até a seção); páginas usam Link (sem recarregar).
function FooterLink({ link }) {
  return link.href ? <a href={link.href}>{link.label}</a> : <Link to={link.to}>{link.label}</Link>;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Patas em Casa — página inicial">
              <span className="footer-logo-mark" aria-hidden="true">
                <PawPrint size={20} />
              </span>
              Patas em Casa
            </Link>
            <p>Resgate, tratamento e adoção responsável de cães e gatos desde {ORGANIZACAO.fundacao}.</p>
            <p className="footer-cnpj">CNPJ {ORGANIZACAO.cnpj}</p>
          </div>

          <nav className="footer-nav" aria-label="Rodapé">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="footer-heading">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.label}><FooterLink link={link} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="footer-contact">
            <h2 className="footer-heading">Contato</h2>
            <ul>
              {contactItems.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Icon size={16} aria-hidden="true" />
                  {href ? <a href={href}>{label}</a> : <span>{label}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Patas em Casa</span>
          <Link to="/admin/login">Área da equipe</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
