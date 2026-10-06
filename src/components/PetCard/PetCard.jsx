// O quê: importa hooks, animação, ícones, foto e estilos do card de catálogo.
// Como: useRef mede o card para o efeito de inclinação e useState armazena o deslocamento da imagem.
// Para quê: combinar dados do pet com interação visual e ações do catálogo.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { PawPrint, Share2 } from "lucide-react";
import { PetPhoto } from "../PetPhoto/PetPhoto";
import "./PetCard.css";

export function PetCard({ pet, onOpen, onShare }) {
  // O quê: mantém referência ao card e o deslocamento aplicado à imagem.
  // Como: a referência acessa getBoundingClientRect e o estado reage ao ponteiro.
  // Para quê: criar um efeito de movimento sutil sem alterar o modelo do animal.
  const cardRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // O quê: calcula a posição relativa do ponteiro dentro do card.
  // Como: compara o centro do retângulo com as coordenadas do evento e divide o deslocamento para suavizar.
  // Para quê: produzir a sensação de paralaxe na imagem do animal.
  function handlePointerMove(event) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    setOffset({
      x: (rect.left + rect.width / 2 - event.clientX) / 18,
      y: (rect.top + rect.height / 2 - event.clientY) / 24,
    });
  }

  // O quê: renderiza foto, status, metadados, tags e ações do animal.
  // Como: motion.article controla animações, enquanto callbacks delegam abertura e compartilhamento.
  // Para quê: oferecer uma unidade reutilizável de descoberta no catálogo.
  return (
    <motion.article
      ref={cardRef}
      className="catalog-pet-card"
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
    >
      <div className="catalog-photo-wrap">
        <PetPhoto
          pet={pet}
          layoutId={`pet-photo-${pet.id ?? pet.code}`}
          style={{ x: offset.x, y: offset.y }}
          loading="lazy"
        />
        <span className={`catalog-status ${pet.urgent ? "urgent" : ""}`}>
          <i />
          {pet.urgent ? "Urgente" : "Disponível"}
        </span>
        <span className="catalog-code">{pet.code}</span>
      </div>
      <div className="catalog-card-body">
        <div className="catalog-card-heading">
          <h2>{pet.name}</h2>
          <PawPrint size={17} aria-hidden="true" />
        </div>
        <p className="catalog-meta">{pet.meta}</p>
        <div className="catalog-tags">
          {pet.tags?.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="catalog-card-actions">
          <button
            className="catalog-primary-button"
            type="button"
            aria-label={`Ver ficha de ${pet.name}`}
            onClick={() => onOpen(pet)}
          >
            Ver ficha
          </button>
          <button
            className="catalog-icon-button"
            type="button"
            aria-label={`Compartilhar ${pet.name}`}
            onClick={() => onShare(pet)}
          >
            <Share2 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
