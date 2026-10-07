# Componentes — catálogo, perfil e adoção

---

## `AdoptionCatalog`

| | |
| --- | --- |
| Arquivo | `src/features/catalog/AdoptionCatalog.jsx` (default) + `AdoptionCatalog.css` |
| Para que serve | Página `/adotar` (detalhes em [4](../04-rotas-e-paginas.md#adotar--adoptioncatalog-srcfeaturescatalogadoptioncatalogjsx)) |
| Props | nenhuma |
| Hooks | `useSearchParams`, `useNavigate`, `useAvailableAnimals` (`pets, loading, error, reload`), `useFavorites` (`favoriteIds, isFavorite, toggleFavorite`) |
| Estado | `inputQuery` (texto digitado), `visibleCount` (lote atual, começa em 8), `drawerOpen`, `notice` (mensagem temporária de 4 s); `loadMoreRef` (sentinela do carregamento automático) |
| Derivados | `query`, `filters`, `sort` lidos da URL (`readCatalogParams`); `filteredPets` = `sortPets(filterPets(...))` com `useMemo`; `temperamentOptions` = `collectTemperaments(pets)` |
| Efeitos | Redireciona `?pet=<id>` para `/animais/<id>`; aplica a busca após 300 ms; sincroniza o campo quando a URL muda; volta ao 1º lote a cada mudança de critério; apaga o aviso após 4 s; `IntersectionObserver` (margem 260 px) carrega mais 8 |
| Eventos internos | `handleShare(pet)` (usa `sharePet` e mostra "Link … copiado" ou falha), `handleFavorite(pet)`, `clearSearchAndFilters()`, `updateCatalog(changes)` (grava na URL com `replace`) |
| Usado em | `App` |

---

## `FilterDrawer`

| | |
| --- | --- |
| Arquivo | `src/features/catalog/FilterDrawer/FilterDrawer.jsx` (export nomeado) + `FilterDrawer.css` |
| Para que serve | Gaveta lateral (`role="dialog"`, `aria-modal`) com todos os filtros: espécie, porte, idade (faixas), sexo, temperamento (só se houver traços), cuidados (castrado, vacinado) e "Mostrar apenas urgentes" |
| Estado | nenhum próprio (controlado pelo catálogo). `useDialog(onClose)` dá foco preso, Esc e trava de rolagem; `useId` para o título |
| Usado em | `AdoptionCatalog` (dentro de `AnimatePresence`, junto do fundo `drawer-overlay`) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `filters` | `Filters` (ver [9](../09-hooks-utils.md#catalogfilters--srcfeaturescatalogcatalogfiltersjs)) | sim | — | Estado atual |
| `setFilters` | `(next: Filters \| (cur => Filters)) => void` | sim | — | Aceita objeto ou função de atualização |
| `onClose` | `() => void` | sim | — | Fechar (botão X, Esc, "Ver N resultados") |
| `onClear` | `() => void` | sim | — | "Limpar filtros" |
| `resultCount` | number | sim | — | Texto do botão "Ver N resultados" |
| `temperamentOptions` | string[] | não | `[]` | Traços disponíveis |

```jsx
<FilterDrawer filters={filters} setFilters={setFilters} resultCount={12} temperamentOptions={['Calmo']} onClose={close} onClear={clear} />
```

---

## `FilterGroup`

| | |
| --- | --- |
| Arquivo | `src/features/catalog/FilterDrawer/FilterGroup.jsx` (export nomeado) |
| Para que serve | Contêiner de um grupo de filtros (`<div class="filter-group"><h3>label</h3>children</div>`) |
| Usado em | `FilterDrawer` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `label` | string | sim | Título do grupo |
| `children` | node | sim | Controles |

---

## `AnimalProfilePage`

| | |
| --- | --- |
| Arquivo | `src/features/animal-profile/AnimalProfilePage.jsx` (default) + `AnimalProfilePage.css` |
| Para que serve | Página `/animais/:id` |
| Props | nenhuma (lê `:id` com `useParams`) |
| Estado | `state` (`{ status: 'loading' \| 'ready' \| 'gone' \| 'missing' \| 'error', pet?, message? }`), `reloadKey`, `formOpen`, `shareMessage` |
| Efeitos | Busca o animal (cancela com `AbortController`); define `document.title = "Nome \| Patas em Casa"` |
| Eventos | "Quero adotar o/a Nome" → `formOpen`; "Compartilhar" → `sharePet` + mensagem (`shared`, `copied`, `failed`) |
| Usado em | `App` |

### `Gallery` (interno)

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `pet` | `Pet` | sim | Usa `pet.photos` e `pet.alt` |

Estado `current` (índice da foto). Sem fotos: quadro "Foto em breve". Com mais de uma: miniaturas clicáveis
(`aria-current` na atual).

---

## `AdoptionFormModal`

| | |
| --- | --- |
| Arquivo | `src/features/adoption/AdoptionFormModal/AdoptionFormModal.jsx` (export nomeado; exporta também `formatPhone`, `composeRotina`, `validateStep`) + `AdoptionFormModal.css` |
| Para que serve | Pedido de adoção em 3 passos (Seus dados → Seu lar e rotina → Visita e envio) e tela de confirmação com o protocolo |
| Estado | `form` (12 campos), `step` (0–2), `errors` (por campo), `pedido` (resposta da API), `enviando`, `erro` (`{ mensagem, detalhes, campos }`), `copied`; refs `formRef`, `stepTitleRef`, `firstRender` |
| Hooks | `useDialog(requestClose)`, dois `useId` |
| Comportamentos | Fechar com dados não enviados pede confirmação (`window.confirm`); ao trocar de passo, o foco vai ao título do passo; erros levam o foco ao primeiro campo inválido; erro da API num campo volta ao passo daquele campo; telefone formatado ao sair do campo; "Só eu" e "Não tenho" são opções exclusivas no grupo; campo-armadilha `website` |
| Usado em | `AnimalProfilePage` (dentro de `AnimatePresence`) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `pet` | `Pet` | sim | — | Animal pedido (envia `pet.id` como `animal_id`) |
| `onClose` | `() => void` | sim | — | Fecha o modal (depois do envio, sem confirmação) |

Campos, validações e mensagens: [11. Formulários](../11-formularios.md#pedido-de-adoção-adoptionformmodal).

```jsx
<AnimatePresence>{open ? <AdoptionFormModal pet={pet} onClose={() => setOpen(false)} /> : null}</AnimatePresence>
```

### `PetThumb` (interno)

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `pet` | `Pet` | sim | Miniatura no topo; sem foto ou com erro mostra uma pata (estado `failed`) |

### `FieldError` (interno)

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `id` | string | sim | Id referenciado por `aria-describedby` |
| `message` | string \| undefined | não | Sem mensagem, não renderiza |

---

## `HowAdoptionWorksPage`

| | |
| --- | --- |
| Arquivo | `src/features/adoption/HowAdoptionWorksPage.jsx` (default) + `HowAdoptionWorksPage.css` |
| Para que serve | Página `/como-funciona`: etapas (API), requisitos, documentos, dúvidas frequentes e chamada final |
| Props / estado | nenhum (usa `useAdoptionSteps`) |
| Usado em | `App` |

Os textos estão em `src/features/adoption/adoptionGuide.js`. ⚠️ A confirmar: o próprio arquivo avisa que idade mínima
(18 anos) e documentos são "os usuais" e que **a ONG deve confirmar antes de publicar**.
