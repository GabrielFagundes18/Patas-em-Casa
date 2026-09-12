import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import "./AdoptionFormModal.css";

export function AdoptionFormModal({ pet, onClose }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <motion.div
      className="pet-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="adoption-form-modal"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        <button type="button" className="detail-back" onClick={onClose}>
          <ArrowLeft size={17} /> Voltar para a ficha
        </button>

        <div className="adoption-form-body">
          <div className="adoption-form-summary">
            <span className="catalog-eyebrow">Pré-adoção</span>
            <h2>Quero adotar {pet?.name}</h2>
            <p>{pet?.meta}</p>
          </div>

          {submitted ? (
            <div className="adoption-success">
              <Check size={28} />
              <h3>Solicitação enviada</h3>
              <p>
                Obrigado! Nossa equipe vai avaliar o perfil e entrar em contato em
                até 48 horas para os próximos passos.
              </p>
              <button type="button" className="catalog-primary-button" onClick={onClose}>
                Fechar
              </button>
            </div>
          ) : (
            <form className="catalog-adoption-form" onSubmit={handleSubmit}>
              <div className="catalog-form-grid">
                <label>
                  Nome completo
                  <input type="text" placeholder="Seu nome" defaultValue="Maria Silva" />
                </label>
                <label>
                  E-mail
                  <input type="email" placeholder="voce@email.com" defaultValue="maria@email.com" />
                </label>
                <label>
                  Telefone
                  <input type="tel" placeholder="(11) 99999-9999" defaultValue="(11) 99999-9999" />
                </label>
                <label>
                  Cidade
                  <input type="text" placeholder="Sua cidade" defaultValue="São Paulo" />
                </label>
              </div>

              <label>
                Conte um pouco sobre seu lar e rotina
                <textarea
                  rows="4"
                  defaultValue="Tenho uma rotina estável, espaço confortável e estou preparado para receber um pet com muito carinho."
                />
              </label>

              <div className="catalog-form-checks">
                <label>
                  <input type="checkbox" defaultChecked />
                  Tenho ambiente seguro para o animal.
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  Estou atento(a) ao acompanhamento pós-adoção.
                </label>
              </div>

              <button type="submit" className="catalog-primary-button">
                Enviar formulário
              </button>
            </form>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
