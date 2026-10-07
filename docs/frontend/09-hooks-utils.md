# 9. Hooks, utils e helpers

## Hooks

### `useAvailableAnimals()` — `src/shared/hooks/useAvailableAnimals.js`

| | |
| --- | --- |
| O que faz | Busca todos os animais disponíveis (`buscarTodoAnimais`) e converte com `mapPetsFromApi`; cancela ao desmontar |
| Parâmetros | — |
| Retorno | `{ pets: Pet[], loading: boolean, error: string \| null, reload: () => void }` |
| Erro | `pets: []`, `error: 'Não foi possível carregar os animais agora.'` |
| Usado em | `LandingPage`, `AdoptionCatalog` |

```js
const { pets, loading, error, reload } = useAvailableAnimals();
```

### `useAdoptionSteps()` — `src/shared/hooks/useAdoptionSteps.js`

| | |
| --- | --- |
| O que faz | Começa com `defaultSteps` (4 etapas genéricas) e troca pelas da API (`buscarEtapasAdocao`) se vierem não vazias; erro mantém as padrão |
| Retorno | `{ title: string, description: string }[]` |
| Exporta | `defaultSteps` (cada etapa tem também `icon`, ⚠️ não usado por nenhum componente) |
| Usado em | `LandingPage` (→ `HowItWorks`), `HowAdoptionWorksPage` |

### `useDialog(onClose)` — `src/shared/hooks/useDialog.js`

| | |
| --- | --- |
| O que faz | Comportamento de diálogo modal no elemento que recebe a ref: foca o primeiro controle, Esc chama `onClose`, Tab circula dentro do diálogo, trava a rolagem do `body` (com contador para diálogos sobrepostos) e devolve o foco ao fechar |
| Parâmetros | `onClose: () => void` (a versão mais recente é sempre usada, via ref) |
| Retorno | `ref` para o elemento do diálogo |
| Usado em | `FilterDrawer`, `AdoptionFormModal` (o painel usa `<dialog>` nativo em `AdminDialog`) |

```jsx
const dialogRef = useDialog(onClose);
return <section ref={dialogRef} role="dialog" aria-modal="true">…</section>;
```

### `useFavorites()` — `src/features/catalog/useFavorites.js`

| | |
| --- | --- |
| O que faz | Lista de ids favoritos em `localStorage['patas:favoritos']`; sincroniza entre abas pelo evento `storage`; leitura/escrita protegidas |
| Retorno | `{ favoriteIds: string[], isFavorite(id): boolean, toggleFavorite(id): void }` (`toggleFavorite` ignora id vazio) |
| Usado em | `AdoptionCatalog` |

### `usePaginatedList(loader, fallbackError)` — `src/admin/shared/usePaginatedList.js`

| | |
| --- | --- |
| O que faz | Lista paginada do painel com filtros na URL: lê `searchParams`, garante `page=1` e `pageSize=20`, chama `loader(params)`, guarda `items`/`meta` e trata erro |
| Parâmetros | `loader: (params) => Promise<{ items, meta }>` (função estável, ex.: um serviço importado); `fallbackError: string` |
| Retorno | `{ items, meta, loading, error, filters, setFilter(name, value), setPage(page), reload() }` — `setFilter` apaga o parâmetro se vazio e volta à página 1 |
| Exporta | `ADMIN_PAGE_SIZE = 20`, `errorMessage(error, fallback)` |
| Usado em | `AdoptionsPage`, `AdoptersPage`, `DonationsPage`, `StoriesPage`, `VolunteersPage`, `TeamPage` (não em `AnimalsPage`, que repete a lógica) |

```js
const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(listTeam, 'Não foi possível carregar a equipe.');
```

### `usePanelSubmit(onConfirm)` — interno de `AdoptionDetailDialog.jsx`

Retorna `{ saving, error, submit(payload) }` para os painéis de ação do pedido de adoção.

---

## Utils

### `petMapper` — `src/shared/utils/petMapper.js`

