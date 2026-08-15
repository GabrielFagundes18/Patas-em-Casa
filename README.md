# Patas em Casa

Site institucional de uma ONG de proteção animal, desenvolvido em React com foco em adoção responsável, campanhas de arrecadação e divulgação de impacto social.

O objetivo do projeto é apresentar a instituição como uma organização humana, confiável e acessível, com uma experiência visual moderna, limpa e emocionalmente conectada ao tema de bem-estar animal.

---

## 1) Visão geral do projeto

### Propósito

Este projeto funciona como uma landing page institucional para a ONG "Patas em Casa", com foco em:

- aumentar a visibilidade da organização;
- apresentar animais disponíveis para adoção;
- explicar como funciona o processo de adoção;
- incentivar doações por meio de PIX;
- reforçar a narrativa de impacto por meio de histórias e estatísticas;
- converter visitantes em adoção ou apoio financeiro/voluntário.

### Funcionalidades principais

- Hero com imagem de fundo e sobreposição de texto;
- navegação sticky com menu mobile;
- bloco de estatísticas com animação de contagem;
- galeria de pets com cards visuais e botões de ação;
- seção de "Como funciona" com etapas do processo de adoção;
- seção de doação via PIX com botão de cópia da chave;
- histórias de impacto com imagens e depoimentos;
- rodapé institucional com contato e navegação;
- foco em acessibilidade, contraste e comportamento responsivo.

### Stack utilizada

- React 19
- Create React App
- Framer Motion para microanimações e reveals;
- lucide-react para ícones modernos e consistentes;
- React Router DOM (presente na estrutura como dependência e potencial para evoluções futuras, embora a aplicação atual funcione como landing page SPA sem rotas ativas complexas);
- CSS modular por arquivos temáticos e design tokens globais.

### Observação importante sobre o estado atual

A versão atual foi refinada para uma abordagem mais minimalista e premium, com menos movimento e mais foco na leitura, estrutura e clareza. Em diversas iterações, filtros e outros elementos mais complexos foram removidos para priorizar qualidade visual e experiência de usuário mais direta.

---

## 2) Estrutura de pastas

```text
pataemcasa/
├─ build/                     # build final gerado pela produção do CRA
├─ node_modules/              # dependências locais instaladas
├─ public/                    # arquivos estáticos públicos
│  ├─ fundo.jpeg              # imagem principal do Hero
│  ├─ index.html             # HTML base da aplicação
│  └─ manifest.json          # manifest do app (padrão CRA)
├─ src/                       # código-fonte da aplicação
│  ├─ components/            # componentes reutilizáveis da interface
│  │  ├─ Donation.js         # seção de doação via PIX
│  │  ├─ Footer.js           # rodapé institucional
│  │  ├─ Header.js           # cabeçalho e menu mobile
│  │  ├─ Hero.js             # seção principal com imagem e CTA
│  │  ├─ HowItWorks.js       # processo de adoção
│  │  ├─ PetSection.js       # galeria de pets
│  │  ├─ StatsStrip.js       # blocos de estatísticas
│  │  ├─ Stories.js          # histórias de impacto
│  │  └─ ...
│  ├─ pages/
│  │  └─ LandingPage.js      # montagem da página principal e coordenação dos blocos
│  ├─ styles/
│  │  ├─ cards.css           # cards, cards de pet, steps, impact cards, stats
│  │  ├─ donation.css        # estilos da seção de doação
│  │  ├─ footer.css          # estilos do rodapé
│  │  ├─ hero.css            # estilo do Hero e CTAs
│  │  ├─ layout.css          # header, sticky nav, layout general, seções
│  │  └─ root.css            # tokens globais, reset, botão base, foco e reduced motion
│  ├─ App.js                 # ponto de entrada do app
│  ├─ App.test.js            # testes de exemplo do CRA
│  ├─ index.css              # estilos mínimos globais do bootstrap do CRA
│  └─ index.js               # bootstrap do React
├─ .gitignore
├─ package.json              # dependências e scripts do projeto
├─ package-lock.json         # lockfile do npm
├─ README.md                 # documentação do projeto
└─ ...
```

### Papel principal de cada área

