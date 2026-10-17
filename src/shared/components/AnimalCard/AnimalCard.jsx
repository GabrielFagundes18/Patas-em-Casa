/*
 * ============================================================================
 * ARQUIVO: AnimalCard.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o CARTÃO de um animal: foto, nome, espécie/sexo/idade/porte, tempo de
 *   espera, descrição, temperamento, cuidados e um link para a ficha completa.
 *   O mesmo cartão é usado na página inicial e no catálogo, garantindo um visual
 *   único em todo o site. No catálogo ele também mostra os botões de favoritar
 *   e compartilhar.
 *
 * PRINCIPAIS ITENS:
 *   - MAX_TRAITS: quantos traços de temperamento mostrar no cartão (3).
 *   - AnimalCard({ pet, headingLevel, isFavorite, onToggleFavorite, onShare }): o componente.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AnimalCard.css                    → estilos do cartão.
 *   - react-router-dom                    → Link (navegação para a ficha).
 *   - lucide-react                        → ícones ArrowRight, Clock3, Heart, Share2.
 *   - shared/components/PetPhoto/PetPhoto → foto (ou "Foto em breve").
 *   - shared/utils/petText                → artigo, concordar, especieDoAnimal, tempoDeEspera.
 *   - Usado por: features/home/sections/PetSection/PetSection.jsx (vitrine da home) e
 *     features/catalog/AdoptionCatalog.jsx (catálogo).
 * ============================================================================
 */

// O quê: cartão de um animal, o mesmo na vitrine da Home e no catálogo.
// Como: foto (ou "Foto em breve"), selo de urgente, dados básicos, tempo de espera, temperamento e cuidados.
// Favoritar e compartilhar só aparecem quando a tela passa as funções (o catálogo passa; a Home não).
// Para quê: um visual só para o animal em todo o site, sempre levando à ficha completa (/animais/:id).
// Estilos do cartão.
import './AnimalCard.css';
// Link: navegação interna sem recarregar a página.
import { Link } from 'react-router-dom';
// Ícones: seta, relógio, coração e compartilhar.
import { ArrowRight, Clock3, Heart, Share2 } from 'lucide-react';
// Componente da foto do animal.
import { PetPhoto } from 'shared/components/PetPhoto/PetPhoto';
// Funções de texto com concordância de gênero e tempo de espera.
import { artigo, concordar, especieDoAnimal, tempoDeEspera } from 'shared/utils/petText';

// Número máximo de traços de temperamento exibidos (para o cartão não ficar enorme).
const MAX_TRAITS = 3;

/*
 * COMPONENTE: AnimalCard
 * O que faz: desenha o cartão de um animal.
 * Parâmetros (props):
 *   - pet (objeto): animal no formato do petMapper (name, sex, species, ageLabel, size,
 *     entryDate, temperament, castrado, vacinado, descricao, urgent, id...).
 *   - headingLevel (number, padrão 3): nível do título do nome (3 → <h3>, 2 → <h2>).
 *     Permite manter a hierarquia de títulos correta em cada página (acessibilidade).
 *   - isFavorite (boolean, padrão false): se o animal está nos favoritos.
 *   - onToggleFavorite (função | undefined): chamada ao clicar no coração. Sem ela, o botão não aparece.
 *   - onShare (função | undefined): chamada ao clicar em compartilhar. Sem ela, o botão não aparece.
 * Retorno: JSX de um <article> com o cartão.
 * Onde é usado: PetSection.jsx (home) e AdoptionCatalog.jsx (catálogo).
 */
