// O quê: seção de doação da Home: para onde vai o dinheiro, a chave Pix e um atalho para doar online.
// Como: o visitante escolhe tipo (única/mensal) e valor aqui; o botão abre /doar já com essa escolha,
// onde informa nome e e-mail e segue para o Mercado Pago.
// Para quê: começar a doação na própria Home sem repetir o formulário de pagamento.
import './Donation.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, Heart, ShieldCheck } from 'lucide-react';
import { PixKey } from '../PixKey/PixKey';

// Necessidades permanentes de qualquer abrigo; campanhas específicas ficam fora da Home para não envelhecer.
const NEEDS = ['Ração e alimentação', 'Vacinas e vermífugos', 'Castrações', 'Consultas e remédios'];
const VALUES = [25, 50, 100, 200];
const TYPES = [
  { value: 'unica', label: 'Única' },
  { value: 'recorrente', label: 'Mensal' },
];

export function donationPath(tipo, valor) {
  return `/doar?${new URLSearchParams({ tipo, valor: String(valor) })}`;
}

function Donation() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('recorrente');
  const [valor, setValor] = useState(50);

  const submitLabel = valor === 'outro'
    ? 'Escolher o valor'
    : `Doar R$ ${valor}${tipo === 'recorrente' ? ' por mês' : ''}`;

  function handleSubmit(event) {
    event.preventDefault();
    navigate(donationPath(tipo, valor));
  }

  return (
    <section id="ajudar" className="home-section home-donate" aria-labelledby="donate-title">
      <div className="wrap home-donate-layout">
        <div className="home-donate-copy">
          <p className="home-eyebrow">Doe</p>
          <h2 id="donate-title" className="home-title">Sua doação vira ração, vacina e cuidado.</h2>
          <p className="home-lead">
            Com uma doação única ou mensal você ajuda a manter os animais alimentados, vacinados e em tratamento até
            encontrarem um lar.
          </p>
          <ul className="home-donate-needs" aria-label="Para onde vai a doação">
            {NEEDS.map((need) => (
              <li key={need}>
                <CircleCheck size={20} aria-hidden="true" />
                {need}
              </li>
            ))}
          </ul>
          <PixKey variant="inline" />
        </div>

        <form className="home-donate-card" onSubmit={handleSubmit} aria-labelledby="donate-form-title">
          <h3 id="donate-form-title">Doar online</h3>

          <fieldset className="home-fieldset">
            <legend>Tipo de doação</legend>
            <div className="home-segmented">
              {TYPES.map((option) => (
                <label key={option.value} className={tipo === option.value ? 'is-selected' : ''}>
                  <input
                    checked={tipo === option.value}
                    className="home-visually-hidden"
                    name="tipo"
                    onChange={() => setTipo(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="home-fieldset">
            <legend>Valor</legend>
            <div className="home-amounts">
              {[...VALUES, 'outro'].map((option) => (
                <label key={option} className={`${valor === option ? 'is-selected' : ''} ${option === 'outro' ? 'is-wide' : ''}`.trim()}>
                  <input
                    checked={valor === option}
                    className="home-visually-hidden"
                    name="valor"
                    onChange={() => setValor(option)}
                    type="radio"
                    value={option}
                  />
                  {option === 'outro' ? 'Outro valor' : `R$ ${option}`}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="home-donate-submit">
            <Heart size={18} aria-hidden="true" /> {submitLabel}
          </button>
          <p className="home-donate-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Pagamento pelo Mercado Pago. Única: Pix, cartão ou boleto. Mensal: cartão, e dá para cancelar quando quiser.</span>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Donation;
