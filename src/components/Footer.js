import { Clock3, Heart, Mail, MapPin, PawPrint, Phone, Send } from 'lucide-react';

const navLinks = [
  { label: 'Adotar', href: '#adotar' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Ajudar', href: '#ajudar' },
  { label: 'Histórias', href: '#historias' },
];

const contactItems = [
  { icon: Mail, label: 'contato@patasemcasa.org' },
  { icon: Phone, label: '(11) 4000-0000' },
  { icon: MapPin, label: 'Rua das Acácias, 120 — SP' },
];

const visitItems = [
  { icon: Clock3, label: 'Ter–Sáb: 9h às 17h' },
  { icon: Send, label: '@patasemcasa' },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col brand-col">
            <div className="logo" aria-label="Patas em Casa">
              <span className="logo-mark" aria-hidden="true">
                <PawPrint size={18} />
              </span>
              <span>Patas em Casa</span>
            </div>

            <p>
              ONG de proteção e adoção responsável de cães e gatos, atuando desde 2019.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegação</h4>
            <ul>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contato</h4>
            <ul>
              {contactItems.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span className="info-icon" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Visitas</h4>
            <ul>
              {visitItems.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span className="info-icon" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Patas em Casa. Todos os direitos reservados.</span>
          <span className="footer-heartline">
            <Heart className="footer-heart" size={13} />
            Feito com carinho para quem espera por um lar.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