| Função | Parâmetros | Retorno | Observações |
| --- | --- | --- | --- |
| `mapPetFromApi(petApi)` | animal da API | `Pet` (ver [modelo-dados](engenharia/modelo-dados.md#pet-modelo-da-interface)) | Traduz códigos (`cachorro` → "Cachorro"; espécie desconhecida → "Outro"; porte/sexo desconhecidos → `null`); raça vazia → "SRD"; idade texto ou número; data só AAAA-MM-DD; galeria com a foto principal ou `foto_url` |
| `mapPetsFromApi(lista)` | array | `Pet[]` | Não-array → `[]` |
| `formatarIdade(anos)` | number \| null | string | `0.4` → "5 meses"; `1.5` → "1 ano e 6 meses"; `< 1 mês` → "Menos de 1 mês"; `null` → `''` |

### `petText` — `src/shared/utils/petText.js`

| Função | Parâmetros | Retorno | Exemplo |
| --- | --- | --- | --- |
| `artigo(pet)` | `Pet` | `'a'` (fêmea) ou `'o'` | "Conhecer a Mel" |
| `especieDoAnimal(pet)` | `Pet` | "Cachorra"/"Gata" para fêmeas; senão a espécie | |
| `concordar(pet, palavra)` | `Pet`, string | troca o `o` final por `a` para fêmeas | "Castrada" |
| `tempoDeEspera(entryDate, hoje = new Date())` | `'AAAA-MM-DD'` | "Chegou hoje", "Chegou há 12 dias", "Esperando há 3 meses", "Esperando há 1 ano e 2 meses" ou `null` (sem data/data futura) | Conta meses de calendário |

### `sharePet` — `src/shared/utils/sharePet.js`

| Função | Parâmetros | Retorno |
| --- | --- | --- |
| `buildPetUrl(pet)` | `Pet` | URL absoluta `/animais/<id>` (ou `/adotar`) na origem atual |
| `sharePet(pet)` | `Pet` | `Promise<{ status: 'shared' \| 'copied' \| 'cancelled' \| 'failed', url }>` — tenta `navigator.share`, depois a área de transferência |

### `catalogFilters` — `src/features/catalog/catalogFilters.js`

Tipo `Filters`: `{ species: string[], size: string[], sex: string[], ages: string[], temperament: string[], castrado: boolean, vacinado: boolean, urgent: boolean, favorites: boolean }`.

| Exportação | Assinatura | O que faz |
| --- | --- | --- |
| `createInitialFilters()` | `() => Filters` | Filtros vazios (novas listas a cada chamada) |
| `ageGroupOf(anos)` | `number \| null => 'filhote' \| 'jovem' \| 'adulto' \| 'idoso' \| null` | Faixa de idade (`[0,1)`, `[1,3)`, `[3,8)`, `[8,∞)`) |
| `collectTemperaments(pets)` | `Pet[] => string[]` | Traços existentes, do mais comum ao menos (ignora acento/maiúscula) |
| `filterPets(pets, query, filters, { favoriteIds })` | → `Pet[]` | Busca (nome, raça, meta, traços; sem acento) + todos os filtros; temperamento exige **todos** os traços |
| `sortPets(pets, sort)` | `sort: 'urgent' \| 'waiting' \| 'recent' \| 'name'` | Não muda a lista original; padrão: urgentes, depois quem espera há mais tempo, depois nome |
| `QUICK_FILTERS` | constante | Cães, Gatos, Urgentes, Filhotes, Porte pequeno |
| `isFilterOn(filters, { key, value })` | → boolean | Critério ligado? |
| `toggleFilter(filters, { key, value })` | → `Filters` | Liga/desliga um critério |
| `getActiveFilterChips(filters)` | → `{ key, value?, label }[]` | Chips removíveis |
| `removeFilter(filters, chip)` | → `Filters` | Remove só o critério do chip |
| `readCatalogParams(searchParams)` | → `{ query, filters, sort }` | Lê a URL; valores desconhecidos são ignorados; até 10 traços |
| `writeCatalogParams({ query, filters, sort })` | → `URLSearchParams` | Escreve só o que difere do padrão (`especie=gato,cachorro`, `urgente=1`, `ordem=espera`…) |

Constantes em `catalogOptions.js`: `PAGE_SIZE = 8`, `speciesOptions`, `sizeOptions`, `sexOptions`, `AGE_GROUPS`, `SORT_OPTIONS`.

### `downloadFile(content, fileName, type)` — `src/admin/shared/downloadFile.js`

Cria um Blob (se `content` ainda não for), um link temporário e dispara o download. Usado na exportação de adotantes
(CSV) e dos dados do titular (JSON).

### Formatadores e mapas — `src/admin/constants/statusLabels.js`

| Exportação | O que faz |
| --- | --- |
| `statusOf(map, value)` | `{ label, variant, series }` do valor, ou `{ label: value \|\| '—', variant: 'muted', series: 5 }` |
| `seriesColor(n)` | `var(--admin-series-n)` (padrão 5) |
| `formatDate(value)` | `AAAA-MM-DD` → `DD/MM/AAAA` sem fuso; timestamp → data curta em `America/Sao_Paulo`; inválido → "—" |
| `formatDateTime(value)` | Data e hora curtas em `America/Sao_Paulo` |
| `formatCurrency(value)` | `R$ 1.234,56` |
| Mapas | `adoptionStatusMap`, `priorityMap`, `donationStatusMap`, `subscriptionStatusMap`, `adopterStatusMap`, `appointmentStatusMap`, `volunteerStatusMap` (`{ label, variant, series? }`); `appointmentTypeLabels`, `donationTypeLabels`, `donationMethodLabels`, `donationMethodSeries`, `volunteerAreaLabels` |

### Funções puras exportadas por componentes

| Função | Arquivo | O que faz |
| --- | --- | --- |
| `pickHighlight(pets)` | `Hero.jsx` | Primeiro urgente, senão o primeiro |
| `pickShowcase(pets, size = 4)` | `PetSection.jsx` | Urgentes primeiro, até `size` |
| `anosDeAtuacao(hoje = new Date())` | `StatsStrip.jsx` | Ano atual − `ORGANIZACAO.fundacao` |
| `donationPath(tipo, valor)` | `Donation.jsx` | `/doar?tipo=…&valor=…` |
| `formatPhone(valor)` | `AdoptionFormModal.jsx` | 10–11 dígitos → `(11) 98888-7777`; outros ficam como digitados |
| `composeRotina(form)` | `AdoptionFormModal.jsx` | Junta as respostas do passo 2 no texto `rotina` (ordem fixa) |
| `validateStep(step, form)` | `AdoptionFormModal.jsx` | Erros por campo do passo |
| `generatePassword()` | `TeamMemberDialog.jsx` | Senha de 14 caracteres com letra e número |
| `redirectTo.go(url)` | `DonationPage.jsx` | `window.location.assign` (objeto trocável nos testes) |
| `POLL_INTERVAL_MS.value` | `DonationReturnPage.jsx` | 3000 (objeto trocável nos testes) |

### Constantes de conteúdo

| Arquivo | Conteúdo |
| --- | --- |
| `shared/constants/organization.js` | `ORGANIZACAO` (nome, fundação 2019, e-mail, telefone, endereço, horário, Instagram, Pix, CNPJ). ⚠️ O próprio arquivo diz que telefone, endereço e CNPJ **são valores de exemplo** |
| `features/adoption/adoptionGuide.js` | `ADOPTION_REQUIREMENTS`, `ADOPTION_DOCUMENTS`, `ADOPTION_FAQ` |
| `features/volunteers/volunteerAreas.js` | `VOLUNTEER_AREAS` (9 áreas) |
| `admin/constants/adminNavigation.js` | `roleLabels`, `adminNavigationGroups`, `adminSections` |
| `admin/constants/animalOptions.js` | `animalSpecies`, `animalSexes`, `animalSizes`, `animalStatusMap`, `animalPageSize = 20` |
