# Componentes — aplicação e layout público

Convenções desta seção: o projeto não usa PropTypes nem TypeScript, então os **tipos das props são inferidos do uso**.
`Pet` é o objeto produzido por `mapPetFromApi` (campos em [modelo-dados.md](../engenharia/modelo-dados.md#pet-modelo-da-interface)).
"Eventos" = callbacks recebidos por props; "estado" = `useState`/`useRef` internos.

---

## `App`

| | |
| --- | --- |
| Arquivo | `src/app/App.js` (default) |
| Para que serve | Declara todas as rotas e o `Suspense` das páginas lazy do painel |
| Props | nenhuma |
| Estado | nenhum. Constante `ADMIN_TABS` (7 abas) gera as rotas `/admin/<aba>` |
| Eventos | — |
| Usado em | `src/index.js` (dentro de `React.StrictMode` e `BrowserRouter`) |

```jsx
<BrowserRouter><App /></BrowserRouter>
```

Importa `styles/globals.css` (também importado em `index.js` — ver [14](../14-pontos-de-atencao.md)).

---

## `PublicLayout`

| | |
| --- | --- |
| Arquivo | `src/shared/components/layout/PublicLayout/PublicLayout.jsx` (export nomeado) + `PublicLayout.css` |
| Para que serve | Moldura das páginas internas: link "Pular para o conteúdo", `Header`, `<main id="main-content" class="public-page …">`, `Footer` |
| Estado / eventos | — |
| Usado em | `AdoptionCatalog`, `AnimalProfilePage`, `HowAdoptionWorksPage`, `DonationPage`, `DonationReturnPage`, `CancelSubscriptionPage`, `NotFoundPage` (a Home monta a mesma estrutura à mão) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `children` | node | sim | — | Conteúdo da página |
| `className` | string | não | `''` | Classe extra no `<main>` (ex.: `catalog-page`) |

```jsx
<PublicLayout className="donation-page"><section>…</section></PublicLayout>
```

---

## `Header`

| | |
| --- | --- |
| Arquivo | `src/shared/components/layout/Header/Header.jsx` (default) + `Header.css` |
| Para que serve | Cabeçalho do site: logo, menu (Adotar, Como funciona, Doar, Histórias, Voluntariado), botão "Quero adotar" e gaveta no celular |
| Props | nenhuma |
| Estado | `isOpen` (gaveta móvel aberta), `scrolled` (`scrollY > 20` → classe `scrolled`) |
| Efeitos | Listener passivo de `scroll` |
| Usado em | `LandingPage`, `PublicLayout` |

Itens do menu em `navLinks`; âncoras da Home (`/#…`) viram `<a>` e páginas viram `<Link>` (componente interno `NavItem`).
O botão da gaveta tem `aria-expanded`, `aria-controls="mobileDrawer"` e rótulo "Abrir/Fechar menu".

```jsx
<Header />
```

### `NavItem` (interno de `Header.jsx`)

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `link` | `{ href: string, label: string }` | sim | — | Destino e texto |
| `onClick` | `() => void` | não | — | Usado na gaveta móvel para fechá-la ao navegar |

---

## `Footer`

| | |
| --- | --- |
| Arquivo | `src/shared/components/layout/Footer/Footer.jsx` (default) + `Footer.css` |
| Para que serve | Rodapé: marca, fundação, CNPJ, links "Adote"/"Ajude", contatos de `ORGANIZACAO`, ano atual e "Área da equipe" (`/admin/login`) |
| Props / estado | nenhum |
| Usado em | `LandingPage`, `PublicLayout` |

### `FooterLink` (interno de `Footer.jsx`)

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `link` | `{ label: string, to?: string, href?: string }` | sim | — | Com `href` vira `<a>` (âncora da Home); com `to`, `<Link>` |

---

## `NotFoundPage`

| | |
| --- | --- |
| Arquivo | `src/app/NotFoundPage.jsx` (default) |
| Para que serve | Página 404 com links para `/adotar` e `/` |
| Props / estado | nenhum |
| Usado em | `App` (rota `*`) |