export function AnimalCard({ pet, headingLevel = 3, isFavorite = false, onToggleFavorite, onShare }) {
  // Monta o nome da tag do título, ex.: "h3". No JSX, <Heading> vira <h3>.
  // (Uma variável usada como tag precisa começar com letra maiúscula.)
  const Heading = `h${headingLevel}`;
  // Linha de informações, ex.: "Gata · Fêmea · 2 anos · Porte pequeno".
  // Monta a lista, remove os vazios (filter(Boolean)) e junta com " · ".
  const meta = [especieDoAnimal(pet), pet.sex, pet.ageLabel, pet.size ? `Porte ${pet.size.toLowerCase()}` : null]
    .filter(Boolean)
    .join(' · ');
  // Texto do tempo de espera (ex.: "Esperando há 3 meses") ou null.
  const waiting = tempoDeEspera(pet.entryDate);
  // Até 3 traços de temperamento. "?? []" protege se temperament não existir;
  // .slice(0, MAX_TRAITS) pega os primeiros itens.
  const traits = (pet.temperament ?? []).slice(0, MAX_TRAITS);
  // Lista de cuidados com concordância de gênero (ex.: "Castrada", "Vacinada").
  const cuidados = [
    pet.castrado ? concordar(pet, 'Castrado') : null,
    pet.vacinado ? concordar(pet, 'Vacinado') : null,
  ].filter(Boolean);

  return (
    // <article> é a tag semântica para um conteúdo independente (como um cartão).
    <article className="animal-card">
      {/* ===== Área da foto ===== */}
      <div className="animal-card-photo">
        {/* loading="lazy": a foto só é baixada quando o cartão se aproxima da tela. */}
        <PetPhoto pet={pet} loading="lazy" />
        {/* Selo "Urgente" só para casos urgentes. */}
        {pet.urgent ? <span className="animal-card-badge">Urgente</span> : null}
        {/* Botão de favoritar: só aparece se a tela passou a função onToggleFavorite. */}
        {onToggleFavorite ? (
          <button
            type="button"
            // Adiciona a classe "is-active" quando é favorito; .trim() remove o espaço que sobra.
            className={`animal-card-fav ${isFavorite ? 'is-active' : ''}`.trim()}
            // aria-pressed indica a leitores de tela que é um botão "liga/desliga" e seu estado.
            aria-pressed={isFavorite}
            aria-label={`Favoritar ${pet.name}`}
            // "title" mostra uma dica ao passar o mouse.
            title={isFavorite ? 'Tirar dos favoritos' : 'Favoritar'}
            // Ao clicar, avisa a tela qual animal foi (des)favoritado.
            onClick={() => onToggleFavorite(pet)}
          >
            {/* Coração preenchido (currentColor = cor do texto) quando favorito; vazio quando não. */}
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* ===== Corpo do cartão ===== */}
      <div className="animal-card-body">
        {/* Título com o nome, no nível escolhido (h2, h3...). */}
        <Heading className="animal-card-name">{pet.name}</Heading>
        {/* Linha de informações montada acima. */}
        <p className="animal-card-meta">{meta}</p>
        {/* Tempo de espera, se houver. */}
        {waiting ? (
          <p className="animal-card-waiting">
            <Clock3 size={14} aria-hidden="true" />
            {waiting}
          </p>
        ) : null}
        {/* Descrição, se houver (o CSS limita a 3 linhas). */}
        {pet.descricao ? <p className="animal-card-desc">{pet.descricao}</p> : null}
        {/* Lista de etiquetas: só aparece se houver pelo menos um traço ou cuidado. */}
        {traits.length + cuidados.length > 0 ? (
          <ul className="animal-card-tags" aria-label="Temperamento e cuidados">
            {/* Traços de temperamento (com a classe is-trait, de cor diferente).
                A key tem prefixo "trait-" para não colidir com as keys dos cuidados. */}
            {traits.map((trait) => <li className="is-trait" key={`trait-${trait}`}>{trait}</li>)}
            {/* Cuidados (castração e vacinação). */}
            {cuidados.map((cuidado) => <li key={cuidado}>{cuidado}</li>)}
          </ul>
        ) : null}

        {/* ===== Rodapé do cartão ===== */}
        <div className="animal-card-footer">
          {/* Link para a ficha do animal (ou para o catálogo, se não houver id).
              O texto fica "Conhecer o Nino" / "Conhecer a Mel"; {' '} insere um espaço em JSX.
              O nome e a seta ficam juntos num <span> que não quebra linha (veja o CSS). */}
          <Link to={pet.id ? `/animais/${encodeURIComponent(pet.id)}` : '/adotar'} className="animal-card-link">
            Conhecer {artigo(pet)}{' '}
            <span className="animal-card-link-end">
              {pet.name}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
          {/* Botão de compartilhar: só aparece se a tela passou a função onShare. */}
          {onShare ? (
            <button type="button" className="animal-card-share" aria-label={`Compartilhar ${pet.name}`} onClick={() => onShare(pet)}>
              <Share2 size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente recebe o animal e, opcionalmente, as funções de favoritar/compartilhar.
 *   2. Calcula textos derivados: linha de informações, tempo de espera, traços e cuidados.
 *   3. Desenha a foto (com selo de urgente e botão de favoritar, se houver).
 *   4. Desenha nome, informações, espera, descrição e etiquetas (só o que existir).
 *   5. No rodapé, o link leva à ficha /animais/:id; o botão de compartilhar aparece se houver onShare.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componentes reutilizáveis e props opcionais (mostrar botões só quando a função é passada).
 *   - Tags dinâmicas no JSX (const Heading = `h${n}`; <Heading>).
 *   - Renderização condicional com ternário e listas com .map + key.
 *   - .filter(Boolean), .slice, .join e o operador "??".
 *   - Acessibilidade: <article>, hierarquia de títulos, aria-pressed, aria-label, aria-hidden.
 *   - Link do React Router e encodeURIComponent.
 *   - Classes CSS dinâmicas com template string.
 * ============================================================================
 */
