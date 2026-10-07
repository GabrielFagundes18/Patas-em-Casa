# 3. Estrutura de pastas

## Árvore completa

Sem `node_modules/`, `build/` e `.git/`. Entre parênteses, a função de cada pasta.

```text
Patas-em-Casa/
├── .env.example                  # Modelo de variáveis (REACT_APP_API_URL)
├── .gitignore
├── jsconfig.json                 # baseUrl "src": imports absolutos (import x from 'shared/...')
├── package.json / package-lock.json
├── README.md                     # README do repositório (partes desatualizadas: ver seção 14)
├── docs/frontend/                # Esta documentação
├── public/                       # (arquivos servidos como estão)
│   ├── index.html                # HTML único da SPA: lang pt-BR, título, descrição, theme-color, <div id="root">
│   └── favicon.svg               # Pata branca sobre fundo verde
└── src/
    ├── index.js                  # Ponto de entrada: createRoot, StrictMode, BrowserRouter, globals.css
    ├── setupTests.js             # jest-dom + polyfills de <dialog> e Web Crypto para o jsdom
    ├── app/                      # (composição da aplicação)
    │   ├── App.js                # Todas as rotas; carga sob demanda (lazy) do painel
    │   ├── App.test.js
    │   └── NotFoundPage.jsx      # 404
    ├── api/                      # (cliente HTTP e chamadas públicas)
    │   ├── client.js             # Instância Axios, token, renovação de sessão, evento de sessão expirada
    │   ├── animals.js            # Catálogo e perfil público
    │   ├── adoptions.js          # Pedido de adoção
    │   ├── content.js            # Números, histórias e etapas da Home
    │   ├── donations.js          # Doação online, status, cancelamento
    │   └── volunteers.js         # Inscrição de voluntário
    ├── assets/
    │   └── fundo.webp            # Ilustração do topo da Home (1400×763)
    ├── styles/
    │   └── globals.css           # Fontes, tokens de cor (:root), reset, botões e utilitários do site
    ├── shared/                   # (reutilizado por mais de uma funcionalidade do site)
    │   ├── components/
    │   │   ├── AnimalCard/       # Cartão do animal (Home e catálogo)
    │   │   ├── PetPhoto/         # Foto com alternativa "Foto em breve"
    │   │   ├── PixKey/           # Chave Pix com botão copiar
    │   │   └── layout/           # Header, Footer, PublicLayout
    │   ├── constants/organization.js   # Dados públicos da ONG (contato, Pix, CNPJ, fundação)
    │   ├── hooks/                # useAvailableAnimals, useAdoptionSteps, useDialog
    │   └── utils/                # petMapper, petText, sharePet (+ testes)
    ├── features/                 # (uma pasta por funcionalidade do site público)
    │   ├── home/                 # LandingPage + sections/{Hero, StatsStrip, PetSection, HowItWorks, Donation, Stories}
    │   ├── catalog/              # AdoptionCatalog, FilterDrawer/, catalogFilters, catalogOptions, useFavorites
    │   ├── animal-profile/       # AnimalProfilePage
    │   ├── adoption/             # AdoptionFormModal/, HowAdoptionWorksPage, adoptionGuide
    │   ├── donation/             # DonationPage, DonationReturnPage, CancelSubscriptionPage
    │   └── volunteers/           # VolunteerSignup/, volunteerAreas
    └── admin/                    # (painel administrativo; baixado só em /admin)
        ├── AdminDashboardPage.jsx    # Página única do painel: valida a sessão e escolhe a seção pela rota
        ├── constants/            # adminNavigation (menu, rótulos de cargo), animalOptions, statusLabels (+ formatadores)
        ├── layout/               # AdminLayout (menu lateral, barra superior, ajuda)
        ├── security/             # Login, esqueci a senha, redefinir senha, RequireAdminSession, authService
        ├── shared/               # AdminDialog, FormError, ListState, Pagination, SearchField, usePaginatedList, downloadFile
        ├── styles/admin.css      # Tokens --admin-* e componentes visuais do painel
        ├── dashboard/            # DashboardOverview, DashboardCharts, dashboardService
        ├── animals/              # AnimalsPage, AnimalFormDialog, AnimalPhotos, animalService
        ├── adoptions/            # AdoptionsPage, AdoptionDetailDialog, adoptionService
        ├── adopters/             # AdoptersPage, AdopterDetailDialog, adopterService
        ├── donations/            # DonationsPage, DonationFormDialog, SubscriptionsSection, donationService
        ├── stories/              # StoriesPage, StoryFormDialog, storyService
        ├── volunteers/           # VolunteersPage, VolunteerFormDialog, volunteerService
        └── team/                 # TeamPage, TeamMemberDialog, ResetPasswordDialog, teamService
```

