# Componentes — Home (`src/features/home`, `src/features/volunteers`)

---

## `LandingPage`

| | |
| --- | --- |
| Arquivo | `src/features/home/LandingPage.jsx` (default) + `LandingPage.css` |
| Para que serve | Página `/`: compõe as seções na ordem topo → números → vitrine → como funciona → doação → histórias → voluntariado |
| Props | nenhuma |
| Estado | `scrollProgress` (0–100), `showProgressBar` (`scrollY > 220`) |
| Hooks | `useAdoptionSteps()` → `steps`; `useAvailableAnimals()` → `{ pets, loading, error }` |
| Efeitos | (1) rola até o `#hash` da URL no primeiro quadro; (2) adiciona `.reveal` às classes `.home-head`/`.home-step` e `.is-visible` via `IntersectionObserver` (limiar 0,12), ou direto se "reduzir movimento" estiver ligado; (3) listener passivo de `scroll` para a barra de progresso |
| Usado em | `App` (rota `/`) |

Envolve tudo em `<MotionConfig reducedMotion="user">`, então as animações do Framer Motion respeitam a preferência do
sistema.

---

## `Hero`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/Hero/Hero.jsx` (default; também exporta `pickHighlight`) + `Hero.css` |
| Para que serve | Topo: título, texto, botões "Quero adotar" (`/adotar`) e "Quero doar" (`/doar`), link para `/como-funciona`, ilustração `assets/fundo.webp`, selo "N aguardando um lar" e cartão do animal em destaque |
| Estado | nenhum (o destaque é calculado) |
| Usado em | `LandingPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `pets` | `Pet[]` | não | `[]` | Animais disponíveis |

`pickHighlight(pets)` → primeiro urgente, senão o primeiro da lista, senão `null`. Animação de entrada com `motion.div`.

```jsx
<Hero pets={pets} />
```

### `HighlightThumb` (interno de `Hero.jsx`)

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `pet` | `Pet` | sim | Mostra `pet.image` ou, sem foto/erro, uma pata (`failed` em estado) |

---

## `StatsStrip`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/StatsStrip/StatsStrip.jsx` (default; exporta `anosDeAtuacao`) + `StatsStrip.css` |
| Para que serve | Faixa com 4 números: animais resgatados, adoções realizadas, aguardando um lar (da API) e anos de atuação (calculado de `ORGANIZACAO.fundacao`) |
| Props | nenhuma |
| Estado | `numeros` (resposta de `/public/stats`; `null` até chegar → "—"); `inView` (`useInView`, uma vez, 40%) |
| Efeitos | `buscarNumeros` com `AbortController`; erro é ignorado (mostra "—") |
| Usado em | `LandingPage` |

### `CountUp` (interno)

Conta de 0 até `value` em 1,4 s (easing cúbico) quando `inView`; com "reduzir movimento", mostra o valor final.

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `value` | number | sim | — | Valor final |
| `suffix` | string | não | `''` | Ex.: `' anos'` |
| `inView` | boolean | sim | — | Dispara a contagem |

---

## `PetSection`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/PetSection/PetSection.jsx` (export nomeado e default; exporta `pickShowcase`) + `PetSection.css` |
| Para que serve | Vitrine com até 4 animais (urgentes primeiro) e botão "Ver todos os N animais" |
| Estado | nenhum |
| Usado em | `LandingPage` (âncora `#adotar`) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `pets` | `Pet[]` | não | `[]` | Animais disponíveis |
| `loading` | boolean | não | `false` | Mostra "Carregando os animais…" |
| `error` | string \| null | não | `null` | Mensagem de erro (`role="alert"`) |

`pickShowcase(pets, size = 4)`: urgentes primeiro, mantendo a ordem da API em cada grupo.

```jsx
<PetSection pets={pets} loading={loading} error={error} />
```

---

## `HowItWorks`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/HowItWorks/HowItWorks.jsx` (default) + `HowItWorks.css` |
| Para que serve | Resumo das etapas numeradas (`01`, `02`…) e link "Ver requisitos e documentos" (`/como-funciona`) |
| Estado | nenhum |
| Usado em | `LandingPage` (âncora `#como-funciona`) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `steps` | `{ title: string, description: string }[]` | sim | — | Etapas de `useAdoptionSteps` (usa `title` como `key`) |

---

## `Donation`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/Donation/Donation.jsx` (default; exporta `donationPath`) + `Donation.css` |
| Para que serve | Seção "Doe": para onde vai o dinheiro, chave Pix (`PixKey inline`) e mini formulário (única/mensal + R$ 25/50/100/200/outro) que leva a `/doar?tipo=…&valor=…` |
| Props | nenhuma |
| Estado | `tipo` (padrão `'recorrente'`), `valor` (padrão `50`, ou `'outro'`) |
| Eventos | `submit` → `navigate(donationPath(tipo, valor))` |
| Usado em | `LandingPage` (âncora `#ajudar`) |

`donationPath('recorrente', 50)` → `"/doar?tipo=recorrente&valor=50"`.

---

## `Stories`

| | |
| --- | --- |
| Arquivo | `src/features/home/sections/Stories/Stories.jsx` (default) + `Stories.css` |
| Para que serve | Histórias publicadas: a primeira em destaque (foto + citação), até 2 em cartões menores. **Sem histórias, a seção não aparece** |
| Props | nenhuma |
| Estado | `stories` (lista convertida por `toStory`) |
| Efeitos | `buscarHistorias({ signal })` (`pageSize: 6`); erro ignorado |
| Usado em | `LandingPage` (âncora `#historias`) |

`toStory` usa `foto_url` da história ou, na falta, `animal.foto_url`; texto alternativo "Nome no novo lar".

### `StoryAuthor` (interno)

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `story` | `{ author: string, animalName: string \| null }` | sim | Mostra "Autor · adotou Nome" |

---

## `VolunteerSignup`

| | |
| --- | --- |
| Arquivo | `src/features/volunteers/VolunteerSignup/VolunteerSignup.jsx` (default) + `VolunteerSignup.css` |
| Para que serve | Formulário de inscrição de voluntário (nome, e-mail, telefone, áreas) com campo-armadilha `website` |
| Props | nenhuma |
| Estado | `form` (`{ nome, email, telefone, areas[] }`), `sending`, `error` (`{ message, details[] }`), `sent` (resposta com `protocolo`) |
| Eventos | `submit` → valida "ao menos uma área" → `enviarInscricaoVoluntario` → mensagem com protocolo e limpa o formulário |
| Usado em | `LandingPage` (âncora `#voluntariado`) |

Áreas vêm de `features/volunteers/volunteerAreas.js` (9 códigos aceitos pela API). Regras em
[11. Formulários](../11-formularios.md#inscrição-de-voluntário-volunteersignup).
