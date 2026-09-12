// O quê: importa os hooks necessários para estado, efeitos, memorização e referências DOM.
// Como: usa a API de hooks do React; useMemo evita recalcular a lista sem mudanças nas dependências.
// Para quê: sustenta o ciclo de vida, os filtros derivados e o gatilho de carregamento incremental da página.
import { useEffect, useMemo, useRef, useState } from "react";
// O quê: importa os componentes de animação usados nos elementos que entram e saem da tela.
// Como: AnimatePresence observa a montagem/desmontagem e motion fornece propriedades animáveis.
// Para quê: mantém transições visuais consistentes nos filtros, detalhes e formulário de adoção.
import { AnimatePresence, motion } from "framer-motion";
// O quê: importa os ícones exibidos na busca, ordenação, filtros e estados vazios.
// Como: cada ícone é um componente React configurável por propriedades como size e className.
// Para quê: comunica visualmente as ações e os estados principais do catálogo.
import {
  ChevronDown,
  PawPrint,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
// O quê: importa os componentes responsáveis pelos fluxos de interação do catálogo.
// Como: cada componente recebe dados e callbacks por props, mantendo a página como coordenadora do estado.
// Para quê: permite abrir filtros, detalhes do animal e formulário de adoção sem duplicar a lógica de interface.
import { AdoptionFormModal } from "../components/AdoptionFormModal/AdoptionFormModal";
import { FilterDrawer } from "../components/FilterDrawer/FilterDrawer";
import { PetCard } from "../components/PetCard/PetCard";
import { PetDetail } from "../components/PetDetail/PetDetail";
import { PAGE_SIZE } from "../constants/catalogOptions";
import {
  buscarTodoAnimais,
  mapPetsFromApi,
} from "../components/PetSectionContainer/PetSectionContainer";
import { getAge, getSize, getSpecies } from "../utils/petHelpers";
import "./AdoptionCatalog.css";

// O quê: define os valores padrão de todos os critérios disponíveis no catálogo.
// Como: combina listas vazias, limite numérico, texto sentinela e flags booleanas.
// Para quê: representa o estado inicial sem restrições, permitindo listar todos os animais compatíveis.
const initialFilters = {
  species: [],
  size: [],
  sex: [],
  age: 15,
  city: "Todas as cidades",
  castrado: false,
  vacinado: false,
  urgent: false,
};

// O quê: cria uma nova instância do estado inicial dos filtros.
// Como: usa spread para copiar os campos base e recria as listas, evitando compartilhar referências mutáveis.
// Para quê: fornece um reset independente sempre que o usuário solicita limpar a filtragem.
function createInitialFilters() {
  return {
    ...initialFilters,
    species: [],
    size: [],
    sex: [],
  };
}

export default function AdoptionCatalog() {
  // O quê: declara o estado dos animais e dos controles da página.
  // Como: useState mantém valores entre renderizações e expõe setters para atualizar cada fluxo isoladamente.
  // Para quê: coordena os dados remotos, busca, filtros, paginação virtual e os overlays do catálogo.
  const [pets, setPets] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(createInitialFilters);
  const [sort, setSort] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [adoptionPet, setAdoptionPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = useRef(null);

  // O quê: carrega os animais uma única vez quando o catálogo é montado.
  // Como: encadeia Promise.then, catch e finally, e usa a flag active para ignorar respostas após desmontagem.
  // Para quê: evita atualizar estado de um componente desmontado e mantém estados de sucesso, erro e carregamento separados.
  useEffect(() => {
    let active = true;

    buscarTodoAnimais()
      // O quê: transforma a resposta da API e armazena os animais no formato da interface.
      // Como: mapPetsFromApi adapta o contrato externo antes de chamar o setter do React.
      // Para quê: desacopla o catálogo do formato bruto fornecido pelo serviço.
      .then((data) => {
        if (active) setPets(mapPetsFromApi(data));
      })
      // O quê: substitui a coleção por uma lista vazia quando a busca falha.
      // Como: captura a rejeição da Promise e atualiza o estado somente se o componente ainda estiver ativo.
      // Para quê: evita exibir dados inválidos e permite que a interface trate o resultado como catálogo vazio.
      .catch(() => {
        if (active) setPets([]);
      })
      // O quê: encerra o estado visual de carregamento após sucesso ou erro.
      // Como: finally executa independentemente do resultado da Promise, condicionado à flag active.
      // Para quê: remove os skeletons sem duplicar essa atualização nos dois caminhos de saída.
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      // O quê: marca a operação como inativa durante a desmontagem.
      // Como: altera a variável fechada pelo efeito, que é consultada antes de cada atualização.
      // Para quê: impede atualizações assíncronas depois que o usuário saiu da página.
      active = false;
    };
  }, []);

  // O quê: aplica debounce ao texto digitado na busca.
  // Como: aguarda 300 ms antes de copiar inputQuery para query e cancela o timer anterior quando há nova digitação.
  // Para quê: reduz recomputações sucessivas enquanto o usuário ainda está escrevendo.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(inputQuery), 300);
    return () => window.clearTimeout(timer);
  }, [inputQuery]);

  // O quê: reinicia a quantidade de cards visíveis quando a consulta, os filtros ou a ordenação mudam.
  // Como: observa esses valores no array de dependências e restaura PAGE_SIZE.
  // Para quê: faz cada nova combinação de critérios começar pela primeira página de resultados.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, filters, sort]);

  // O quê: configura o carregamento automático de mais resultados ao alcançar o fim da lista.
  // Como: IntersectionObserver monitora loadMoreRef e incrementa visibleCount quando o sentinel entra na área observada.
  // Para quê: implementa paginação progressiva sem exigir um botão explícito de “carregar mais”.
  useEffect(() => {
    // O quê: verifica se o navegador oferece a API de observação de interseção.
    // Como: retorna antecipadamente quando a propriedade global não existe.
    // Para quê: preserva a renderização em ambientes sem suporte, como alguns testes ou navegadores antigos.
    if (typeof IntersectionObserver === "undefined") return undefined;

    // O quê: cria o observador responsável por detectar a proximidade do fim da lista.
    // Como: recebe uma callback com a entrada observada e uma margem antecipada de 260 pixels.
    // Para quê: inicia a próxima leva antes de o usuário atingir exatamente o último card.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // O quê: aumenta a quantidade de animais renderizados quando o sentinel está visível.
        // Como: usa atualização funcional para calcular o novo valor a partir do estado mais recente.
        // Para quê: suporta múltiplas interseções sem perder incrementos concorrentes.
        if (entry.isIntersecting) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "260px" },
    );

    // O quê: conecta o observador ao elemento sentinel do catálogo.
    // Como: só chama observe quando a referência já aponta para um elemento DOM.
    // Para quê: ativa o carregamento incremental no ponto correto da página.
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    // O quê: remove o observador quando o efeito é desmontado.
    // Como: disconnect encerra todas as observações mantidas pela instância.
    // Para quê: evita vazamentos e callbacks após a saída da página.
    return () => observer.disconnect();
  }, []);

  // O quê: calcula a lista de animais que atende à busca, aos filtros e à ordenação atuais.
  // Como: useMemo memoriza o resultado até que pets, query, filters ou sort mudem; filter e sort percorrem a coleção derivada.
  // Para quê: fornece uma única fonte de dados para contador, cards, estado vazio e paginação visual.
  const filteredPets = useMemo(() => {
    // O quê: normaliza a consulta textual recebida do campo de busca.
    // Como: remove espaços nas extremidades e converte o texto para minúsculas.
    // Para quê: torna a comparação independente de capitalização e de espaços acidentais.
    const normalized = query.toLowerCase().trim();

    // O quê: filtra e ordena os animais carregados.
    // Como: cada predicado calcula uma regra isolada e o resultado é ordenado por nome ou prioridade de urgência.
    // Para quê: transforma dados brutos em resultados prontos para renderização no catálogo.
    return pets
      .filter((pet) => {
        // O quê: verifica se a busca aparece no nome, código ou metadados do animal.
        // Como: agrupa os campos em uma string normalizada e usa includes para uma busca parcial.
        // Para quê: permite localizar perfis por diferentes identificadores com um único campo.
        const matchesQuery =
          !normalized ||
          [pet.name, pet.code, pet.meta]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        // O quê: verifica a espécie selecionada, quando houver alguma seleção.
        // Como: aceita todos os animais com uma lista vazia ou exige inclusão do valor derivado de getSpecies.
        // Para quê: restringe o catálogo ao tipo de animal desejado sem impor filtro por padrão.
        const matchesSpecies =
          !filters.species.length || filters.species.includes(getSpecies(pet));
        // O quê: verifica o porte selecionado, quando houver alguma seleção.
        // Como: usa a mesma estratégia de lista vazia ou includes sobre o valor calculado por getSize.
        // Para quê: permite encontrar animais compatíveis com o espaço e a preferência do adotante.
        const matchesSize =
          !filters.size.length || filters.size.includes(getSize(pet));
        // O quê: verifica se a idade do animal está dentro do limite configurado.
        // Como: converte o limite para número e compara com a idade normalizada por getAge.
        // Para quê: elimina perfis acima da faixa etária escolhida.
        const matchesAge = getAge(pet) <= Number(filters.age);
        // O quê: verifica a cidade do animal, respeitando a opção que representa todas as cidades.
        // Como: usa comparação direta apenas quando o valor selecionado não é o texto sentinela.
        // Para quê: limita resultados à localidade escolhida sem filtrar quando não há preferência geográfica.
        const matchesCity =
          filters.city === "Todas as cidades" || pet.city === filters.city;
        // O quê: verifica o requisito de urgência.
        // Como: deixa todos passarem quando urgent é falso e exige pet.urgent quando é verdadeiro.
        // Para quê: destaca animais que precisam de encaminhamento prioritário.
        const matchesStatus = !filters.urgent || pet.urgent;
        // O quê: verifica os requisitos de castração e vacinação.
        // Como: combina condições com AND e usa optional chaining antes de consultar tags.
        // Para quê: garante que cada cuidado selecionado seja atendido sem falhar quando tags estiver ausente.
        const matchesCare =
          (!filters.castrado || pet.tags?.includes("Castrado")) &&
          (!filters.vacinado || pet.tags?.includes("Vacinado"));
        // O quê: verifica se alguma opção de sexo aparece nas tags do animal.
        // Como: permite todos sem seleção e usa some para aceitar qualquer correspondência quando há opções.
        // Para quê: aplica corretamente filtros de seleção múltipla.
        const matchesSex =
          !filters.sex.length ||
          filters.sex.some((sex) => pet.tags?.includes(sex));

        return (
          matchesQuery &&
          matchesSpecies &&
          matchesSize &&
          matchesAge &&
          matchesCity &&
          matchesStatus &&
          matchesCare &&
          matchesSex
        );
      })
      // O quê: ordena os resultados filtrados conforme a opção selecionada.
      // Como: usa localeCompare para nomes e comparação numérica de flags para urgência.
      // Para quê: apresenta os cards na ordem esperada sem alterar a coleção original de pets.
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(b.urgent) - Number(a.urgent),
      );
  }, [pets, query, filters, sort]);

  // O quê: restaura todos os filtros para o estado inicial.
  // Como: cria um novo objeto por meio de createInitialFilters e o envia ao setter.
  // Para quê: centraliza o comportamento de limpeza usado pela toolbar e pelo estado vazio.
  function clearFilters() {
    setFilters(createInitialFilters());
  }

  // O quê: constrói os rótulos dos filtros atualmente ativos.
  // Como: concatena arrays de seleção e converte flags/cidade em textos, removendo valores falsos no final.
  // Para quê: alimenta os chips informativos exibidos acima da grade de resultados.
  const activeFilters = [
    ...filters.species,
    ...filters.size,
    ...filters.sex,
    filters.city !== "Todas as cidades" ? filters.city : "",
    filters.urgent ? "Urgentes" : "",
    filters.castrado ? "Castrados" : "",
    filters.vacinado ? "Vacinados" : "",
  ].filter(Boolean);

  // O quê: compartilha o perfil de um animal usando a capacidade nativa do dispositivo ou uma cópia de URL.
  // Como: prefere navigator.share e usa clipboard como fallback opcional quando a API não existe.
  // Para quê: permite divulgar o animal mesmo em navegadores que não oferecem compartilhamento nativo.
  async function sharePet(pet) {
    if (navigator.share) {
      await navigator.share({
        title: `${pet.name} espera por um lar`,
        text: `Conheça ${pet.name} na Patas em Casa.`,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  // O quê: renderiza a página completa do catálogo de adoção.
  // Como: combina JSX condicional, componentes controlados e callbacks para refletir o estado local.
  // Para quê: oferece busca, filtros, ordenação, navegação pelos animais e início do processo de adoção.
  return (
    // O quê: cria o contêiner semântico principal e sinaliza quando o detalhe está aberto.
    // Como: monta a classe CSS dinamicamente a partir de selectedPet.
    // Para quê: permite ajustar layout e comportamento visual quando um painel de detalhes ocupa a tela.
    <main className={`catalog-page ${selectedPet ? "has-detail" : ""}`}>
      {/* O quê: agrupa o conteúdo central da página.
          Como: aplica a estrutura de layout definida por catalog-wrap.
          Para quê: mantém breadcrumb, cabeçalho, controles e resultados alinhados no catálogo. */}
      <div className="catalog-wrap">
        {/* O quê: oferece um link de retorno para a página inicial.
            Como: usa navegação HTML convencional para apontar à raiz da aplicação.
            Para quê: dá contexto de localização e uma saída rápida do catálogo. */}
        <a className="catalog-breadcrumb" href="/">
          Início <span>/</span> Adotar
        </a>

       
        {/* O quê: apresenta o título, a descrição e a identidade visual do catálogo.
          Como: combina texto derivado de filteredPets com o ícone PawPrint.
          Para quê: informa o propósito da página e a quantidade atual de resultados. */}
        <div className="catalog-header">
          <div>
            <span className="catalog-eyebrow">Adoção responsável</span>
            <h1>Encontre seu novo melhor amigo</h1>
            <p>
              <strong>{filteredPets.length}</strong> animais esperando por um
              lar cheio de carinho.
            </p>
          </div>
          <PawPrint className="header-paw" size={71} />
        </div>

        {/* O quê: renderiza busca, abertura de filtros e ordenação.
          Como: cada controle é controlado pelo estado e atualiza o componente por callbacks.
          Para quê: concentra os principais mecanismos de descoberta dos animais. */}
        <section className="catalog-toolbar">
          <label className="catalog-search">
            <Search size={19} />
            <input
              value={inputQuery}
              onChange={(event) => setInputQuery(event.target.value)}
              placeholder="Busque por nome, raça ou ID..."
            />
          </label>
          <button
            type="button"
            className="filter-trigger"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={18} /> Filtros
            {activeFilters.length > 0 && <b>{activeFilters.length}</b>}
          </button>
          <label className="sort-select">
            <span>Ordenar por</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="urgent">Mais urgentes</option>
              <option value="name">Nome (A-Z)</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </section>

        {/* O quê: mostra os filtros ativos somente quando existe alguma restrição.
          Como: percorre activeFilters com map e oferece ações que chamam clearFilters.
          Para quê: torna visível o estado da filtragem e permite removê-la rapidamente. */}
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map((filter) => (
              <button type="button" key={filter} onClick={clearFilters}>
                {filter} <X size={13} />
              </button>
            ))}
            <button type="button" className="clear-all" onClick={clearFilters}>
              Limpar tudo
            </button>
          </div>
        )}

        {/* O quê: alterna entre skeletons de carregamento e a grade de cards.
          Como: usa renderização condicional e limita a coleção com slice antes de mapear PetCard.
          Para quê: fornece feedback durante a busca e evita renderizar todos os resultados de uma vez. */}
        {loading ? (
          <div className="catalog-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div className="catalog-skeleton" key={index} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="catalog-grid">
              {filteredPets.slice(0, visibleCount).map((pet, index) => (
                <PetCard
                  key={pet.code || `${pet.name}-${index}`}
                  pet={pet}
                  onOpen={setSelectedPet}
                  onShare={sharePet}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* O quê: exibe uma mensagem e uma ação quando nenhum resultado atende aos critérios.
          Como: combina as condições de carregamento concluído e lista vazia.
          Para quê: orienta o usuário a remover as restrições e recuperar a listagem completa. */}
        {!loading && filteredPets.length === 0 && (
          <div className="catalog-empty">
            <PawPrint size={34} />
            <h2>Nenhum animal encontrado</h2>
            <p>
              Não encontramos um perfil com esses filtros. Que tal ver todos?
            </p>
            <button
              type="button"
              className="catalog-primary-button"
              onClick={() => {
                setInputQuery("");
                setQuery("");
                clearFilters();
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* O quê: renderiza o sentinel observado pela paginação incremental.
          Como: associa loadMoreRef ao elemento e mostra o indicador apenas quando ainda há resultados ocultos.
          Para quê: conecta a interface ao IntersectionObserver sem adicionar controles extras à grade. */}
        <div ref={loadMoreRef} className="catalog-load-more">
          {visibleCount < filteredPets.length && (
            <>
              <span />
              Carregando mais amigos...
            </>
          )}
        </div>
      </div>

        {/* O quê: monta o drawer de filtros e sua camada de fundo quando drawerOpen é verdadeiro.
          Como: AnimatePresence anima a saída e motion.button fornece a transição do overlay.
          Para quê: permite editar critérios sem abandonar o contexto do catálogo. */}
        <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              className="drawer-overlay"
              aria-label="Fechar filtros"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <FilterDrawer
              filters={filters}
              setFilters={setFilters}
              onClose={() => setDrawerOpen(false)}
              onClear={clearFilters}
            />
          </>
        )}
      </AnimatePresence>

        {/* O quê: monta os detalhes do animal selecionado.
          Como: passa o animal atual e callbacks para fechar ou iniciar a adoção.
          Para quê: mantém a seleção fora da grade e permite avançar para o próximo fluxo. */}
        <AnimatePresence>
        {selectedPet && (
          <PetDetail
            pet={selectedPet}
            onClose={() => setSelectedPet(null)}
            onAdopt={(pet) => {
              setSelectedPet(null);
              setAdoptionPet(pet);
            }}
          />
        )}
      </AnimatePresence>

        {/* O quê: monta o formulário de adoção para o animal escolhido.
          Como: usa adoptionPet como condição de montagem e fornece onClose para limpar o estado.
          Para quê: inicia a coleta de dados necessária para a solicitação de adoção. */}
        <AnimatePresence>
        {adoptionPet && (
          <AdoptionFormModal
            pet={adoptionPet}
            onClose={() => setAdoptionPet(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
