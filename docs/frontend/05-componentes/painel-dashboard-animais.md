# Componentes — painel: visão geral e animais

---

## `DashboardOverview`

| | |
| --- | --- |
| Arquivo | `src/admin/dashboard/DashboardOverview.jsx` (default) + `DashboardOverview.css` |
| Para que serve | Seção "Visão geral": destaque "Animais sob cuidado" com mini-números e busca de animal; 4 cartões (adoções no mês, arrecadado no mês, pedidos pendentes, animais urgentes) com sparklines; pizza de pedidos por status; medidores de vacinados/castrados/adotados; pizza de doações por método; barras mensais (fonte e período escolhíveis); pedidos novos; animais urgentes; agenda (visitas, entrevistas, termos pendentes) com filtro e exportação CSV |
| Props | nenhuma |
| Estado | `summary`, `loading`, `error`, `animalQuery`, `monthlySource` (`doacoes_total` \| `doacoes_quantidade` \| `adocoes`), `monthlyPeriod` (`'6'` \| `'12'`), `agendaType` (`''` \| `visita` \| `entrevista` \| `termo_pendente`) |
| Efeitos | Carrega ao abrir e **a cada 60 s** (`setInterval`); "Atualizar" chama com `fresh: true` (`?atualizar=true`) |
| Eventos | Busca de animal → `navigate('/admin/animais?q=…')`; "Exportar" → `exportAgenda(rows)` gera CSV (`;`, BOM) no navegador |
| Usado em | `AdminDashboardPage` (aba padrão) |

Rótulos de mês usam fuso UTC (`monthLabel`). Os dados vêm de `GET /dashboard/summary` (formato na documentação do
back-end).

---

## Gráficos (`src/admin/dashboard/DashboardCharts.jsx`)

Gráficos próprios em CSS/SVG (sem biblioteca), com alternativa em texto para leitores de tela; cores via
`seriesColor(n)` → `var(--admin-series-n)`. Todos são exports nomeados, usados só em `DashboardOverview`.

### `Sparkline`

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `values` | number[] | sim | — | Série (com menos de 2 valores, não renderiza) |
| `series` | number (1–5) | não | `1` | Cor |

SVG `aria-hidden` com `polyline` normalizada pelo máximo.

### `PieChart`

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `items` | `{ key, label, value: number, series }[]` | sim | Fatias |
| `label` | string | sim | Base do `aria-label` (`role="img"`) |

`conic-gradient` com total no centro e legenda (rótulo, quantidade, %).

### `Gauge`

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `label` | string | sim | — | Ex.: "Vacinados" |
| `value` | number (0–100) | sim | — | Percentual |
| `detail` | string | não | — | Ex.: "12 animais" |
| `series` | number | não | `1` | Cor |

### `MonthlyBars`

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `rows` | `{ key, label, value: number }[]` | sim | — | Meses |
| `formatValue` | `(n) => string` | sim | — | Texto sobre a barra e na tabela |
| `caption` | string | sim | — | Legenda da tabela oculta |
| `series` | number | não | `1` | Cor |

Ref `columnsRef`: no celular rola até os meses mais recentes. Tabela `admin-visually-hidden` como alternativa.

```jsx
<MonthlyBars rows={[{ key: '2026-09', label: 'set', value: 1200 }]} formatValue={formatCurrency} caption="Doações (R$) por mês" series={1} />
```

---

## `AnimalsPage`

| | |
| --- | --- |
| Arquivo | `src/admin/animals/AnimalsPage.jsx` (default) |
| Para que serve | Seção "Animais": filtros, tabela, ordenação por nome, cadastro/edição, mudança de status inline, exclusão |
| Estado | `items`, `meta`, `loading`, `error`, `retryCount`, `editingAnimal`, `formOpen`, `formNotice`, `saving`, `actionError`, `draft` (filtros digitados antes de "Filtrar") |
| Efeitos | `listAnimals(params da URL)` quando a URL muda (não usa `usePaginatedList`) |
| Eventos internos | `applyFilters`, `clearFilters`, `setPage`, `sortBy('nome')` (alterna asc/desc), `saveAnimal` (criar mantém o diálogo aberto em modo edição para enviar fotos), `changeStatus(animal, status, motivo?)` (com `MOTIVO_OBRIGATORIO`, pede o motivo por `window.prompt` e tenta de novo), `removeAnimal` (`window.confirm`) |
| Permissões | `animals:create` (botão Cadastrar), `animals:update` (editar e select de status), `animals:delete` (excluir) |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

Filtros na URL: `q`, `status`, `especie`, `sexo`, `porte`, `castrado`, `vacinado`, `idadeMin`, `idadeMax`, `sort`,
`order`, `page`, `pageSize` (20).

---

## `AnimalFormDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/animals/AnimalFormDialog.jsx` (default) |
| Para que serve | Cadastro e edição do animal; na edição mostra a galeria `AnimalPhotos` |
| Estado | `form` (13 campos, iniciado por `createForm(animal)`), `error` |
| Eventos | `submit` → `onSubmit(payload)` com `idade_anos` numérico ou `null`, vazios → `null`, `temperamento` separado por vírgula e sem repetição (`parseTraits`) |
| Usado em | `AnimalsPage` (com `key` = id ou `'novo'` para reiniciar o formulário) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `animal` | objeto da API \| null | não | — | Com valor = edição |
| `notice` | string | não | — | Aviso de sucesso no topo (ex.: "X foi cadastrado. Agora envie as fotos.") |
| `saving` | boolean | não | — | Desabilita o botão |
| `onClose` | `() => void` | sim | — | Cancelar / fechar |
| `onSubmit` | `(payload) => Promise` | sim | — | Salvar (erros são mostrados no diálogo) |
| `onPhotosChanged` | `() => void` | não | — | Chamado após mudar fotos (a lista recarrega) |

Campos e validações em [11. Formulários](../11-formularios.md#animal-animalformdialog).

---

## `AnimalPhotos`

| | |
| --- | --- |
| Arquivo | `src/admin/animals/AnimalPhotos.jsx` (default) |
| Para que serve | Galeria do animal no painel: enviar fotos (JPG/PNG/WebP, até 12 no total), escolher a principal, remover |
| Estado | `photos` (`null` = carregando), `busy`, `error`; `inputRef` |
| Efeitos | `getAnimal(animalId)` ao abrir |
| Eventos | Upload → `uploadAnimalPhotos`; estrela → `setMainAnimalPhoto`; lixeira → `deleteAnimalPhoto` (**sem confirmação**); depois de cada ação chama `onChanged(animalAtualizado)` |
| Usado em | `AnimalFormDialog` (só na edição) |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `animalId` | string (UUID) | sim | Animal |
| `animalName` | string | sim | Usado no texto alternativo das fotos |
| `onChanged` | `(animal) => void` | não | Recebe o animal com `foto_url` atualizado |
