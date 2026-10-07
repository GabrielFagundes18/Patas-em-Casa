// O quê: importa estado, animação, ícone e estilos da foto do animal.
// Como: useState registra falha de carregamento e motion.img preserva a animação compartilhada (layoutId).
// Para quê: exibir a foto do animal com uma alternativa quando ela não existe ou não carrega.
import { useState } from "react";
import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import "./PetPhoto.css";

export function PetPhoto({ pet, layoutId, style, loading }) {
  // O quê: indica se a URL da foto falhou ao carregar.
  // Como: o evento onError da imagem ativa o placeholder.
  // Para quê: evitar o ícone de imagem quebrada quando o cadastro aponta para uma URL inválida.
  const [failed, setFailed] = useState(false);

  if (!pet.image || failed) {
    return (
      <div className="pet-photo-placeholder" role="img" aria-label={pet.alt}>
        <PawPrint size={42} aria-hidden="true" />
        <span>Foto em breve</span>
      </div>
    );
  }

  return (
    <motion.img
      layoutId={layoutId}
      src={pet.image}
      alt={pet.alt}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
