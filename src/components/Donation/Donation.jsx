// O quê: importa estilos, animação, ícones, a chave Pix e o link da doação online.
// Como: Framer Motion controla a entrada na viewport; PixKey cuida da cópia da chave.
// Para quê: apresentar necessidades da ONG e os dois caminhos de doação (Pix direto ou online).
import './Donation.css';
import { motion } from 'framer-motion';
import { HeartHandshake, PawPrint, Package, ShieldPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PixKey } from '../PixKey/PixKey';

// O quê: lista necessidades que podem ser apoiadas pela campanha.
// Como: cada item associa um componente de ícone a um texto e é renderizado por map.
// Para quê: tornar transparente como a contribuição é utilizada.
const donationNeeds = [
  { icon: Package, text: '50 kg de ração para cães castrados' },
  { icon: ShieldPlus, text: 'Areia higiênica e produtos de limpeza' },
  { icon: HeartHandshake, text: 'Medicação contínua para o Duque (idoso, em tratamento)' },
  { icon: Users, text: 'Voluntários para passeios aos sábados' },
];

function Donation() {
  // O quê: renderiza a seção de apoio financeiro e voluntário.
  // Como: lista necessidades e alterna o estado do botão de cópia com renderização condicional.
  // Para quê: transformar interesse em uma ação concreta de suporte à ONG.
  return (
    <section id="ajudar" className="donate-section">
      <motion.div
        className="donate-board"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="board-pin" aria-hidden="true">
          <PawPrint size={16} />
        </div>

        <div className="donate-grid">
          <div className="donate-copy">
            <h2>Nem todo mundo pode adotar. Todo mundo pode ajudar.</h2>
            <p>
              Sua doação mantém ração, vacinas e tratamentos em dia para quem ainda
              espera por um lar.
            </p>

            <ul className="need-list" aria-label="Necessidades da campanha">
              {donationNeeds.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <span className="need-check" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Link to="/doar" className="btn btn-primary donate-online">
              Doar online: Pix, cartão ou boleto
            </Link>
          </div>

          <PixKey />
        </div>
      </motion.div>
    </section>
  );
}

export default Donation;