- `src/components`: blocos visuais e reutilizáveis do site.
- `src/pages/LandingPage.js`: página principal que compõe a estrutura institucional.
- `src/styles`: arquivos CSS separados por responsabilidade de estilo.
- `public`: ativos públicos e HTML base.
- `build`: artefato final da versão de produção.

---

## 3) Componentes

A estrutura do layout é composta por componentes reutilizáveis com responsabilidades bem definidas. Abaixo estão os principais blocos da interface.

### App

Arquivo: `src/App.js`

#### Função

É o ponto de entrada do app. Carrega os estilos globais e renderiza a landing page principal.

#### Implementação

```js
import './styles/root.css';
import './styles/layout.css';
import './styles/hero.css';
import './styles/cards.css';
import './styles/donation.css';
import './styles/footer.css';
import LandingPage from './pages/LandingPage';

function App() {
  return <LandingPage />;
}
```

#### Decisão de arquitetura

A aplicação foi organizada como uma SPA de landing page institucional, sem necessidade de roteamento completo no momento. Isso reduz complexidade e mantém o foco em conversão e narrativa visual.

---

### LandingPage

Arquivo: `src/pages/LandingPage.js`

#### Função

Compõe a página inteira em sequência: cabeçalho, hero, estatísticas, adoção, como funciona, doação, histórias e rodapé.

#### Dados principais

A página define um array `pets` com os animais exibidos na vitrine. Esse array contém:

- nome;
- código de identificação;
- tipo (cachorro/gato);
- porte;
- faixa etária;
- nível de urgência;
- imagem;
- tags;
- metadados de perfil.

#### Estados e lógica interna

A página usa `useState` e `useEffect` para controlar:

- a barra de progresso de rolagem no topo;
- a visibilidade das seções com efeito de aparição (`reveal`), quando o scroll passa por elas.

#### Decisões de UX

- o layout foi pensado para uma única jornada de conversão;
- cada bloco tem clara intenção: despertar emoção, explicar processo, mostrar necessidade e chamar para ação.
- ao contrário de uma estrutura de e-commerce, o foco não é filtro complexo, e sim maior empatia e clareza narrativa.

#### Observação histórica

Em algumas versões do projeto, havia uma ideia mais funcional de filtro e uma UI mais pesada. Após feedback do cliente, a versão final foi simplificada para uma landing page mais elegante, mais leve e mais premium.

---

### Header

Arquivo: `src/components/Header.js`

#### Função

Exibe o cabeçalho sticky com marca, navegação principal e botão de CTA para adoção.

#### Props recebidas

- Nenhuma prop.

#### Estados internos

- `isOpen`: controla a abertura/fechamento do menu mobile.
- `scrolled`: indica se a página já rolou além de um ponto mínimo.

#### Lógica principal

- `useEffect` acompanha `window.scrollY`;
- quando a rolagem passa de 20px, o header recebe classe `scrolled`;
- botão do menu mobile alterna o drawer com `aria-expanded` e `aria-controls` para melhor acessibilidade.

#### Animações e UX

- o header usa transição suave de background e shadow;
- a navegação no desktop recebe underline animado por pseudo-elemento;
- o mobile drawer é aberto por transição de opacidade/transform.

#### Decisão de design

A intenção foi manter uma identidade institucional mínima e profissional. O header funciona como um elemento de confiança visual, sem competir com o hero.

---

### Hero

Arquivo: `src/components/Hero.js`

#### Função

Apresenta a mensagem principal da ONG com imagem de fundo, texto forte e CTAs de conversão.

#### Props recebidas

- Nenhuma prop.

#### Estados internos

- Nenhum estado local necessário no componente atual.

#### Lógica principal

- O Hero usa uma imagem de fundo fixa (`fundo.jpeg`) com overlay escuro para maximizar legibilidade do texto;
- o texto principal tem animação de entrada suave em `y` e `opacity`;
- os botões primário e secundário direcionam para as seções `#adotar` e `#ajudar`.

#### Animações implementadas

- `motion.img` com `initial`/`animate` para suavizar entrada da imagem;
- `motion.div` e `motion.h1` com transições leves para introdução textual;
- animação de entrada principal com easing suave e delays curtos.

