import './Donation.css';
import { motion } from 'framer-motion';
import { Check, Copy, HeartHandshake, PawPrint, Package, ShieldPlus, Users } from 'lucide-react';
import { useState } from 'react';

const donationNeeds = [
  { icon: Package, text: '50 kg de ração para cães castrados' },
  { icon: ShieldPlus, text: 'Areia higiênica e produtos de limpeza' },
  { icon: HeartHandshake, text: 'Medicação contínua para o Duque (idoso, em tratamento)' },
  { icon: Users, text: 'Voluntários para passeios aos sábados' },
];

function Donation() {
  const pixKey = 'doacoes@patasemcasa.org';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
          </div>

          <div className="pix-tag">
            <span className="tag-hole" aria-hidden="true" />
            <span className="pix-label">Doação via PIX</span>

            <div className="pix-key-row">
              <span className="pix-key-value">{pixKey}</span>
              <button
                type="button"
                className="copy-btn"
                onClick={handleCopy}
                aria-label={copied ? 'Chave PIX copiada' : 'Copiar chave PIX'}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copiada' : 'Copiar'}</span>
              </button>
            </div>

            <p className="pix-note">Chave e-mail · CNPJ 00.000.000/0001-00</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default Donation;