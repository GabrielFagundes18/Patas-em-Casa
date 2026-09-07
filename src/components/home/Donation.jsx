import { motion } from 'framer-motion';
import { Check, Copy, HeartHandshake, Package, ShieldPlus, Users } from 'lucide-react';
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
    <section id="ajudar">
      <div className="wrap">
        <div className="donate">
          <div className="donate-grid">
            <motion.div
              className="donate-copy"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="eyebrow donate-eyebrow">Formas de ajudar</span>
              <h2>Nem todo mundo pode adotar. Todo mundo pode ajudar.</h2>
              <p>
                Sua doação mantém ração, vacinas e tratamentos em dia para quem ainda
                espera por um lar.
              </p>

              <ul className="need-list" aria-label="Necessidades da campanha">
                {donationNeeds.map(({ icon: Icon, text }, index) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.28, delay: index * 0.08 }}
                  >
                    <span className="need-icon" aria-hidden="true">
                      <Icon size={15} />
                    </span>
                    <span>{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="pix-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 22px 36px rgba(18, 26, 21, 0.12)' }}
            >
              <span className="eyebrow pix-eyebrow">Doação via PIX</span>

              <div className="pix-info-box">
                <p>Chave PIX:</p>
                <strong>{pixKey}</strong>
              </div>

              <div className="pix-key">
                <span>{pixKey}</span>
                <motion.button
                  type="button"
                  className="copy-btn"
                  onClick={handleCopy}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -1 }}
                  aria-label={copied ? 'Chave PIX copiada' : 'Copiar chave PIX'}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar</span>
                    </>
                  )}
                </motion.button>
              </div>

              <p className="pix-note">Chave tipo e-mail · CNPJ 00.000.000/0001-00</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Donation;
