/*
 * ============================================================================
 * ARQUIVO: AnimalsPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a tela "Animais" do painel administrativo da ONG. Nela a equipe consegue:
 *     - ver a lista (tabela) de animais cadastrados, página por página;
 *     - buscar e filtrar (por nome, status, espécie, porte, sexo, idade, castração e vacina);
 *     - ordenar a lista pelo nome;
 *     - cadastrar um animal novo, editar um existente, mudar o status ou excluir.
 *   Os filtros ficam guardados na URL (ex.: ?status=disponivel&page=2), então dá para
 *   recarregar a página ou compartilhar o link sem perder a busca.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - formatAge(value)        → transforma a idade em texto ("2 anos", "1 ano"...).
 *   - errorMessage(error)     → extrai uma mensagem de erro legível da resposta da API.
 *   - AnimalsPage({ user })   → o componente React da tela (exportado como padrão).
 *       Dentro dele: setDraftValue, applyFilters, clearFilters, setPage, sortBy,
 *       saveAnimal, changeStatus, removeAnimal, openCreateForm e openEditForm.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react                               → hooks useState e useEffect.
 *   - react-router-dom                    → hook useSearchParams (lê/escreve a URL).
 *   - lucide-react                        → ícones (setas, lupa, lixeira etc.).
 *   - ./AnimalFormDialog.jsx              → janela (modal) do formulário de cadastro/edição.
 *   - admin/constants/animalOptions.js    → listas fixas: espécies, portes, sexos, status
 *                                           e o tamanho de página (animalPageSize = 20).
 *   - ./animalService.js                  → funções que chamam a API do backend
 *                                           (listar, criar, atualizar, mudar status, excluir).
 *   - Quem USA este arquivo: admin/AdminDashboardPage.jsx, que renderiza
 *     <AnimalsPage user={user} /> quando a aba "animais" está ativa.
 *   - Os nomes de classe CSS (admin-page, admin-table...) vêm de admin/styles/admin.css.
 * ============================================================================
 */

