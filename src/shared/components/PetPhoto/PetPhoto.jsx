/*
 * ============================================================================
 * ARQUIVO: PetPhoto.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Componente que mostra a FOTO de um animal. Se o animal não tiver foto, ou se
 *   a imagem não carregar (link quebrado), mostra no lugar um quadro com o
 *   desenho de uma pata e o texto "Foto em breve".
 *   A imagem é um "motion.img" do Framer Motion, o que permite animar a foto
 *   suavemente entre telas (ex.: do cartão para a ficha), usando o layoutId.
 *
 * PRINCIPAIS ITENS:
 *   - PetPhoto({ pet, layoutId, style, loading }): o componente (exportação nomeada).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react         → useState.
 *   - framer-motion → motion (componentes com animação).
 *   - lucide-react  → ícone PawPrint (pata).
 *   - ./PetPhoto.css → estilo do quadro substituto.
 *   - Usado por: shared/components/AnimalCard/AnimalCard.jsx e
 *     features/home/sections/Stories/Stories.jsx.
 * ============================================================================
 */

// O quê: importa estado, animação, ícone e estilos da foto do animal.
// Como: useState registra falha de carregamento e motion.img preserva a animação compartilhada (layoutId).
// Para quê: exibir a foto do animal com uma alternativa quando ela não existe ou não carrega.
// Hook de estado do React.
import { useState } from "react";
// "motion" do Framer Motion: versões animáveis das tags HTML (motion.img, motion.div...).
import { motion } from "framer-motion";
// Ícone de pata.
import { PawPrint } from "lucide-react";
// Estilos deste componente.
import "./PetPhoto.css";

/*
 * COMPONENTE: PetPhoto
 * O que faz: mostra a foto do animal ou um quadro substituto.
 * Parâmetros (props):
 *   - pet (objeto): animal no formato do petMapper; usa pet.image (URL) e pet.alt (texto alternativo).
 *   - layoutId (string | undefined): identificador para a animação compartilhada do Framer Motion.
 *     Dois elementos com o mesmo layoutId em telas diferentes são animados como se fossem o mesmo.
 *   - style (objeto | undefined): estilos extras aplicados à imagem.
 *   - loading ('lazy' | 'eager' | undefined): atributo do navegador para carregar a imagem
 *     só quando ela estiver perto de aparecer ("lazy") ou imediatamente ("eager").
 * Retorno: JSX — um <div> substituto ou um <motion.img>.
 * Onde é usado: AnimalCard.jsx (cartões) e Stories.jsx (histórias da home).
 */
export function PetPhoto({ pet, layoutId, style, loading }) {
  // O quê: indica se a URL da foto falhou ao carregar.
  // Como: o evento onError da imagem ativa o placeholder.
  // Para quê: evitar o ícone de imagem quebrada quando o cadastro aponta para uma URL inválida.
  // failed começa false; vira true se a imagem der erro ao carregar.
  const [failed, setFailed] = useState(false);

  // Se não há URL de imagem OU se ela falhou, mostra o quadro substituto.
  if (!pet.image || failed) {
    return (
      // role="img" + aria-label: para leitores de tela, este <div> é uma "imagem" com descrição.
      <div className="pet-photo-placeholder" role="img" aria-label={pet.alt}>
        {/* Ícone de pata; aria-hidden porque a descrição já está no aria-label do <div>. */}
        <PawPrint size={42} aria-hidden="true" />
        <span>Foto em breve</span>
      </div>
    );
  }

  // Caso normal: mostra a foto, com suporte a animação.
  return (
    <motion.img
      // Identificador da animação compartilhada entre telas.
      layoutId={layoutId}
      // Endereço da imagem.
      src={pet.image}
      // Texto alternativo (descreve a imagem para quem não pode vê-la).
      alt={pet.alt}
      // Estilos extras opcionais.
      style={style}
      // "lazy" adia o download até a imagem se aproximar da área visível.
      loading={loading}
      // decoding="async" deixa o navegador decodificar a imagem sem travar a página.
      decoding="async"
      // Se o download falhar, marca failed = true → o componente redesenha com o substituto.
      onError={() => setFailed(true)}
    />
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente recebe o animal.
 *   2. Se não houver imagem, desenha o quadro "Foto em breve".
 *   3. Se houver, desenha a imagem animável.
 *   4. Se a imagem falhar ao carregar, onError muda o estado e o componente
 *      redesenha mostrando o quadro substituto.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Renderização condicional com "return" antecipado.
 *   - Evento onError de imagens e estado para lidar com falhas.
 *   - Acessibilidade: alt, role="img", aria-label e aria-hidden.
 *   - Atributos de desempenho: loading="lazy" e decoding="async".
 *   - Framer Motion: componentes motion e animações compartilhadas com layoutId.
 *   - Props e desestruturação de props.
 * ============================================================================
 */
