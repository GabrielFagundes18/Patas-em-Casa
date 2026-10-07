# 10. Estilos e UI

## Sistema de estilos

- **CSS puro**, um arquivo por componente importado no próprio `.jsx` (`import './AnimalCard.css'`). Sem CSS Modules,
  Tailwind, Sass ou styled-components; o CRA junta tudo num CSS global no build.
- O escopo é feito por **prefixo de classe** por área: `home-*`, `catalog-*`, `filter-*`, `drawer-*`, `adopt-*`,
  `profile-*`, `how-*`, `donation-*`, `pix-*`, `animal-card-*`, `footer-*`, `admin-*`, `dashboard-*`.
- 25 arquivos CSS: `src/styles/globals.css` (base do site), `src/admin/styles/admin.css` (base do painel, 1.108 linhas),
  e um por componente/página.
- Sem tema escuro (`prefers-color-scheme` não é usado).

## Tokens (`:root` em `globals.css`)

| Grupo | Token | Valor |
| --- | --- | --- |
| Fundos | `--bg-primary` | `#f3efe6` (creme) |
| | `--bg-secondary` | `#e7dcc6` |
| | `--bg-card` | `#fffaf3` |
| | `--bg-glass` | `rgba(255,255,255,.42)` |
| Texto | `--text-main` | `#1f2a24` |
| | `--text-muted` | `#58675f` |
| | `--text-accent` | `#35564b` |
| Paleta | `--sage` / `--sage-dark` / `--sage-pale` | `#2f5a4b` / `#223d34` / `#edf4ee` (verde da marca; `theme-color`) |
| | `--amber` / `--amber-dark` / `--amber-light` | `#d88b3d` / `#b86d1d` / `#f2c48f` (ação) |
| | `--brick` / `--brick-dark` | `#b2614c` / `#9a4632` (urgente; texto branco com contraste AA) |
| | `--accent-glow` | `rgba(216,139,61,.17)` |
| Interface | `--border-color` | `rgba(31,42,36,.12)` |
| | `--shadow-main` | `0 26px 60px rgba(31,42,36,.12)` |
| | `--radius-md` / `--radius-lg` | `14px` / `24px` |
| Apelidos | `--bg`, `--paper`, `--ink`, `--ink-soft`, `--line` | Apontam para os tokens acima |

### Tokens do painel (`admin.css`, em `.admin-layout, .admin-login-page`)

Todos derivados dos tokens globais: `--admin-sidebar-bg` (sage-dark), `--admin-sidebar-active` (sage),
`--admin-surface` (bg-card), `--admin-surface-sunken`, `--admin-surface-strong`, `--admin-border`, `--admin-text`,
`--admin-text-muted`, `--admin-brand(-strong/-soft)`, `--admin-action(-strong/-glow)` (âmbar), `--admin-danger` (brick),
`--admin-focus` (amber-dark), `--admin-radius(-lg)`, `--admin-shadow(-soft)` e a paleta de gráficos
`--admin-series-1…5` (sage, amber, sage-dark, brick, bg-secondary).

## Tipografia

Fontes do Google Fonts importadas no topo de `globals.css` (`display=swap`):

| Fonte | Uso |
| --- | --- |
| Inter (400–700) | Texto do corpo (`body`) e do painel |
| Fraunces (serifada, 400–700, itálico 500) | Títulos do site |
| IBM Plex Mono (400–600) | Rótulos, selos, números, chave Pix |
| Work Sans (400–600) | ⚠️ Importada, mas nenhuma regra a usa |

## Breakpoints (`@media`)

Não há escala única de breakpoints: cada CSS define os seus. Ocorrências encontradas:

| Largura máxima | Ocorrências | Larguras máximas | Ocorrências |
| --- | ---: | --- | ---: |
| 1100px | 2 | 700px | 1 |
| 1024px | 2 | 640px | 5 |
| 960px | 1 | 600px | 1 |
| 900px | 4 (inclui o menu do painel, também no JS) | 560px | 5 |
| 860px | 3 | 480px | 2 |
| 820px | 3 | 420px | 1 |
| 760px | 3 | | |
| 720px | 1 | `prefers-reduced-motion: reduce` | 8 |