#### Decisão de design e correções feitas

A imagem foi transformada em fundo em vez de um carrossel, por três motivos:

1. melhora da legibilidade;
2. reduz custo visual e movimento;
3. reforça a sensação premium e institucional.

Também houve um problema histórico de lógica quebrada no hero: havia variáveis indefinidas e uso de imagem em formato incompatível com o padrão esperado. A correção final eliminou essa lógica e preservou a narrativa visual sem causar erros de render.

---

### StatsStrip

Arquivo: `src/components/StatsStrip.js`

#### Função

Exibe indicadores de impacto, como número de animais resgatados, adoções realizadas e tempo de atuação.

#### Props recebidas

- Nenhuma prop.

#### Estados internos

- `displayValue` dentro do componente `CountUp` para animar a numeração de forma incremental.

#### Lógica principal

O componente usa um `CountUp` customizado que:

- extrai dígitos numéricos do valor textual (`+150`, `5 anos`);
- converte texto em número;
- anima em `requestAnimationFrame`;
- mantém prefixos e sufixos (`+` e `anos`) para manter a leitura natural.

#### Animações implementadas

- `useInView` do Framer Motion para disparar a animação apenas quando a seção entra na tela;
- elevações suaves no hover; 
- contagem animada em progressão cúbica para sensação mais organizada.

#### Decisão de design

Cada dado é apresentado como uma peça visual de impacto, sem exagerar em movimento. O objetivo é reforçar a mensagem de que a ONG faz trabalho real, consistente e relevante.

---

### PetSection

Arquivo: `src/components/PetSection.js`

#### Função

Apresenta a vitrine de animais disponíveis para adoção.

#### Props recebidas

- `pets`: array de objetos contendo dados do animal.

#### Estados internos

- Nenhum estado local na versão atual.

#### Lógica principal

- `displayedPets = pets.slice(0, 8)` limita a quantidade inicial;
- cada card mostra imagem, código, nome, descrição, status e tags;
- o botão "Ver todos os animais" aponta para uma rota/ação a ser implementada no futuro (`/adotar` no código atual).

#### Animações implementadas

- `AnimatePresence` + `motion.article` para entrada/saída com transições suaves;
- hover com deslocamento vertical discreto;
- animação de ícone em setas de CTA.

#### Decisão de design/UX

A versão atual prioriza um layout limpo e visualmente agradável. A vitrine está em uma abordagem de "cards emocionais" e não em um filtro funcional complexo, porque o projeto foi reorientado para uma página mais institucional e menos técnica.

#### Problemas encontrados e correções

- em uma etapa anterior, houve tentativa de criar filtros e lógica mais pesada para a vitrine;
- após feedback do cliente, a solução foi simplificada para um estado mais elegante e menos agressivo.
- os botões de ações tinham mais comportamento visual do que funcional; a decisão final foi remover complexidade para manter consistência com o resto do site.

---

### HowItWorks

Arquivo: `src/components/HowItWorks.js`

#### Função

Explica o processo de adoção em etapas simples, tornando a jornada compreensível e confiável.

#### Props recebidas

- `steps`: array com objetos `{ title, description }`.

#### Estados internos

- Nenhum estado local.

#### Lógica principal

- usa `useRef` e `useInView` para animar a entrada dos passos quando entram na visão do usuário;
- cada card representa uma etapa do processo.

#### Animações implementadas

- cada card animado em `y` com delay incremental;
- hover leve, com deslocamento do card e seta de indicação.

#### Objetivo de UX

A adoção é uma decisão emocional e sensível. Explicar cada etapa reduz insegurança e transmite profissionalismo, o que aumenta confiança no processo.

---

### Donation

Arquivo: `src/components/Donation.js`

#### Função

Mostra as necessidades da ONG e oferece uma forma direta de doar via PIX.

#### Props recebidas

- Nenhuma prop.

#### Estados internos

- `copied`: controla se a chave foi copiada com sucesso.

#### Lógica principal