// Importa dois "hooks" do React:
//   - useState: cria uma variável de estado; quando ela muda, o React redesenha a tela.
//   - useEffect: executa um código "colateral" (ex.: buscar dados na API) depois que a tela é desenhada.
import { useEffect, useState } from 'react';
// useSearchParams é um hook do React Router que dá acesso aos parâmetros da URL
// (a parte depois do "?", ex.: ?q=rex&page=2). Aqui ele é usado para guardar os filtros.
import { useSearchParams } from 'react-router-dom';
// Ícones prontos da biblioteca lucide-react. Cada um é um componente React que desenha um SVG.
//   ArrowDown/ArrowUp → setas da ordenação; Plus → "+"; RotateCw → recarregar;
//   Search → lupa; SlidersHorizontal → ícone de filtros; Trash2 → lixeira.
import { ArrowDown, ArrowUp, Plus, RotateCw, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
// Componente da janela com o formulário de cadastro/edição de animal (arquivo vizinho).
import AnimalFormDialog from './AnimalFormDialog';
// Importa constantes (valores fixos) usadas nos filtros e na tabela.
// O caminho 'admin/...' funciona sem "../" porque o jsconfig.json define "src" como pasta base.
import {
  animalPageSize, // quantos animais aparecem por página (20)
  animalSizes, // lista de portes: pequeno, médio, grande
  animalSpecies, // lista de espécies: cachorro, gato, outro
  animalStatusMap, // objeto que liga cada status ao seu rótulo e à sua cor (variant)
  animalSexes, // lista de sexos: macho, fêmea
} from 'admin/constants/animalOptions';
// Importa as funções que conversam com o backend (cada uma faz uma requisição HTTP).
import {
  createAnimal, // POST   /api/v1/animals            → cadastra
  deleteAnimal, // DELETE /api/v1/animals/:id        → exclui
  listAnimals, // GET    /api/v1/animals            → lista com filtros e paginação
  updateAnimal, // PUT    /api/v1/animals/:id        → atualiza os dados
  updateAnimalStatus, // PATCH  /api/v1/animals/:id/status → muda só o status
} from './animalService';

/*
 * FUNÇÃO: formatAge
 * O que faz: converte a idade do animal (em anos) em um texto amigável para a tabela.
 * Parâmetros:
 *   - value (number | string | null | undefined): a idade vinda da API (campo idade_anos).
 *     Pode ser decimal, como 0.5 (seis meses) ou 2.5.
 * Retorno (string):
 *   - 'Não informada' quando não existe idade;
 *   - caso contrário, algo como "1 ano", "2 anos" ou "0,5 anos" (com vírgula, padrão brasileiro).
 * Onde é usada: na coluna "Idade" da tabela, mais abaixo neste arquivo.
 */
function formatAge(value) {
  // Se a idade estiver vazia (null, undefined ou texto vazio), não há o que formatar:
  // devolve um texto padrão e encerra a função ali mesmo (o "return" sai da função).
  if (value === null || value === undefined || value === '') return 'Não informada';
  // Number() garante que trabalharemos com número, mesmo que a API tenha mandado texto ("2.5").
  const age = Number(value);
  // Monta o texto final usando "template string" (crase + ${...} para inserir valores):
  //   - Intl.NumberFormat('pt-BR', ...) formata o número no padrão brasileiro (2,5 em vez de 2.5);
  //     maximumFractionDigits: 1 limita a no máximo 1 casa decimal.
  //   - O operador ternário (condição ? A : B) escolhe "ano" no singular só quando a idade é 1.
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(age)} ${age === 1 ? 'ano' : 'anos'}`;
}

/*
 * FUNÇÃO: errorMessage
 * O que faz: descobre qual mensagem de erro mostrar ao usuário quando uma chamada à API falha.
 * Parâmetros:
 *   - error (objeto de erro do axios): costuma ter error.response.data com o corpo da resposta.
 * Retorno (string):
 *   - a mensagem enviada pelo backend, se existir (em um dos dois formatos possíveis);
 *   - senão, uma mensagem genérica.
 * Onde é usada: em todos os "catch" deste arquivo (carregar, salvar, mudar status, excluir).
 */
function errorMessage(error) {
  // "?." é o encadeamento opcional: se alguma parte do caminho não existir (ex.: sem internet,
  // então não há "response"), o resultado vira undefined em vez de quebrar o programa.
  // "||" devolve o primeiro valor "verdadeiro" da sequência — funciona como "tente este, senão o próximo".
  return error?.response?.data?.error?.message // 1º formato: { error: { message: '...' } }
    || error?.response?.data?.message // 2º formato: { message: '...' }
    || 'Não foi possível carregar os animais.'; // texto padrão se nenhum dos dois existir
}

/*
 * COMPONENTE: AnimalsPage
 * O que faz: desenha a tela completa de gestão de animais (barra de ações, filtros,
 *   tabela, paginação e o formulário em janela) e controla toda a lógica dela.
 * Parâmetros (props):
 *   - user (objeto): o usuário logado no painel. O que importa aqui é user.permissions,
 *     uma lista de textos como 'animals:create', 'animals:update', 'animals:delete',
 *     que decide quais botões aparecem.
 * Retorno: JSX (a "descrição" da interface que o React transforma em HTML na tela).
 * Onde é usado: em admin/AdminDashboardPage.jsx, quando a aba "animais" do menu está ativa.
 * "export default" significa que este é o item principal exportado pelo arquivo.
 */
export default function AnimalsPage({ user }) {
  // useSearchParams devolve um par: [parâmetros atuais da URL, função para trocá-los].
  // searchParams é um objeto URLSearchParams (tem métodos como get, has, set, entries).
  const [searchParams, setSearchParams] = useSearchParams();
  // Versão em texto dos parâmetros (ex.: "q=rex&page=1"). Texto é fácil de comparar,
  // então é usado como "dependência" do useEffect para saber quando a URL mudou.
  const searchKey = searchParams.toString();
  // items: lista de animais da página atual (começa vazia até a API responder).
  const [items, setItems] = useState([]);
  // meta: informações da paginação vindas da API (página atual, tamanho, total de registros
  // e total de páginas). Começa com valores iniciais seguros.
  const [meta, setMeta] = useState({ page: 1, pageSize: animalPageSize, total: 0, totalPages: 0 });
  // loading: true enquanto a lista está sendo buscada (começa true porque a busca já começa ao abrir).
  const [loading, setLoading] = useState(true);
  // error: mensagem de erro ao CARREGAR a lista ('' significa "sem erro").
  const [error, setError] = useState('');
  // retryCount: um contador que só serve para "forçar" o recarregamento da lista.
  // Toda vez que ele aumenta, o useEffect lá embaixo roda de novo e busca os dados outra vez.
  const [retryCount, setRetryCount] = useState(0);
  // editingAnimal: o animal aberto no formulário para edição (null = cadastro de um novo).
  const [editingAnimal, setEditingAnimal] = useState(null);
  // formOpen: controla se a janela do formulário está aberta (true) ou fechada (false).
  const [formOpen, setFormOpen] = useState(false);
  // formNotice: aviso exibido dentro do formulário (ex.: "Rex foi cadastrado. Agora envie as fotos.").
  const [formNotice, setFormNotice] = useState('');
  // saving: true enquanto o formulário está sendo enviado (serve para desabilitar o botão de salvar).
  const [saving, setSaving] = useState(false);
  // actionError: mensagem de erro de AÇÕES (salvar, mudar status, excluir) — diferente do erro de carregar.
  const [actionError, setActionError] = useState('');
  // draft ("rascunho"): o que o usuário está digitando nos filtros ANTES de clicar em "Filtrar".
  // Só quando ele clica em "Filtrar" o rascunho vai para a URL de verdade.
  // Passar uma função para o useState ("inicialização preguiçosa") faz o valor inicial ser
  // calculado só na primeira renderização. Object.fromEntries transforma os pares
  // [chave, valor] da URL em um objeto comum, ex.: { q: 'rex', status: 'disponivel' }.
  const [draft, setDraft] = useState(() => Object.fromEntries(searchParams.entries()));

  // Permissões do usuário logado. "?." evita erro se user ou permissions não existirem;
  // .includes() verifica se a lista contém a permissão. O resultado é true, false ou undefined.
  const canCreate = user?.permissions?.includes('animals:create'); // pode cadastrar?
  const canWrite = user?.permissions?.includes('animals:update'); // pode editar e mudar status?
  const canDelete = user?.permissions?.includes('animals:delete'); // pode excluir?
  // activeFilters: true se ALGUM filtro estiver presente na URL.
  // .some() percorre a lista e devolve true assim que um item satisfaz a condição.
  // É usado para decidir se o botão "Limpar" aparece e qual mensagem mostrar com a lista vazia.
  const activeFilters = ['q', 'status', 'especie', 'sexo', 'porte', 'castrado', 'vacinado', 'idadeMin', 'idadeMax']
    .some((key) => searchParams.has(key));

  // useEffect: roda o código abaixo depois que a tela aparece e de novo sempre que algum
  // valor da lista de dependências (no final, entre colchetes) mudar. Aqui ele busca os
  // animais na API toda vez que os filtros da URL mudam ou que retryCount aumenta.
  useEffect(() => {
    // "active" é uma trava de segurança: se o usuário mudar de filtro (ou sair da tela)
    // antes da resposta chegar, a resposta antiga é ignorada e não sobrescreve a nova.
    let active = true;
    // Liga o indicador "carregando" e apaga qualquer erro anterior antes de buscar.
    setLoading(true);
    setError('');

    /*
     * FUNÇÃO INTERNA: loadAnimals
     * O que faz: chama a API para listar os animais com os filtros atuais e guarda o resultado no estado.
     * Parâmetros: nenhum (usa searchParams, que está no "escopo" do componente).
     * Retorno: uma Promise (por ser async), sem valor útil — o resultado vai para o estado.
     * Por que existe: a função passada ao useEffect não pode ser async, então criamos
     *   uma função async aqui dentro e a chamamos logo em seguida.
     * "async/await": permite esperar uma operação demorada (como uma requisição)
     *   escrevendo o código de forma sequencial, como se fosse síncrono.
     */
    async function loadAnimals() {
      // try/catch/finally: o "try" tenta executar; se der erro, o "catch" trata;
      // e o "finally" roda SEMPRE no final, com ou sem erro.
      try {
        // Copia os parâmetros da URL para um objeto comum que será enviado à API.
        const params = Object.fromEntries(searchParams.entries());
        // "||=" atribui só se o valor atual for "falso" (vazio/inexistente).
        // Garante que sempre haja uma página e um tamanho de página na requisição.
        params.page ||= '1';
        params.pageSize ||= String(animalPageSize);
        // Faz a requisição e ESPERA (await) a resposta: { items: [...], meta: {...} }.
        const response = await listAnimals(params);
        // Se este efeito já foi "cancelado" (filtro mudou ou tela fechou), não faz nada.
        if (!active) return;
        // Guarda os animais e os dados de paginação; o React redesenha a tabela.
        setItems(response.items);
        setMeta(response.meta);
        // Sincroniza o rascunho dos filtros com a URL (útil se a URL mudou por outro caminho,
        // por exemplo pelo botão "voltar" do navegador).
        setDraft(Object.fromEntries(searchParams.entries()));
      } catch (requestError) {
        // A requisição falhou: mostra a mensagem de erro (só se o efeito ainda estiver ativo).
        if (active) setError(errorMessage(requestError));
      } finally {
        // Com sucesso ou erro, a busca terminou: desliga o "carregando".
        if (active) setLoading(false);
      }
    }

    // Dispara a busca.
    loadAnimals();
    // A função devolvida pelo useEffect é a "limpeza" (cleanup): o React a executa antes
    // de rodar o efeito de novo ou quando o componente sai da tela. Ela desliga a trava "active".
    return () => {
      active = false;
    };
    // Dependências: o efeito roda de novo quando qualquer um destes valores mudar.
  }, [retryCount, searchKey, searchParams]);

  /*
   * FUNÇÃO: setDraftValue
   * O que faz: atualiza UM campo do rascunho de filtros, mantendo os outros como estavam.
   * Parâmetros:
   *   - name (string): nome do filtro (ex.: 'q', 'status', 'porte').
   *   - value (string): o novo valor digitado/selecionado.
   * Retorno: nada.
   * Onde é usada: no onChange de cada campo do formulário de filtros.
   */
  function setDraftValue(name, value) {
    // Passa uma função para o setDraft: o React entrega o valor atual ("current") e usamos
    // o que ela retorna como novo valor. "...current" (spread) copia todos os campos antigos
    // e "[name]: value" (nome de propriedade calculado) sobrescreve só o campo desejado.
    setDraft((current) => ({ ...current, [name]: value }));
  }

  /*
   * FUNÇÃO: applyFilters
   * O que faz: pega o rascunho dos filtros e o grava na URL, o que dispara uma nova busca.
   * Parâmetros:
   *   - event (evento de submit do formulário): o evento gerado ao clicar em "Filtrar"
   *     ou apertar Enter no campo de busca.
   * Retorno: nada.
   * Onde é usada: no onSubmit do <form className="admin-filters">.
   */
  function applyFilters(event) {
    // Impede o comportamento padrão do navegador, que seria recarregar a página inteira.
    event.preventDefault();
    // Cria um conjunto de parâmetros de URL novo e vazio.
    const next = new URLSearchParams();
    // "for...of" percorre cada item da lista de nomes de filtros.
    for (const key of ['q', 'status', 'especie', 'sexo', 'porte', 'castrado', 'vacinado', 'idadeMin', 'idadeMax']) {
      // Lê o valor do rascunho para esse filtro.
      const value = draft[key];
      // Só coloca na URL os filtros preenchidos (ignora os vazios para a URL ficar limpa).
      if (value !== undefined && value !== '') next.set(key, value);
    }
    // Ao filtrar, volta sempre para a página 1 (a página antiga pode nem existir no novo resultado).
    next.set('page', '1');
    // Define o tamanho da página (convertido para texto, pois URLs só guardam texto).
    next.set('pageSize', String(animalPageSize));
    // Grava na URL. Isso muda searchParams → o useEffect percebe e busca os dados de novo.
    setSearchParams(next);
  }

  /*
   * FUNÇÃO: clearFilters
   * O que faz: remove todos os filtros, deixando só a paginação padrão (página 1).
   * Parâmetros: nenhum.
   * Retorno: nada.
   * Onde é usada: nos botões "Limpar" e "Limpar filtros".
   */
  function clearFilters() {
    // Cria parâmetros só com a página 1 e o tamanho padrão.
    const next = new URLSearchParams({ page: '1', pageSize: String(animalPageSize) });
    // Esvazia o rascunho, para os campos do formulário ficarem em branco.
    setDraft({});
    // Atualiza a URL, o que provoca uma nova busca sem filtros.
    setSearchParams(next);
  }

  /*
   * FUNÇÃO: setPage
   * O que faz: troca a página da listagem, mantendo os filtros atuais.
   * Parâmetros:
   *   - page (number): o número da página desejada.
   * Retorno: nada.
   * Onde é usada: nos botões "Anterior" e "Próxima" da paginação.
   */
  function setPage(page) {
    // Copia os parâmetros atuais (para não perder os filtros já aplicados).
    const next = new URLSearchParams(searchParams);
    // Define a nova página.
    next.set('page', String(page));
    // Se ainda não houver tamanho de página na URL, coloca o padrão.
    if (!next.has('pageSize')) next.set('pageSize', String(animalPageSize));
    // Atualiza a URL → nova busca.
    setSearchParams(next);
  }

  /*
   * FUNÇÃO: sortBy
   * O que faz: ordena a lista por um campo. Clicar de novo no mesmo campo inverte a ordem
   *   (crescente ↔ decrescente).
   * Parâmetros:
   *   - sort (string): o campo usado na ordenação (neste arquivo, só 'nome').
   * Retorno: nada.
   * Onde é usada: no botão do cabeçalho "Animal" da tabela.
   */
  function sortBy(sort) {
    // Copia os parâmetros atuais da URL.
    const next = new URLSearchParams(searchParams);
    // Campo de ordenação atual (pode ser null se ainda não houver ordenação).
    const currentSort = next.get('sort');
    // Direção atual; se não existir, considera 'desc' (decrescente).
    const currentOrder = next.get('order') || 'desc';
    // Grava o campo escolhido.
    next.set('sort', sort);
    // Regra da alternância: se já estava ordenado por este mesmo campo em ordem crescente,
    // passa para decrescente; em qualquer outro caso, usa crescente.
    next.set('order', currentSort === sort && currentOrder === 'asc' ? 'desc' : 'asc');
    // Mudou a ordem → volta para a página 1.
    next.set('page', '1');
    // Garante o tamanho de página.
    if (!next.has('pageSize')) next.set('pageSize', String(animalPageSize));
    // Atualiza a URL → nova busca já ordenada.
    setSearchParams(next);
  }

  /*
   * FUNÇÃO: saveAnimal
   * O que faz: salva o formulário. Se estiver editando, atualiza o animal e fecha a janela.
   *   Se for cadastro novo, cria o animal e deixa a janela aberta, agora em modo edição,
   *   para o usuário enviar as fotos (fotos precisam de um animal que já exista).
   * Parâmetros:
   *   - payload (objeto): os dados preenchidos no formulário (nome, espécie, idade etc.).
   * Retorno: Promise (função async). Se der erro, ela "relança" o erro (throw) para que o
   *   AnimalFormDialog também saiba que falhou e mantenha o formulário aberto.
   * Onde é usada: passada como prop onSubmit para o <AnimalFormDialog>.
   */
  // Depois de cadastrar, o formulário continua aberto em modo edição para enviar as fotos.
  async function saveAnimal(payload) {
    // Liga o estado "salvando" e limpa erros de ações anteriores.
    setSaving(true);
    setActionError('');
    try {
      // Se existe um animal em edição, é uma ATUALIZAÇÃO...
      if (editingAnimal) {
        // Envia os novos dados para a API e espera terminar.
        await updateAnimal(editingAnimal.id, payload);
        // Deu certo: fecha a janela e zera o estado do formulário.
        setFormOpen(false);
        setEditingAnimal(null);
        setFormNotice('');
      } else {
        // ...senão, é um CADASTRO novo. A API devolve o animal criado (já com id).
        const created = await createAnimal(payload);
        // Passa a "editar" o animal recém-criado. Isso muda a "key" do AnimalFormDialog
        // (de 'novo' para o id), fazendo o React recriar a janela em modo edição, com a área de fotos.
        setEditingAnimal(created);
        // Mostra um aviso orientando o próximo passo.
        setFormNotice(`${created.nome} foi cadastrado. Agora envie as fotos.`);
      }
      // Em ambos os casos, aumenta o contador para recarregar a lista com os dados novos.
      // A forma (count) => count + 1 usa sempre o valor mais recente do estado.
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      // Falhou: mostra a mensagem na tela...
      setActionError(errorMessage(requestError));
      // ...e relança o erro para quem chamou (o formulário) também poder reagir.
      throw requestError;
    } finally {
      // Sempre desliga o "salvando" no fim, com sucesso ou erro.
      setSaving(false);
    }
  }

  /*
   * FUNÇÃO: changeStatus
   * O que faz: muda o status de um animal (ex.: disponível → adotado). Se o backend
   *   responder que precisa de um motivo, pergunta o motivo ao usuário e tenta de novo.
   * Parâmetros:
   *   - animal (objeto): o animal da linha da tabela (usa animal.id e animal.nome).
   *   - status (string): o novo status escolhido no <select> (ex.: 'adotado').
   *   - motivo (string | undefined): justificativa da mudança. Na 1ª tentativa vem undefined.
   * Retorno: Promise sem valor útil.
   * Onde é usada: no onChange do <select> de status em cada linha da tabela.
   * Curiosidade: é uma função RECURSIVA (chama a si mesma) quando precisa do motivo.
   */
  async function changeStatus(animal, status, motivo) {
    // Limpa um possível erro anterior.
    setActionError('');
    try {
      // Pede à API para trocar o status e espera a resposta.
      await updateAnimalStatus(animal.id, status, motivo);
      // Deu certo: recarrega a lista para refletir o novo status.
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      // Algumas transições (ex.: inativar, devolução) exigem motivo registrado na auditoria.
      // Condição: o backend respondeu com o código 'MOTIVO_OBRIGATORIO' E ainda não tínhamos
      // tentado com motivo (motivo === undefined). A 2ª parte evita perguntar infinitamente.
      if (requestError?.response?.data?.error?.code === 'MOTIVO_OBRIGATORIO' && motivo === undefined) {
        // window.prompt abre uma caixinha do navegador pedindo um texto.
        // Devolve o texto digitado, ou null se o usuário clicar em "Cancelar".
        const informed = window.prompt(`Informe o motivo para mudar o status de ${animal.nome}:`);
        // .trim() remove espaços das pontas. Só tenta de novo se sobrou algum texto;
        // nesse caso chama a própria função, agora passando o motivo.
        if (informed?.trim()) await changeStatus(animal, status, informed.trim());
        // Sai da função aqui (não deve mostrar o erro original de "motivo obrigatório").
        return;
      }
      // Qualquer outro erro: mostra a mensagem na tela.
      setActionError(errorMessage(requestError));
    }
  }

  /*
   * FUNÇÃO: removeAnimal
   * O que faz: pede confirmação e, se o usuário aceitar, exclui o animal no backend.
   * Parâmetros:
   *   - animal (objeto): o animal da linha clicada.
   * Retorno: Promise sem valor útil.
   * Onde é usada: no botão de lixeira de cada linha (só aparece com permissão de excluir).
   */
  async function removeAnimal(animal) {
    // window.confirm mostra uma caixa com "OK" e "Cancelar"; devolve true ou false.
    const confirmed = window.confirm(`Excluir ${animal.nome}? Esta ação não pode ser desfeita.`);
    // Se o usuário cancelou, para por aqui sem excluir nada.
    if (!confirmed) return;

    // Limpa erro anterior antes de tentar.
    setActionError('');
    try {
      // Chama a API para excluir e espera terminar.
      await deleteAnimal(animal.id);
      // Excluído: recarrega a lista (o animal some da tabela).
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      // Falhou (ex.: sem permissão ou animal com vínculos): mostra o erro.
      setActionError(errorMessage(requestError));
    }
  }

  /*
   * FUNÇÃO: openCreateForm
   * O que faz: abre a janela do formulário vazia, para cadastrar um animal novo.
   * Parâmetros: nenhum. Retorno: nada.
   * Onde é usada: no botão "Cadastrar animal".
   */
  function openCreateForm() {
    setEditingAnimal(null); // null = nenhum animal em edição → formulário de cadastro
    setFormNotice(''); // remove avisos antigos
    setFormOpen(true); // abre a janela
  }

  /*
   * FUNÇÃO: openEditForm
   * O que faz: abre a janela do formulário já preenchida com os dados de um animal.
   * Parâmetros:
   *   - animal (objeto): o animal que será editado.
   * Retorno: nada.
   * Onde é usada: no botão "Editar" de cada linha da tabela.
   */
  function openEditForm(animal) {
    setEditingAnimal(animal); // guarda qual animal está sendo editado
    setFormNotice(''); // remove avisos antigos
    setFormOpen(true); // abre a janela
  }

  // Página atual: usa a da API; se não houver, a da URL; se não houver, 1.
  // Number() converte para número (a URL guarda tudo como texto).
  const currentPage = Number(meta.page || searchParams.get('page') || 1);
  // Total de páginas informado pela API (0 se não vier nada).
  const totalPages = Number(meta.totalPages || 0);

  // A partir daqui é o JSX: a descrição da interface. Parece HTML, mas é JavaScript.
  // Diferenças importantes: usa "className" em vez de "class", e tudo entre { } é código JS.
  return (
    // <section> agrupa a tela. aria-labelledby liga a seção ao título (id="animals-heading"),
    // o que ajuda leitores de tela (acessibilidade) a anunciar "Animais cadastrados".
    <section aria-labelledby="animals-heading" className="admin-page">
      {/* ===== BARRA SUPERIOR: título, total de registros e botões de ação ===== */}
      <div className="admin-toolbar">
        <div>
          <h2 id="animals-heading">Animais cadastrados</h2>
          {/* Mostra o total vindo da API; "|| 0" evita aparecer vazio enquanto não há dados. */}
          <p>{meta.total || 0} registros</p>
        </div>
        <div className="admin-toolbar-actions">
          {/* Botão de recarregar: aumenta retryCount, o que faz o useEffect buscar a lista de novo.
              aria-label dá um nome ao botão para leitores de tela, já que ele só tem um ícone.
              type="button" evita que ele se comporte como botão de envio de formulário. */}
          <button
            aria-label="Atualizar lista de animais"
            className="admin-icon-button"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            <RotateCw size={18} />
          </button>
          {/* Renderização condicional com ternário: se canCreate for verdadeiro, mostra o botão;
              senão, null (nada aparece). Assim só quem tem permissão vê "Cadastrar animal". */}
          {canCreate ? (
            <button className="admin-button is-primary" onClick={openCreateForm} type="button">
              {/* aria-hidden="true" esconde o ícone dos leitores de tela (é só decorativo). */}
              <Plus aria-hidden="true" size={18} />
              Cadastrar animal
            </button>
          ) : null}
        </div>
      </div>

      {/* ===== FORMULÁRIO DE FILTROS =====
          onSubmit={applyFilters}: ao clicar em "Filtrar" (ou Enter), chama applyFilters.
          Todos os campos abaixo são "controlados": o valor (value) vem do estado draft
          e cada mudança (onChange) atualiza o draft via setDraftValue. */}
      <form className="admin-filters" onSubmit={applyFilters}>
        {/* Campo de busca por nome, com o ícone de lupa ao lado. */}
        <label className="admin-search">
          <Search aria-hidden="true" size={18} />
          {/* maxLength limita o texto a 120 caracteres.
              event.target.value é o texto atual do campo, lido a cada tecla.
              "draft.q || ''" garante uma string (um input controlado não deve receber undefined). */}
          <input
            aria-label="Buscar por nome"
            maxLength="120"
            onChange={(event) => setDraftValue('q', event.target.value)}
            placeholder="Buscar por nome"
            value={draft.q || ''}
          />
        </label>

        {/* Filtro de status. */}
        <label>
          Status
          <select onChange={(event) => setDraftValue('status', event.target.value)} value={draft.status || ''}>
            {/* Opção com valor vazio = "sem filtro". */}
            <option value="">Todos</option>
            {/* Object.entries transforma o objeto animalStatusMap em uma lista de pares
                [chave, valor], ex.: ['disponivel', { label: 'Disponível', ... }].
                .map() cria uma <option> para cada par. A desestruturação ([value, status])
                separa o par em duas variáveis. "key" é obrigatória em listas no React:
                ajuda o React a identificar cada item ao atualizar a tela. */}
            {Object.entries(animalStatusMap).map(([value, status]) => (
              <option key={value} value={value}>{status.label}</option>
            ))}
          </select>
        </label>

        {/* Filtro de espécie: uma <option> para cada item de animalSpecies. */}
        <label>
          Espécie
          <select onChange={(event) => setDraftValue('especie', event.target.value)} value={draft.especie || ''}>
            <option value="">Todas</option>
            {animalSpecies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        {/* Filtro de porte. */}
        <label>
          Porte
          <select onChange={(event) => setDraftValue('porte', event.target.value)} value={draft.porte || ''}>
            <option value="">Todos</option>
            {animalSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        {/* Filtro de sexo. */}
        <label>
          Sexo
          <select onChange={(event) => setDraftValue('sexo', event.target.value)} value={draft.sexo || ''}>
            <option value="">Todos</option>
            {animalSexes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        {/* Idade mínima: campo numérico de 0 a 999.9 que aceita decimais (step="0.1"). */}
        <label>
          Idade mínima
          <input min="0" max="999.9" onChange={(event) => setDraftValue('idadeMin', event.target.value)} step="0.1" type="number" value={draft.idadeMin || ''} />
        </label>

        {/* Idade máxima: mesmas regras da idade mínima. */}
        <label>
          Idade máxima
          <input min="0" max="999.9" onChange={(event) => setDraftValue('idadeMax', event.target.value)} step="0.1" type="number" value={draft.idadeMax || ''} />
        </label>

        {/* Filtro de castração. Os valores são os TEXTOS "true"/"false", porque vão para a URL. */}
        <label>
          Castrado
          <select onChange={(event) => setDraftValue('castrado', event.target.value)} value={draft.castrado || ''}>
            <option value="">Todos</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>

        {/* Filtro de vacinação (mesma lógica do filtro de castração). */}
        <label>
          Vacinado
          <select onChange={(event) => setDraftValue('vacinado', event.target.value)} value={draft.vacinado || ''}>
            <option value="">Todos</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>

        {/* Botões do formulário de filtros. */}
        <div className="admin-filters-actions">
          {/* type="submit": clicar aqui envia o formulário e dispara applyFilters. */}
          <button className="admin-button" type="submit">
            <SlidersHorizontal aria-hidden="true" size={16} /> Filtrar
          </button>
          {/* "Limpar" só aparece quando há algum filtro aplicado na URL. */}
          {activeFilters ? <button className="admin-button is-ghost" onClick={clearFilters} type="button">Limpar</button> : null}
        </div>
      </form>

      {/* Erro de ações (salvar/mudar status/excluir). role="alert" faz o leitor de tela anunciar na hora. */}
      {actionError ? <p className="admin-alert is-error" role="alert">{actionError}</p> : null}

      {/* ===== ESTADOS DA LISTA =====
          Só um dos quatro blocos abaixo aparece por vez, de acordo com loading, error e items. */}

      {/* 1) Carregando. role="status" avisa o leitor de tela sem interromper o usuário. */}
      {loading ? (
        <div className="admin-state" role="status">
          <strong>Carregando animais</strong>
          <p>Aguarde enquanto consultamos o cadastro.</p>
        </div>
      ) : null}

      {/* 2) Terminou de carregar, mas deu erro: mostra a mensagem e um botão para tentar de novo. */}
      {!loading && error ? (
        <div className="admin-state is-error" role="alert">
          <strong>Não foi possível carregar os animais</strong>
          <p>{error}</p>
          {/* "Tentar novamente" aumenta retryCount → o useEffect busca a lista outra vez. */}
          <button className="admin-button is-primary" onClick={() => setRetryCount((count) => count + 1)} type="button">Tentar novamente</button>
        </div>
      ) : null}

      {/* 3) Carregou sem erro, mas a lista está vazia. A mensagem muda conforme há filtros ou não. */}
      {!loading && !error && items.length === 0 ? (
        <div className="admin-state">
          <strong>{activeFilters ? 'Nenhum animal encontrado' : 'Ainda não há animais cadastrados'}</strong>
          <p>{activeFilters ? 'Altere os filtros ou limpe a busca.' : 'Os animais cadastrados aparecerão nesta lista.'}</p>
          {activeFilters ? <button className="admin-button" onClick={clearFilters} type="button">Limpar filtros</button> : null}
        </div>
      ) : null}

      {/* 4) Carregou e há animais: mostra a tabela e a paginação. */}
      {!loading && !error && items.length > 0 ? (
        // <> ... </> é um "Fragment": agrupa vários elementos sem criar uma <div> extra no HTML.
        <>
          {/* Envolve a tabela para permitir rolagem horizontal em telas pequenas (via CSS). */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {/* aria-sort informa aos leitores de tela como a coluna está ordenada:
                      'ascending' (crescente), 'descending' (decrescente) ou 'none' (sem ordenação).
                      São dois ternários "aninhados": primeiro verifica se a ordenação é por nome;
                      se for, verifica a direção. */}
                  <th aria-sort={searchParams.get('sort') === 'nome' ? (searchParams.get('order') === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    {/* Clicar no título "Animal" ordena por nome. A seta mostra a direção:
                        para cima só quando a ordem atual é crescente por nome; senão, para baixo. */}
                    <button onClick={() => sortBy('nome')} type="button">Animal {searchParams.get('sort') === 'nome' && searchParams.get('order') === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button>
                  </th>
                  <th>Espécie</th>
                  <th>Idade</th>
                  <th>Porte</th>
                  <th>Status</th>
                  <th>Cuidados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* .map() percorre a lista de animais e cria uma linha (<tr>) para cada um.
                    Aqui a função usa chaves { } e "return" porque precisa calcular algo antes. */}
                {items.map((animal) => {
                  // Procura o rótulo e a cor do status no mapa. Se o status for desconhecido,
                  // usa o próprio valor como rótulo e a cor neutra 'muted' (evita quebrar a tela).
                  const status = animalStatusMap[animal.status] || { label: animal.status, variant: 'muted' };
                  return (
                    // key={animal.id}: identificador único da linha, exigido pelo React em listas.
                    <tr key={animal.id}>
                      {/* data-label é lido pelo CSS (content: attr(data-label)) para mostrar o nome
                          da coluna ao lado do valor quando a tabela vira "cartões" no celular. */}
                      <td data-label="Animal">
                        <span className="admin-cell-title">{animal.nome}</span>
                        {/* Mostra a raça ou, se não houver, um texto padrão. */}
                        <small>{animal.raca || 'Raça não informada'}</small>
                      </td>
                      {/* .find() procura na lista de espécies a que tem o mesmo "value" do animal
                          e pega o rótulo bonito (ex.: 'cachorro' → 'Cachorro'). Se não achar,
                          "?." evita erro e "||" mostra o valor cru. */}
                      <td data-label="Espécie">{animalSpecies.find((option) => option.value === animal.especie)?.label || animal.especie}</td>
                      {/* Idade formatada pela função formatAge (lá do começo do arquivo). */}
                      <td data-label="Idade">{formatAge(animal.idade_anos)}</td>
                      {/* Mesmo raciocínio da espécie, mas para o porte. */}
                      <td data-label="Porte">{animalSizes.find((option) => option.value === animal.porte)?.label || 'Não informado'}</td>
                      <td data-label="Status">
                        {/* Quem pode editar vê o "selo" (badge) + uma lista para trocar o status;
                            quem não pode, vê apenas o selo. */}
                        {canWrite ? (
                          <label className="admin-status-control">
                            {/* A classe muda conforme o status (ex.: is-available), o que muda a cor no CSS. */}
                            <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
                            {/* Ao escolher outro status, chama changeStatus com o animal e o novo valor. */}
                            <select
                              aria-label={`Alterar status de ${animal.nome}`}
                              onChange={(event) => changeStatus(animal, event.target.value)}
                              value={animal.status}
                            >
                              {/* Uma opção para cada status possível. */}
                              {Object.entries(animalStatusMap).map(([value, option]) => (
                                <option key={value} value={value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                        ) : <span className={`admin-badge is-${status.variant}`}>{status.label}</span>}
                      </td>
                      {/* Truque com arrays: "animal.castrado && 'Castrado'" vale 'Castrado' se for
                          verdadeiro, ou false se não for. .filter(Boolean) remove os valores falsos,
                          e .join(', ') junta o que sobrou (ex.: "Castrado, Vacinado").
                          Se não sobrar nada, o texto fica vazio e o "||" mostra 'Não informados'. */}
                      <td data-label="Cuidados">{[animal.castrado && 'Castrado', animal.vacinado && 'Vacinado'].filter(Boolean).join(', ') || 'Não informados'}</td>
                      <td data-label="Ações">
                        <div className="admin-row-actions">
                          {/* Botão "Editar" só para quem tem permissão de atualizar.
                              "() => openEditForm(animal)" cria uma função que só roda no clique;
                              escrever onClick={openEditForm(animal)} executaria na hora, por engano. */}
                          {canWrite ? <button aria-label={`Editar ${animal.nome}`} className="admin-button is-small" onClick={() => openEditForm(animal)} type="button">Editar</button> : null}
                          {/* Botão de excluir (ícone de lixeira) só para quem tem permissão de excluir. */}
                          {canDelete ? (
                            <button aria-label={`Excluir ${animal.nome}`} className="admin-icon-button is-small is-danger" onClick={() => removeAnimal(animal)} type="button">
                              <Trash2 aria-hidden="true" size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ===== PAGINAÇÃO ===== */}
          <div className="admin-pagination">
            {/* Math.max(totalPages, 1) evita mostrar "de 0" quando a API não informa páginas. */}
            <p>Página {currentPage} de {Math.max(totalPages, 1)}</p>
            <div>
              {/* "disabled" desabilita o botão: não dá para voltar antes da página 1... */}
              <button className="admin-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} type="button">Anterior</button>
              {/* ...nem avançar depois da última página. */}
              <button className="admin-button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} type="button">Próxima</button>
            </div>
          </div>
        </>
      ) : null}

      {/* ===== JANELA DO FORMULÁRIO (cadastro/edição) =====
          Só é renderizada quando formOpen é true. As props passam dados e funções para ela:
            - animal: o animal em edição (ou null para cadastro novo);
            - key: quando muda (de 'novo' para o id do animal recém-criado), o React descarta a
              janela antiga e cria uma nova do zero — assim o formulário reinicia em modo edição;
            - notice: aviso mostrado no topo do formulário;
            - onClose: ao fechar, esconde a janela e limpa o estado de edição;
            - onPhotosChanged: quando as fotos mudam, recarrega a lista;
            - onSubmit: a função saveAnimal, chamada ao enviar o formulário;
            - saving: indica se o envio está em andamento. */}
      {formOpen ? (
        <AnimalFormDialog
          animal={editingAnimal}
          key={editingAnimal?.id || 'novo'}
          notice={formNotice}
          onClose={() => { setFormOpen(false); setEditingAnimal(null); setFormNotice(''); }}
          onPhotosChanged={() => setRetryCount((count) => count + 1)}
          onSubmit={saveAnimal}
          saving={saving}
        />
      ) : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA, DO INÍCIO AO FIM:
 *   1. O AdminDashboardPage renderiza <AnimalsPage user={user} /> quando a aba "animais" é aberta.
 *   2. O componente cria seus estados (lista, paginação, carregando, erros, formulário,
 *      rascunho dos filtros) e calcula as permissões do usuário.
 *   3. Logo após aparecer na tela, o useEffect lê os filtros da URL e chama listAnimals()
 *      na API. Enquanto espera, mostra "Carregando animais".
 *   4. Quando a resposta chega, os animais vão para "items" e a paginação para "meta";
 *      o React redesenha a tela com a tabela (ou com a mensagem de lista vazia / de erro).
 *   5. O usuário mexe nos filtros → só o "draft" (rascunho) muda. Ao clicar em "Filtrar",
 *      applyFilters grava os filtros na URL → a URL mudou → o useEffect busca de novo.
 *      Paginação (setPage) e ordenação (sortBy) seguem o mesmo caminho: mudam a URL.
 *   6. Ações de escrita (salvar, mudar status, excluir) chamam a API e, se derem certo,
 *      aumentam retryCount — o que também faz o useEffect recarregar a lista.
 *   7. Ao cadastrar um animal novo, a janela continua aberta em modo edição (graças à
 *      mudança de "key") para que as fotos possam ser enviadas.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componentes funcionais e props no React.
 *   - useState (incluindo a inicialização com função e a atualização com função: set(x => ...)).
 *   - useEffect: lista de dependências, função de limpeza (cleanup) e como evitar
 *     "condição de corrida" com uma variável de controle (a variável "active").
 *   - Estado guardado na URL com useSearchParams / URLSearchParams (React Router).
 *   - Componentes controlados (value + onChange) e o padrão de "rascunho" de formulário.
 *   - async/await, Promises e try/catch/finally; relançar erros com throw.
 *   - Renderização condicional (ternário "? : null") e listas com .map() + "key".
 *   - A prop especial "key" para forçar o React a recriar um componente.
 *   - Recursos modernos do JavaScript: encadeamento opcional (?.), atribuição lógica (||=),
 *     spread (...), propriedades calculadas ([name]: value), desestruturação,
 *     template strings, Object.entries / Object.fromEntries, .some / .find / .filter / .join.
 *   - Recursão (changeStatus chama a si mesma para enviar o motivo).
 *   - Controle de acesso no front-end por permissões (lembrando que o backend também valida).
 *   - Acessibilidade: aria-label, aria-hidden, aria-sort, aria-labelledby, role="alert"/"status".
 *   - Internacionalização de números com Intl.NumberFormat.
 * ============================================================================
 */
