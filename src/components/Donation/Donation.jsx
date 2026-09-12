// O quê: importa estilos, animação, ícones e estado local da doação.
// Como: Framer Motion controla entrada na viewport e useState registra o resultado da cópia do PIX.
// Para quê: apresentar necessidades da ONG e permitir copiar a chave de contribuição.
import './Donation.css';
import { motion } from 'framer-motion';
import { Check, Copy, HeartHandshake, PawPrint, Package, ShieldPlus, Users } from 'lucide-react';
import { useState } from 'react';

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
  // O quê: define a chave PIX e o estado de confirmação da cópia.
  // Como: a string é usada pela Clipboard API e copied alterna o ícone, texto e rótulo acessível.
  // Para quê: dar feedback imediato ao usuário após a ação de contribuição.
  const pixKey = 'doacoes@patasemcasa.org';
  const [copied, setCopied] = useState(false);

  // O quê: tenta copiar a chave PIX para a área de transferência.
  // Como: aguarda navigator.clipboard.writeText, ativa o feedback por 2 segundos e trata falhas.
  // Para quê: reduzir erros de digitação no momento de realizar a doação.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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