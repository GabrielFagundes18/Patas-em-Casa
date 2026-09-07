import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { PawPrint, Share2 } from "lucide-react";
import "./PetCard.css";

export function PetCard({ pet, onOpen, onShare }) {
  const cardRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handlePointerMove(event) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    setOffset({
      x: (rect.left + rect.width / 2 - event.clientX) / 18,
      y: (rect.top + rect.height / 2 - event.clientY) / 24,
    });
  }

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
        <motion.img
          layoutId={`pet-photo-${pet.code}`}
          src={pet.image}
          alt={pet.alt}
          style={{ x: offset.x, y: offset.y }}
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
            onClick={() => onOpen(pet)}
          >
            {pet.urgent ? "Apadrinhar" : "Ver ficha"}
          </button>
          <button
            className="catalog-icon-button"
            type="button"
            aria-label={`Compartilhar ${pet.name}`}
            onClick={() => onShare(pet)}
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