Largura de conteúdo do site: `.wrap { max-width: 1180px; padding: 0 24px }`.

## Componentes visuais reutilizáveis (classes)

| Classe | Onde é definida | Uso |
| --- | --- | --- |
| `.wrap`, `.section-head`, `.eyebrow` | `globals.css` | Contêiner, cabeçalho de seção e sobretítulo |
| `.btn`, `.btn-primary`, `.btn-secondary` | `globals.css` | Botões das páginas internas |
| `.catalog-primary-button`, `.catalog-secondary-button`, `.catalog-icon-button`, `.catalog-eyebrow` | `globals.css` | Botões do catálogo, gaveta e formulário de adoção |
| `.reveal`, `.reveal.is-visible` | `globals.css` | Animação de entrada da Home |
| `.route-loading` | `globals.css` | "Carregando..." do `Suspense` |
| `.skip-link` | `Header.css` | "Pular para o conteúdo" |
| `.public-page`, `.public-state(-actions)` | `PublicLayout.css` | Páginas internas e estados (404, carregando, erro) |
| `.home-btn--primary/--outline/--ghost`, `.home-eyebrow`, `.home-title`, `.home-lead` | `LandingPage.css` | Botões e títulos da Home |
| `.admin-button` + `.is-primary/.is-danger/.is-ghost/.is-small` | `admin.css` | Botões do painel |
| `.admin-badge.is-available/.is-pending/.is-success/.is-urgent/.is-muted` | `admin.css` | Selos de status (a variante vem dos mapas de `statusLabels.js`) |
| `.admin-alert.is-error/.is-success/.is-warning` | `admin.css` | Mensagens |
| `.admin-table`, `.admin-table-wrap` | `admin.css` | Tabelas; no celular as células usam `data-label` |
| `.admin-dialog(.is-wide)`, `.admin-form-grid`, `.admin-checks`, `.admin-fieldset`, `.admin-field-hint`, `.admin-required` | `admin.css` | Diálogos e formulários |
| `.admin-state`, `.admin-skeleton`, `.admin-pagination`, `.admin-filters`, `.admin-search`, `.admin-kpi(s)` | `admin.css` | Estados, filtros e cartões |
| `.admin-visually-hidden`, `.home-visually-hidden` | `admin.css`, CSS da Home | Texto só para leitores de tela |
| `.admin-card` | `globals.css` (`width: min(700px, 100%)`) | ⚠️ Regra herdada de um modal antigo que também limita cartões do painel; mantida de propósito (ver [14](14-pontos-de-atencao.md)) |

## Acessibilidade na UI

- Link "Pular para o conteúdo" em todas as páginas públicas; `lang="pt-BR"`.
- Estados de foco visíveis (`:focus-visible` aparece em 22 regras).
- `prefers-reduced-motion` respeitado no CSS (8 regras) e no JS (`MotionConfig reducedMotion="user"`,
  `useReducedMotion`, checagem antes do `IntersectionObserver`).
- Diálogos com foco preso e Esc (`useDialog`; `<dialog>` nativo no painel); gaveta do menu do painel com foco preso.
- Gráficos com alternativa em texto (`aria-label`, tabelas ocultas).
- Formulários com `label`, `aria-invalid`, `aria-describedby` e mensagens por campo.

## Ícones e imagens

Ícones: `lucide-react` (ex.: `PawPrint`, `Heart`, `Search`, `X`). Imagens: `src/assets/fundo.webp` (topo da Home,
`fetchPriority="high"`, 1400×763), `public/favicon.svg`. Fotos dos animais vêm da API (`/uploads/...` ou URL externa)
com `loading="lazy"` nos cartões e alternativa "Foto em breve".
