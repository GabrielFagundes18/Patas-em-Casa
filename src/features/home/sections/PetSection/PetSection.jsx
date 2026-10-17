/*
 * ============================================================================
 * ARQUIVO: PetSection.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a VITRINE de animais da página inicial (seção "#adotar"): mostra até 4
 *   animais, com os casos urgentes primeiro, e um botão para ver o catálogo
 *   completo. Também mostra as mensagens de "carregando", erro ou lista vazia.
 *
 * PRINCIPAIS ITENS:
 *   - SHOWCASE_SIZE: quantos animais mostrar (4).
 *   - pickShowcase(pets, size): escolhe os animais da vitrine (exportada).
 *   - PetSection({ pets, loading, error }): o componente (exportação nomeada e padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./PetSection.css                         → estilos da vitrine.
 *   - react-router-dom (Link), lucide-react (ArrowRight).
 *   - shared/components/AnimalCard/AnimalCard  → cartão de cada animal.
 *   - Classes home-* de features/home/LandingPage.css.
 *   - Quem usa: features/home/LandingPage.jsx (passa pets, loading e error).
 * ============================================================================
 */

// O quê: vitrine da Home com 4 animais (urgentes primeiro) e o link para o catálogo completo.
// Como: recebe a lista já carregada pela Home (useAvailableAnimals) e mostra carregando, erro ou vazio.
// Para quê: apresentar quem precisa de um lar sem transformar a Home num catálogo.
// Estilos da vitrine.
import './PetSection.css';
// Link: navegação interna.
import { Link } from 'react-router-dom';
// Ícone de seta.
import { ArrowRight } from 'lucide-react';
// Cartão de animal reutilizado no site todo.
import { AnimalCard } from 'shared/components/AnimalCard/AnimalCard';

// Quantidade de animais exibidos na vitrine.
const SHOWCASE_SIZE = 4;

/*
 * FUNÇÃO: pickShowcase (exportada)
 * O que faz: escolhe os animais da vitrine, colocando os urgentes na frente.
 * Parâmetros:
 *   - pets (array): animais no formato do petMapper.
 *   - size (number, padrão SHOWCASE_SIZE = 4): quantos animais devolver.
 * Retorno (array): até "size" animais — primeiro os urgentes, depois os demais,
 *   mantendo a ordem original da API dentro de cada grupo.
 * Onde é usada: no PetSection, logo abaixo.
 */
// Urgentes primeiro, mantendo a ordem da API dentro de cada grupo.
export function pickShowcase(pets, size = SHOWCASE_SIZE) {
  // Cria uma lista nova: [...urgentes, ...não urgentes] (o spread "espalha" cada lista)
  // e .slice(0, size) pega só os primeiros "size" itens.
  return [...pets.filter((pet) => pet.urgent), ...pets.filter((pet) => !pet.urgent)].slice(0, size);
}

/*
 * COMPONENTE: PetSection
 * O que faz: desenha a vitrine com cabeçalho, botão "ver todos", estados e cartões.
 * Parâmetros (props):
 *   - pets (array, padrão []): todos os animais disponíveis.
 *   - loading (boolean, padrão false): se a lista ainda está carregando.
 *   - error (string | null, padrão null): mensagem de erro da busca.
 * Retorno: JSX da <section id="adotar">.
 * Onde é usado: LandingPage.jsx.
 */
export function PetSection({ pets = [], loading = false, error = null }) {
  // Animais escolhidos para a vitrine.
  const showcase = pickShowcase(pets);

  return (
    // id="adotar" é o alvo dos links "/#adotar" do menu.
    <section id="adotar" className="home-section home-pets" aria-labelledby="pets-title">
      {/* Grade com áreas nomeadas (veja o CSS): cabeçalho, botão "ver todos" e cartões. */}
      <div className="wrap home-pets-layout">
        {/* Cabeçalho da seção. */}
        <div className="home-head">
          <p className="home-eyebrow">Para adoção</p>
          <h2 id="pets-title" className="home-title">Quem está esperando por você</h2>
          <p className="home-lead">Os casos urgentes aparecem primeiro. Cada perfil tem fotos, saúde e temperamento.</p>
        </div>

        {/* Botão para o catálogo (só se houver animais). O texto muda para singular/plural. */}
        {pets.length > 0 ? (
          <Link to="/adotar" className="home-btn home-btn--ghost home-pets-more">
            {pets.length === 1 ? 'Ver o animal disponível' : `Ver todos os ${pets.length} animais`}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : null}

        {/* Carregando: role="status" anuncia a mensagem sem interromper. */}
        {loading ? <p className="home-pets-state" role="status">Carregando os animais…</p> : null}
        {/* Erro: role="alert" anuncia imediatamente. */}
        {error ? <p className="home-pets-state is-error" role="alert">{error}</p> : null}
        {/* Lista vazia: terminou de carregar, sem erro e sem animais. */}
        {!loading && !error && pets.length === 0 ? (
          <p className="home-pets-state">Nenhum animal disponível agora. Volte em breve!</p>
        ) : null}

        {/* Grade de cartões (só se houver animais na vitrine). */}
        {showcase.length > 0 ? (
          <div className="home-pets-grid">
            {/* key: usa o id; se não houver ("??"), usa o nome. */}
            {showcase.map((pet) => <AnimalCard key={pet.id ?? pet.name} pet={pet} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Também exporta como padrão (permite os dois tipos de import).
export default PetSection;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A LandingPage passa a lista de animais e os estados de carregamento/erro.
 *   2. pickShowcase separa urgentes e não urgentes e pega os 4 primeiros.
 *   3. A seção mostra o cabeçalho, o botão "ver todos" (se houver animais),
 *      a mensagem de estado adequada e os cartões.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Ordenação por grupos com .filter + spread + .slice (sem alterar a lista original).
 *   - Estados de interface: carregando, erro, vazio e com dados.
 *   - Reutilização de componentes (AnimalCard).
 *   - Props com valores padrão.
 *   - Âncoras de navegação (id="adotar").
 *   - Acessibilidade: role="status" x role="alert".
 *   - Export nomeado + export default do mesmo componente.
 * ============================================================================
 */