## Arquivos por pasta (contagem)

| Pasta | JS/JSX (sem testes) | CSS | Testes | Outros |
| --- | ---: | ---: | ---: | ---: |
| raiz + `public/` | — | — | — | 8 (`package.json`, lock, `jsconfig.json`, `.env.example`, `.gitignore`, `README.md`, `index.html`, `favicon.svg`) |
| `src/` (raiz) | 2 (`index.js`, `setupTests.js`) | — | — | — |
| `src/app` | 2 | — | 1 | — |
| `src/api` | 6 | — | — | — |
| `src/assets` | — | — | — | 1 |
| `src/styles` | — | 1 | — | — |
| `src/shared` | 13 | 6 | 2 | — |
| `src/features` | 22 | 14 | 7 | — |
| `src/admin` | 45 | 4 | 11 | — |
| **Total (145)** | **90** | **25** | **21** | **9** |

Esta pasta `docs/frontend/` não entra na contagem (é a documentação).

## Convenções

| Tema | Convenção observada |
| --- | --- |
| Organização | **Por funcionalidade** (`features/<funcionalidade>`, `admin/<módulo>`); o que serve a mais de uma vai para `shared/` (site) ou `admin/shared/` (painel) |
| Imports | Absolutos a partir de `src/` (`import api from 'api/client'`), graças ao `jsconfig.json`; relativos (`./`) só dentro da mesma pasta |
| Componentes | `PascalCase.jsx`; um componente principal por arquivo; componentes auxiliares pequenos ficam no mesmo arquivo (ex.: `Gallery` em `AnimalProfilePage.jsx`) |
| Componentes com estilo | Pasta própria com `.jsx` + `.css` de mesmo nome (`AnimalCard/AnimalCard.jsx` + `AnimalCard.css`) |
| Exportação | Páginas e telas do painel: `export default`. Compartilhados do site: export nomeado (`export function AnimalCard`) e, em alguns, também default (`PetSection`) |
| Hooks | `useXxx.js` em `shared/hooks/`, ou junto da funcionalidade (`catalog/useFavorites.js`, `admin/shared/usePaginatedList.js`) |
| Serviços | Site: `api/<recurso>.js`, funções em português (`buscarAnimal`, `enviarPedidoAdocao`). Painel: `admin/<módulo>/<módulo>Service.js`, funções em inglês (`listAnimals`, `createDonation`) |
| Constantes | `camelCase.js` com exports em `UPPER_SNAKE` ou `camelCase` (`ORGANIZACAO`, `adminNavigationGroups`) |
| Testes | `*.test.js` ao lado do arquivo testado |
| CSS | Classes com prefixo por área: `home-*`, `catalog-*`, `adopt-*`, `profile-*`, `donation-*`, `admin-*`, `dashboard-*` (sem CSS Modules) |
| Comentários | Muitos arquivos começam com o bloco "O quê / Como / Para quê" |
| Idioma | Interface e comentários em português; nomes de componentes e funções do painel em inglês; do site, misto |
