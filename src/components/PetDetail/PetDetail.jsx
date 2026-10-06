// O quê: importa animação, ícones, comportamento de diálogo, foto e estilos do detalhe.
// Como: Framer Motion controla a entrada do backdrop e do painel; useDialog cuida de teclado e foco.
// Para quê: mostrar as informações reais do animal antes do preenchimento do formulário.
import { useId } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Heart, Stethoscope, Syringe } from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import { PetPhoto } from "../PetPhoto/PetPhoto";
import "./PetDetail.css";

// O quê: formata a data de entrada (AAAA-MM-DD) por extenso.
// Como: interpreta a data em UTC e formata também em UTC, sem deslocamento de fuso.
// Para quê: exibir "23 de agosto de 2026" exatamente como cadastrado.
const entryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatEntryDate(date) {
  if (!date) return "Data não informada";
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) ? "Data não informada" : entryDateFormatter.format(parsed);
}

export function PetDetail({ pet, onClose, onAdopt }) {
  // O quê: prepara identificadores, comportamento modal e textos derivados do animal.
  // Como: useId liga o título ao diálogo; o artigo usa o sexo cadastrado quando existe.
  // Para quê: anunciar o diálogo corretamente e escrever "Quero adotar o Nino" / "a Mel".
  const titleId = useId();
  const dialogRef = useDialog(onClose);
  const article = pet.sex === "Macho" ? "o " : pet.sex === "Fêmea" ? "a " : "";
  const paragraphs = pet.descricao
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const specs = [
    ["Espécie", pet.species],
    ["Porte", pet.size ?? "Não informado"],
    ["Sexo", pet.sex ?? "Não informado"],
    ["Idade", pet.ageLabel || "Não informada"],
  ];

  const facts = [
    { icon: CalendarDays, title: "Chegada à ONG", detail: formatEntryDate(pet.entryDate) },
    { icon: Syringe, title: "Vacinação", detail: pet.vacinado ? "Em dia" : "Pendente" },
    { icon: Stethoscope, title: "Castração", detail: pet.castrado ? "Realizada" : "Pendente" },
  ];

  // O quê: renderiza o backdrop e o painel detalhado do pet.
  // Como: clique fora do painel fecha; layoutId conecta a foto ao card de origem.
  // Para quê: aprofundar a decisão do usuário antes do preenchimento do formulário.
  return (
    <motion.div
      className="pet-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={dialogRef}
        className="pet-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.18, duration: 0.42 }}
      >
        <button type="button" className="detail-back" onClick={onClose}>
          <ArrowLeft size={17} aria-hidden="true" /> Voltar para os animais
        </button>
        <div className="detail-hero">
          <PetPhoto pet={pet} layoutId={`pet-photo-${pet.id ?? pet.code}`} />
          <span className={`catalog-status ${pet.urgent ? "urgent" : ""}`}>
            <i />
            {pet.urgent ? "Urgente" : "Disponível"}
          </span>
        </div>
        <div className="detail-content">
          <div className="detail-title">
            <div>
              <span className="catalog-eyebrow">{pet.code}</span>
              <h1 id={titleId}>{pet.name}</h1>
            </div>
            <button
              type="button"
              className="catalog-primary-button"
              onClick={() => onAdopt(pet)}
            >
              <Heart size={17} aria-hidden="true" /> Quero adotar {article}{pet.name}
            </button>
          </div>
          <p className="catalog-meta">{pet.meta}</p>
          <div className="detail-specs">
            {specs.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="catalog-tags detail-tags">
            {pet.tags?.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => (
              <p className="detail-copy" key={paragraph}>
                {paragraph}
              </p>
            ))
          ) : (
            <p className="detail-copy">
              {pet.name} ainda não tem uma descrição cadastrada. Envie seu
              interesse para conversar com a equipe sobre a personalidade e a
              rotina deste animal.
            </p>
          )}
          <p className="detail-copy">
            A equipe Patas em Casa acompanha cada etapa para que a adoção seja
            responsável, tranquila e cheia de afeto.
          </p>
          <div className="detail-timeline">
            {facts.map(({ icon: Icon, title, detail }) => (
              <div key={title}>
                <span>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