- a constante `pixKey` armazena a chave de doação;
- `handleCopy` usa `navigator.clipboard.writeText()` para copiar a chave para a área de transferência;
- ao copiar, o botão muda para "Copiado!" por 2 segundos.

#### Animações implementadas

- reveal com `whileInView` para entrada suave;
- card de doação com hover sutil;
- botão com `whileTap` e `whileHover` para feedback tátil;
- texto de status do botão com mudança de estado visual.

#### Decisão de UX e correções

- a seção inicialmente tinha a ideia de QR code e outros elementos mais pesados;
- a versão final foi simplificada para uma ação concreta: copiar a chave PIX e manter a proposta de contribuição direta.
- isso aumenta clareza e reduz ruído visual.

#### Observação técnica

A lógica usa `navigator.clipboard`, o que exige contexto seguro em navegadores modernos. Em produção, é recomendável checar suporte do navegador e fallback para ambientes mais restritivos.

---

### Stories

Arquivo: `src/components/Stories.js`

#### Função

Apresenta depoimentos e relatos de impacto.

#### Props recebidas

- Nenhuma prop.

#### Dados

O componente monta um array estático com:

- imagem;
- alt text;
- citação;
- nome do adotante ou apoiador.

#### Decisão de UX

A seção humaniza a instituição. Em uma ONG, a narrativa emocional é tão importante quanto a apresentação das informações. O uso de imagens e depoimentos cria conexão e reforça a credibilidade da organização.

---

### Footer

Arquivo: `src/components/Footer.js`

#### Função

Finaliza a página com navegação, contato e dados institucionais.

#### Props recebidas

- Nenhuma prop.

#### Lógica principal

- renderiza um conjunto de links de navegação;
- exibe contatos e informações de visita;
- mantém uma linha final com mensagem institucional e coração visual.

#### Decisão de design

O rodapé foi simplificado para evitar excesso de informação. Ele funciona como um fechamento elegante da jornada, reforçando identidade e confiabilidade.

---

## 4) Estilos e Design System

### Arquitetura visual

O projeto usa uma estrutura de CSS por área com design tokens globais centralizados em `src/styles/root.css`.

### Tokens globais

Os principais tokens são:

```css
:root {
  --bg: #f6f4ec;
  --paper: #fbfaf4;
  --ink: #20281f;
  --ink-soft: #4a5148;
  --sage: #3f5c4e;
  --sage-dark: #28382f;
  --sage-pale: #e4ebe4;
  --amber: #e2963b;
  --amber-dark: #b9721e;
  --brick: #b8543e;
  --line: #d9d3c2;
  --card: #ffffff;
}
```

### Paleta de cores

- `--bg`: fundo quente e neutro, para uma sensação acolhedora;
- `--sage`: verde institucional, associado à natureza e cuidado;
- `--amber`: tom de destaque, usado em CTAs e elementos de ação;
- `--brick`: tom de urgência ou marcação de atenção;
- `--paper`: fundos claros para blocos e cards.

### Tipografia

A linguagem visual aposta em uma estrutura com contraste entre:

- serif elegante para títulos (`Fraunces`);
- sans para UI e textos correntes (`Inter`);
- mono para dados e microetiquetas (`IBM Plex Mono`).

Esse contraste ajuda a conferir personalidade ao site sem perder legibilidade.

### Padrões reutilizáveis

- botões com duas variações: primário e secundário;
- cards com bordas suaves, sombras leves e hover discreto;
- tags em mono para dados rápidos e pequenas informações;
- estados interativos com foco visível e transições suaves;
- layouts com `wrap` centralizado e padding consistente.

### Arquivos de estilo principais

- `src/styles/root.css`: tokens e reset;
- `src/styles/layout.css`: navegação, seções e layout global;
- `src/styles/hero.css`: hero e CTAs;
- `src/styles/cards.css`: cards de pets, steps, stats e impact cards;
- `src/styles/donation.css`: estilos da campanha de doação;
- `src/styles/footer.css`: rodapé e detalhes finais.

---

## 5) Acessibilidade e performance

### Acessibilidade

Foram implementados vários pontos para melhorar a navegação e a compreensão do conteúdo:

- `aria-label` em elementos interativos importantes;
- `aria-expanded` e `aria-controls` no menu mobile;
- foco visível global com `:focus-visible`;
- contraste adequado entre textos claros e fundos escuros;
- imagens com `alt` quando relevante e `aria-hidden` quando decorativas;
- navegação por âncora funcionando como fluxo claro da página;
- uso de `prefers-reduced-motion` para reduzir ou desativar animações em usuários sensíveis ao movimento.

### Performance

- hero usa `loading="eager"` e `fetchPriority="high"` para priorizar a imagem principal acima da dobra;
- imagens de cards usam `loading="lazy"` e `decoding="async"` para reduzir custo inicial;
- layout foi pensado para evitar excesso de movimento e reduzir carga visual;
- animações seguem comportamento leve e sem exageros;
- CSS está separado por módulos de responsabilidade para facilitar manutenção e evitar regras conflitantes.

### Observação sobre CLS e layout

O projeto foi ajustado para reduzir o risco de Layout Shift, especialmente na seção principal do Hero. O sistema de altura, overlay e imagem foram organizados para manter a área visual estável e previsível.

---

## 6) Como rodar o projeto

### Requisitos

- Node.js instalado;
- npm ou outro gerenciador compatible;
- Ambiente local de desenvolvimento.

### Instalação

No diretório raiz do projeto:

```bash
npm install
```

### Rodar em modo de desenvolvimento

```bash
npm start
```

O app fica disponível em:

```text
http://localhost:3000
```

### Build de produção

```bash
npm run build
```

Esse comando gera a pasta `build/` pronta para deploy.

### Testes

```bash
npm test
```

---

## 7) Próximos passos / pendências

A versão atual é funcional, visualmente mais refinada e estável, mas ainda há pontos a evoluir:

- criação da página real de "Ver todos os animais";
- definição de rota dedicada para adoção (`/adotar`);
- geração de QR code real para doação PIX;
- padronização de dados em arquivo separado (`data/` ou `content/`);
- integração com backend ou CMS para manter pets em tempo real;
- criação de painel administrativo para gestão de animais e campanhas;
- revisão final de SEO com title, metas e descrição específicas;
- uso de imagens otimizadas em formato mais eficiente para web;
- revisão de acessibilidade com testes manuais/automáticos em mais dispositivos.

### Sugestões futuras

- separar dados em um arquivo central de conteúdo;
- implementar workflow de adoção em múltiplas etapas;
- criar página de detalhes por pet;
- integrar analytics para acompanhar cliques e conversões;
- incluir formulário de contato ou de adoção real;
- publicar conteúdo em blog/impacto institucional.

---

## 8) Changelog / histórico resumido

### Fase inicial

- estrutura base em React + CRA;
- paginação inicial da landing page e dados fixos em código.

### Fase de refinamento visual

- hero com imagem de fundo e sobreposição de texto;
- ajustes de contraste e clareza para melhorar experiência visual;
- revisão do layout geral para manter identidade institucional.

### Fase de simplificação e minimalismo

- remoção de filtros e elementos mais complexos;
- redução do movimento excessivo;
- criação de uma linguagem visual mais premium e menos agressiva.

### Fase de campanha de doação e conversão

- seção de PIX com cópia direta de chave;
- CTA mais claro e alinhado com a intenção do projeto;
- rodapé e navegação mais enxutos e confiáveis.

### Estado atual

- landing page institucional funcional, coesa, responsiva e visualmente estável;
- foco em narrativa emocional, clareza e conversão;
- pronta para evoluir em arquiteturas maiores sem perder a identidade atual.

---

## Conclusão

Este projeto é uma landing page institucional pensada para passar confiança, acolhimento e impacto. A sua arquitetura atual busca equilibrar visual moderno, narrativa emocional, fácil navegação e clareza de conversão.

A partir do estado atual, o projeto já está pronto para funcionar como presença digital da ONG, e também está preparado para evoluir em direção a uma solução mais completa de adoção, gestão de animais e campanhas digitais.

Se o objetivo for ampliar o produto, a próxima etapa mais estratégica é transformar a página atual em uma plataforma com rotas dedicadas, dados dinâmicos e fluxo real de adoção/voluntariado.

