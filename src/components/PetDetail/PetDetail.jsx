// O quê: importa animação, ícones, helpers de apresentação e estilos do detalhe.
// Como: Framer Motion controla a entrada do backdrop e do painel, enquanto helpers derivam espécie e porte.
// Para quê: mostrar informações completas sem duplicar regras de normalização.
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  Sparkles,
} from "lucide-react";
import { getSize, getSpecies } from "../../utils/petHelpers";
import "./PetDetail.css";

export function PetDetail({ pet, onClose, onAdopt }) {
  // O quê: cria a lista de miniaturas associadas ao animal selecionado.
  // Como: repete a imagem disponível para manter a estrutura de galeria mesmo com uma única foto.
  // Para quê: reservar a área de navegação visual de imagens no detalhe.
  const thumbnails = [pet.image, pet.image, pet.image];

  // O quê: renderiza o backdrop e o painel detalhado do pet.
  // Como: usa layoutId para conectar a foto ao card e callbacks para fechar ou iniciar adoção.
  // Para quê: aprofundar a decisão do usuário antes do preenchimento do formulário.
  return (
    <motion.div
      className="pet-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="pet-detail"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.18, duration: 0.42 }}
      >
        <button type="button" className="detail-back" onClick={onClose}>
          <ArrowLeft size={17} /> Voltar para os animais
        </button>
        <div className="detail-hero">
          <motion.img
            layoutId={`pet-photo-${pet.code}`}
            src={pet.image}
            alt={pet.alt}
          />
          <span className={`catalog-status ${pet.urgent ? "urgent" : ""}`}>
            <i />
            {pet.urgent ? "Urgente" : "Disponível"}
          </span>
        </div>
        <div className="detail-thumbnails">
          {thumbnails.map((image, index) => (
            <button
              key={`${image}-${index}`}
              className={index === 0 ? "selected" : ""}
              type="button"
              aria-label={`Selecionar foto ${index + 1} de ${pet.name}`}
            >
              <img src={image} alt={`Foto ${index + 1} de ${pet.name}`} />
            </button>
          ))}
        </div>
        <div className="detail-content">
          <div className="detail-title">
            <div>
              <span className="catalog-eyebrow">{pet.code}</span>
              <h1>{pet.name}</h1>
            </div>
            <button
              type="button"
              className="catalog-primary-button"
              onClick={() => onAdopt(pet)}
            >
              <Heart size={17} /> Quero adotar o(a) {pet.name}
            </button>
          </div>
          <p className="catalog-meta">{pet.meta}</p>
          <div className="detail-specs">
            <div>
              <span>Espécie</span>
              <strong>{getSpecies(pet)}</strong>
            </div>
            <div>
              <span>Porte</span>
              <strong>{getSize(pet)}</strong>
            </div>
            <div>
              <span>Sexo</span>
              <strong>{pet.tags?.includes("Macho") ? "Macho" : "Fêmea"}</strong>
            </div>
            <div>
              <span>Cuidados</span>
              <strong>
                {pet.tags?.includes("Castrado") ? "Castrado" : "Em cuidado"}
              </strong>
            </div>
          </div>
          <div className="catalog-tags detail-tags">
            {pet.tags?.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="detail-copy">
            {pet.name} chegou até nós precisando de cuidado e, desde então, vem
            descobrindo todos os dias que o mundo pode ser um lugar gentil. É um
            animal carinhoso, curioso e pronto para construir uma história
            bonita ao lado de uma família.
          </p>
          <p className="detail-copy">
            A equipe Patas em Casa acompanha cada etapa para que a adoção seja
            responsável, tranquila e cheia de afeto.
          </p>
          <div className="detail-timeline">
            <div>
              <span>
                <CalendarDays size={15} />
              </span>
              <strong>Resgatado</strong>
              <small>12 mar 2024</small>
            </div>
            <div>
              <span>
                <Sparkles size={15} />
              </span>
              <strong>Vacinado</strong>
              <small>18 mar 2024</small>
            </div>
            <div>
              <span>
                <Heart size={15} />
              </span>
              <strong>Disponível</strong>
              <small>Hoje</small>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
