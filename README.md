# Patas em Casa

Aplicação web da ONG Patas em Casa para divulgação institucional, apresentação de animais disponíveis e encaminhamento de interessados ao fluxo de adoção responsável.

O projeto é um frontend React criado com Create React App. Ele possui uma landing page institucional em `/` e um catálogo de adoção em `/adotar`, com busca, filtros, ficha do animal e formulário de pré-adoção.

> Este README descreve o estado real do código presente neste repositório. O projeto atualmente não inclui backend, banco de dados, autenticação ou persistência de solicitações de adoção.

## Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Arquitetura e estrutura](#2-arquitetura-e-estrutura)
- [3. Fluxo de execução](#3-fluxo-de-execução)
- [4. Tecnologias e dependências](#4-tecnologias-e-dependências)
- [5. Configuração e instalação](#5-configuração-e-instalação)
- [6. Uso da aplicação](#6-uso-da-aplicação)
- [7. Dados e API](#7-dados-e-api)
- [8. Decisões técnicas](#8-decisões-técnicas)
- [9. Testes](#9-testes)
- [10. Contribuição e manutenção](#10-contribuição-e-manutenção)

---

## 1. Visão geral

### O que o projeto faz

O Patas em Casa apresenta a atuação de uma organização de proteção animal e cria uma jornada digital para adoção responsável. A aplicação combina conteúdo institucional, indicadores de impacto, vitrine de animais, orientações sobre adoção, histórias de adotantes e uma seção de doação via PIX.

### Problema que resolve

ONGs de proteção animal precisam divulgar animais, gerar confiança e orientar possíveis adotantes sem depender de uma comunicação fragmentada. O projeto centraliza essa experiência em uma interface responsiva que permite:

- conhecer a missão da ONG;
- encontrar animais por diferentes características;
- consultar uma ficha detalhada;
- demonstrar interesse em um animal específico;
- entender as etapas da adoção;
- apoiar financeiramente a organização.

### Público-alvo

- pessoas interessadas em adotar cães ou gatos;
- famílias procurando um animal compatível com sua rotina;
- doadores e padrinhos;
- voluntários;
- apoiadores que desejam conhecer o impacto da ONG.

### Funcionalidades principais

- Landing page institucional em `/`;
- catálogo completo de adoção em `/adotar`;
- busca por nome, raça, código ou metadados do animal;
- filtros por espécie, porte, idade, sexo, cidade, cuidados e urgência;
- ordenação por prioridade ou nome;
- carregamento incremental por `IntersectionObserver`;
- cards animados de animais;
- ficha detalhada do pet em modal;
- formulário de pré-adoção associado ao pet selecionado;
- estado de sucesso após envio do formulário;
- compartilhamento por Web Share API ou cópia do endereço atual;
- seção de doação com cópia da chave PIX;
- menu responsivo e navegação por âncoras;
- animações com suporte a transições de entrada, saída e hover.

---

## 2. Arquitetura e estrutura

### Visão arquitetural

A aplicação é uma SPA (Single Page Application) frontend. O React renderiza a interface, o React Router decide qual página exibir e o Axios consulta uma API externa de animais.

O repositório não contém uma camada backend nem um banco de dados. O frontend espera que exista uma API acessível em `http://localhost:3000` durante o desenvolvimento.

### Estrutura de diretórios

```text
Patas-em-Casa/
├── public/
│   ├── fundo.jpeg                         # imagem principal do Hero
│   └── index.html                         # HTML base do CRA
├── src/
│   ├── components/
│   │   ├── catalog/                       # componentes exclusivos do catálogo
│   │   │   ├── AdoptionFormModal/
│   │   │   │   ├── AdoptionFormModal.jsx
│   │   │   │   └── AdoptionFormModal.css
│   │   │   ├── FilterDrawer/
│   │   │   │   ├── FilterDrawer.jsx
│   │   │   │   ├── FilterDrawer.css
│   │   │   │   └── FilterGroup.jsx
│   │   │   ├── PetCard/
│   │   │   │   ├── PetCard.jsx
│   │   │   │   └── PetCard.css
│   │   │   └── PetDetail/
│   │   │       ├── PetDetail.jsx
│   │   │       └── PetDetail.css
│   │   ├── common/                         # componentes reutilizáveis entre páginas
│   │   │   ├── Footer.jsx
│   │   │   └── Header.jsx
│   │   └── home/                           # seções da landing page
│   │       ├── Donation.jsx
│   │       ├── Hero.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── PetSectionContainer.jsx
│   │       ├── StatsStrip.jsx
│   │       └── Stories.jsx
│   ├── constants/
│   │   └── catalogOptions.js               # opções e tamanho da página do catálogo
│   ├── pages/
│   │   ├── AdoptionCatalog.jsx             # view e orquestração do catálogo
│   │   └── LandingPage.jsx                  # composição da página inicial
│   ├── services/
│   │   ├── api.js                          # instância Axios
│   │   └── animaisService.js               # função auxiliar de consulta de animais
│   ├── styles/
│   │   ├── adoption-catalog.css
│   │   ├── cards.css
│   │   ├── donation.css
│   │   ├── footer.css
│   │   ├── form.css
│   │   ├── hero.css
│   │   ├── layout.css
│   │   └── root.css
│   ├── utils/
│   │   └── petHelpers.js                   # helpers puros de filtros e metadados
│   ├── App.js                              # rotas e imports globais de CSS
│   ├── App.test.js                         # testes de comportamento da aplicação
│   ├── index.css                           # estilos de bootstrap do frontend
│   └── index.js                            # entry point do React
├── build/                                  # artefato gerado por npm run build
├── package.json
├── package-lock.json
└── README.md
```

### Responsabilidade dos módulos

#### `src/index.js`

É o entry point do frontend. Ele:

1. obtém o elemento `#root` do HTML;
2. cria a raiz React com `ReactDOM.createRoot`;
3. envolve a aplicação em `React.StrictMode`;
4. envolve a aplicação em `BrowserRouter`;
5. renderiza o componente `App`.

#### `src/App.js`

Define as rotas da aplicação:

```jsx
<Routes>
  <Route path="/adotar" element={<AdoptionCatalog />} />
  <Route path="*" element={<LandingPage />} />
</Routes>
```

A rota curinga faz com que a landing page seja exibida para a raiz e para caminhos não tratados explicitamente.

#### `src/pages/LandingPage.jsx`

Monta a página institucional na seguinte ordem:

1. `Header`;
2. `Hero`;
3. `StatsStrip`;
4. `PetSectionContainer`;
5. `HowItWorks`;
6. `Donation`;
7. `Stories`;
8. `Footer`.

Também controla o progresso de rolagem e adiciona efeitos de revelação às seções com `IntersectionObserver`.

#### `src/pages/AdoptionCatalog.jsx`

É o orquestrador do catálogo. Ele não concentra a marcação interna dos componentes visuais. Sua responsabilidade é:

- carregar pets;
- controlar busca e debounce;
- manter filtros e ordenação;
- derivar a lista filtrada;
- controlar o carregamento incremental;
- abrir e fechar drawer, ficha e formulário;
- coordenar o compartilhamento.

#### `src/components/home/PetSectionContainer.jsx`

Faz a busca inicial de animais usada na home, normaliza a resposta da API e renderiza a vitrine resumida. Também exporta `mapPetFromApi`, `mapPetsFromApi` e `buscarTodoAnimais`, que são reutilizados pelo catálogo.

#### `src/components/catalog`

Contém as peças exclusivas do fluxo de adoção:

- `PetCard`: card animado do animal, com efeito de movimento da imagem;
- `FilterDrawer`: drawer lateral de filtros;
- `FilterGroup`: agrupador visual de cada filtro;
- `PetDetail`: ficha detalhada do animal;
- `AdoptionFormModal`: formulário de pré-adoção e estado de sucesso.

#### `src/components/common`

Contém componentes usados pela experiência institucional e potencialmente compartilháveis entre páginas:

- `Header`: navegação sticky, CTA e menu mobile;
- `Footer`: fechamento institucional, contatos e navegação.

#### `src/services`

Centraliza a integração HTTP. `api.js` cria o cliente Axios com a URL base e `animaisService.js` oferece uma função auxiliar de consulta.

No estado atual, `PetSectionContainer.jsx` consulta `api.js` diretamente em sua própria função `buscarTodoAnimais`. `animaisService.js` existe como camada auxiliar, mas ainda não é o caminho usado pelo fluxo principal. Essa duplicidade é uma oportunidade de consolidação futura.

### Fluxo de comunicação

```text
index.js
  └── BrowserRouter
      └── App.js
          ├── /adotar -> AdoptionCatalog.jsx
          │   ├── buscarTodoAnimais()
          │   │   └── api.js -> GET /animais/BuscaTodoAnimais
          │   ├── mapPetsFromApi()
          │   ├── filtros + busca + ordenação
          │   ├── PetCard
          │   ├── PetDetail
          │   └── AdoptionFormModal
          └── * -> LandingPage.jsx
              ├── Header
              ├── Hero
              ├── StatsStrip
              ├── PetSectionContainer
              │   └── API -> normalização -> PetSection
              ├── HowItWorks
              ├── Donation
              ├── Stories
              └── Footer
```

### Camadas existentes e ausentes

| Camada | Presença | Responsabilidade |
| --- | --- | --- |
| Apresentação | Sim | React, componentes JSX e CSS |
| Roteamento | Sim | React Router DOM |
| Serviços HTTP | Sim | Axios e funções de consulta |
| Backend | Externo | esperado em `localhost:3000` |
| Banco de dados | Não no repositório | responsabilidade do backend externo |
| Autenticação | Não implementada | não há área protegida ou login |
| Persistência de adoção | Não implementada | envio atual apenas altera o estado local |

---

## 3. Fluxo de execução

### Inicialização

Ao executar `npm start`, o Create React App inicia o servidor de desenvolvimento e processa `src/index.js`.

A partir desse ponto:

1. o React cria a raiz no elemento `#root`;
2. o `BrowserRouter` passa a controlar a navegação;
3. o `App` avalia a URL atual;
4. a página correspondente é montada;
5. os arquivos CSS globais são carregados pelo `App.js` e pelo `index.js`.

### Fluxo da landing page

1. `LandingPage` é renderizada pela rota curinga.
2. `Header` registra o estado de rolagem e controla o menu mobile.
3. `Hero` exibe a mensagem institucional e alterna as histórias de Bento, Luna e Milo a cada 3,5 segundos.
4. `StatsStrip` anima os indicadores quando entram em viewport.
5. `PetSectionContainer` consulta a lista de animais.
6. A resposta é convertida para o modelo de UI por `mapPetsFromApi`.
7. As seções `HowItWorks`, `Donation`, `Stories` e `Footer` completam a experiência.

### Fluxo do catálogo

1. O usuário acessa `/adotar`.
2. `AdoptionCatalog` inicia com estado de carregamento.
3. `buscarTodoAnimais` consulta a API.
4. `mapPetsFromApi` transforma os registros recebidos.
5. A lista é filtrada com base em busca, espécie, porte, idade, cidade, sexo, cuidados e urgência.
6. A busca textual é aplicada após um debounce de 300 ms.
7. A lista é ordenada e limitada inicialmente a `PAGE_SIZE = 8`.
8. O `IntersectionObserver` aumenta a quantidade visível quando o usuário se aproxima do fim.
9. `PetCard` abre a ficha do animal ou inicia o compartilhamento.
10. `PetDetail` exibe informações detalhadas.
11. O botão de adoção fecha a ficha e abre `AdoptionFormModal`.

### Fluxo do formulário

O formulário é local e demonstrativo no estado atual:

1. o usuário escolhe um pet;
2. abre a ficha;
3. clica em “Quero adotar”;
4. preenche ou revisa os campos exibidos;
5. envia o formulário;
6. o componente impede o submit padrão;
7. o estado `submitted` muda para `true`;
8. a mensagem de sucesso é exibida.

Nenhuma requisição POST é feita e nenhuma informação é persistida.

### Fluxo de compartilhamento

Ao clicar no botão de compartilhamento:

- se `navigator.share` existir, a Web Share API é usada;
- caso contrário, o código tenta copiar `window.location.href` com `navigator.clipboard`.

### Estados de erro e carregamento

A home exibe uma mensagem de carregamento enquanto busca os pets e uma mensagem de erro caso a consulta falhe.

No catálogo, falhas da consulta resultam em lista vazia e encerramento do estado de loading, exibindo o estado “Nenhum animal encontrado”.

---

## 4. Tecnologias e dependências

As versões abaixo são as declaradas em `package.json`.

| Tecnologia | Versão | Uso no projeto |
| --- | --- | --- |
| JavaScript | ES Modules | linguagem principal |
| React | `^19.2.8` | construção da interface componentizada |
| React DOM | `^19.2.8` | renderização no navegador |
| Create React App | via `react-scripts ^5.0.1` | desenvolvimento, build e testes |
| React Router DOM | `6.30.0` | rotas `/` e `/adotar` |
| Axios | `^1.20.0` | cliente HTTP para a API de animais |
| Framer Motion | `^13.1.0` | animações, transições e presença de modais |
| lucide-react | `^1.29.0` | ícones da interface |
| web-vitals | `^2.1.4` | dependência padrão do CRA, sem uso ativo no fluxo atual |
| Jest | via CRA | execução dos testes |
| Testing Library DOM | `^10.4.1` | matchers e suporte aos testes DOM |
| Testing Library Jest DOM | `^6.9.1` | asserções semânticas para elementos DOM |
| Testing Library React | `^16.3.2` | renderização e interação de componentes em testes |
| Testing Library User Event | `^13.5.0` | dependência disponível para interações de usuário |
| CSS | nativo | tokens, layout, responsividade e estilos de domínio |

### Motivos identificáveis das escolhas

- React permite dividir a experiência em componentes reutilizáveis.
- React Router mantém a navegação entre home e catálogo dentro da SPA.
- Axios simplifica a consulta à API externa.
- Framer Motion fornece transições declarativas para cards, drawer e modais.
- lucide-react mantém os ícones consistentes e acessíveis.
- CSS separado por domínio reduz o acoplamento entre layout global, home e catálogo.

### Dependências externas

- API HTTP esperada em `http://localhost:3000`;
- endpoint de animais `/animais/BuscaTodoAnimais`;
- imagens remotas usadas em conteúdos e registros de pets, incluindo URLs do Unsplash quando fornecidas pelos dados;
- APIs nativas opcionais do navegador: `navigator.share` e `navigator.clipboard`.

---

## 5. Configuração e instalação

### Pré-requisitos

- Node.js instalado, preferencialmente versão 18 ou superior;
- npm;
- acesso ao repositório da API em `http://localhost:3000` para carregar animais reais;
- navegador moderno com suporte a ES Modules, `IntersectionObserver` e APIs padrão do DOM.

### Instalação do zero

Na raiz do projeto:

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

A aplicação normalmente ficará disponível em:

```text
http://localhost:3000
```

> Como a API também está configurada em `localhost:3000`, o backend externo precisa estar disponível nessa mesma origem ou ser ajustado para outra porta. Em um ambiente real, recomenda-se separar a porta do frontend e a porta da API usando variável de ambiente ou proxy.

### Build de produção

```bash
npm run build
```

O comando gera o artefato otimizado na pasta `build/`.

Para servir o build localmente, uma opção é:

```bash
npx serve -s build
```

### Testes

```bash
npm test
```

Execução não interativa usada em CI:

```bash
CI=1 npm test -- --watch=false --runInBand
```

### Variáveis de ambiente

Não há variáveis de ambiente obrigatórias no código atual. A URL da API está definida diretamente em `src/services/api.js`:

```js
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Para preparar a aplicação para múltiplos ambientes, recomenda-se criar `.env.example`:

```env
REACT_APP_API_URL=http://localhost:3000
```

E alterar o cliente Axios para:

```js
baseURL: process.env.REACT_APP_API_URL,
```

---

## 6. Uso da aplicação

### Home institucional

Acesse:

```text
/
```

Na home, o visitante pode:

- conhecer a mensagem principal da ONG;
- acessar “Quero adotar”;
- navegar para as seções de adoção, ajuda e histórias;
- consultar a vitrine resumida de animais;
- copiar a chave PIX;
- conhecer as etapas do processo.

### Catálogo de adoção

Acesse:

```text
/adotar
```

Exemplo de jornada:

1. digite um nome, raça ou código na busca;
2. abra “Filtros”;
3. selecione espécie, porte, sexo ou cuidados;
4. escolha uma ordenação;
5. clique em “Ver ficha”;
6. analise os dados do animal;
7. clique em “Quero adotar”;
8. envie o formulário de pré-adoção.

### Exemplo de resposta esperada da API

```json
[
  {
    "id": "nino-001",
    "nome": "Nino",
    "especie": "cachorro",
    "raca": "Vira-lata",
    "sexo": "macho",
    "idade_anos": 2,
    "porte": "medio",
    "status": "disponivel",
    "descricao": "Nino é um cachorro carinhoso.",
    "foto_url": "https://example.com/nino.jpg",
    "castrado": true,
    "vacinado": true
  }
]
```

### Exemplo de chamada manual

```bash
curl http://localhost:3000/animais/BuscaTodoAnimais
```

### Modelo normalizado usado pela interface

Depois da transformação por `mapPetFromApi`, o frontend utiliza uma estrutura semelhante a:

```js
{
  code: 'NINO-001',
  name: 'Nino',
  image: 'https://example.com/nino.jpg',
  alt: 'Nino, cachorro da raça Vira-lata',
  stamp: 'Vira-lata',
  urgent: false,
  meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
  tags: ['Macho', 'Castrado', 'Vacinado'],
  descricao: 'Nino é um cachorro carinhoso.'
}
```

---

## 7. Dados e API

### Banco de dados

Não há banco de dados neste repositório. Nenhum schema, migration, ORM ou conexão direta com banco foi identificado.

Os dados são obtidos de uma API externa e mantidos em estado React enquanto a página está montada.

### Endpoint principal

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/animais/BuscaTodoAnimais` | retorna os animais usados na home e no catálogo |

A URL completa esperada no ambiente atual é:

```text
http://localhost:3000/animais/BuscaTodoAnimais
```

### Resposta esperada

A resposta deve ser um array de objetos. Os campos utilizados são:

| Campo | Tipo esperado | Uso |
| --- | --- | --- |
| `id` | string ou number | código exibido e chave do pet |
| `nome` | string | nome do animal |
| `especie` | string | espécie, como `cachorro` ou `gato` |
| `raca` | string | raça ou classificação |
| `sexo` | string | sexo usado nas tags |
| `idade_anos` | number ou string | cálculo da faixa etária |
| `porte` | string | pequeno, medio ou grande |
| `status` | string | identifica pets urgentes |
| `descricao` | string | descrição do animal |
| `foto_url` | string | imagem principal |
| `castrado` | boolean | tag de cuidado |
| `vacinado` | boolean | tag de cuidado |
| `tags` | array opcional | substitui as tags calculadas quando presente |

### Normalização

`mapPetFromApi` converte nomes de campos da API para os campos consumidos pela UI. Também:

- transforma espécie em label amigável;
- transforma porte em “Porte pequeno”, “Porte médio” ou “Porte grande”;
- converte idade numérica em anos ou meses;
- cria tags de sexo, castração e vacinação;
- marca `urgent` quando `status === 'urgente'`;
- cria um texto consolidado em `meta`.

### Comportamento quando a API falha

A função de carregamento captura a falha e retorna uma lista vazia para a interface. A home mostra mensagem de erro em seu próprio container; o catálogo mostra o estado de lista vazia.

### Persistência do formulário

O formulário de adoção não possui endpoint de envio. O submit é tratado localmente pelo estado `submitted`, portanto não existe atualmente:

- `POST` de candidatura;
- armazenamento em banco;
- envio de e-mail;
- autenticação do adotante;
- painel de aprovação.

---

## 8. Decisões técnicas

### SPA com rotas simples

A aplicação usa uma SPA porque a experiência é concentrada em duas views principais e muitos blocos interativos. React Router permite preservar o shell da aplicação e navegar entre `/` e `/adotar` sem recarregar a página inteira.

### Componentização por domínio

Os componentes foram agrupados em:

- `common`: elementos compartilhados;
- `home`: seções da landing page;
- `catalog`: elementos exclusivos da adoção.

Essa divisão reduz imports ambíguos e torna mais claro onde novas funcionalidades devem ser implementadas.

### Orquestração do catálogo

`AdoptionCatalog.jsx` mantém o estado e coordena os filhos, enquanto `PetCard`, `FilterDrawer`, `PetDetail` e `AdoptionFormModal` cuidam da apresentação e das interações locais. Isso reduz a complexidade do JSX principal e facilita testes isolados futuros.

### Busca com debounce

A busca espera 300 ms antes de atualizar o valor efetivamente filtrado. Isso evita recalcular a lista a cada tecla e melhora a experiência em listas maiores.

### Carregamento incremental

O catálogo começa com oito registros (`PAGE_SIZE = 8`) e aumenta a quantidade visível conforme o sentinel entra na viewport. É uma solução simples para reduzir o volume inicial de renderização sem introduzir paginação de API.

### CSS separado por responsabilidade

O projeto usa CSS global organizado por domínio e arquivos CSS próximos aos componentes do catálogo. Essa abordagem preserva as classes existentes, como `.catalog-grid`, `.catalog-primary-button` e `.filter-drawer`, sem adicionar uma dependência de CSS-in-JS.

### Trade-offs e limitações

- a URL da API está hardcoded;
- o frontend e a API usam a mesma porta padrão no desenvolvimento;
- o serviço `animaisService.js` ainda não é o caminho usado pelo container principal;
- o formulário não persiste dados;
- os dados de cidade não são normalizados pela API em `mapPetFromApi`, embora o catálogo possua filtro de cidade;
- a ordenação “Mais recentes” e “Mais urgentes” compartilha atualmente a ordenação por urgência, sem campo explícito de data;
- a ficha usa conteúdo textual e datas estáticas enquanto não existe um modelo detalhado vindo da API;
- não há autenticação, administração ou workflow de aprovação;
- não há testes de integração com a API real.

---

## 9. Testes

### Suíte atual

Os testes estão em [src/App.test.js](src/App.test.js) e cobrem:

1. renderização da landing page;
2. presença do CTA que aponta para `/adotar`;
3. carregamento da vitrine da home;
4. abertura da ficha de um animal no catálogo;
5. abertura do formulário de pré-adoção a partir da ficha;
6. rotação automática das histórias do Hero.

### Executar testes

Modo interativo:

```bash
npm test
```

Modo CI, sem watch:

```bash
CI=1 npm test -- --watch=false --runInBand
```

### Estratégia de isolamento

A suíte mocka `buscarTodoAnimais` para evitar chamadas reais durante os testes. Também fornece um mock de `IntersectionObserver`, API que não existe nativamente em alguns ambientes jsdom.

### Lacunas de cobertura

Ainda não há cobertura dedicada para:

- cada combinação de filtro;
- debounce da busca;
- ordenação;
- infinite scroll em um cenário com mais de oito pets;
- fallback de compartilhamento;
- cópia da chave PIX;
- validação de campos do formulário;
- respostas HTTP reais;
- acessibilidade automatizada completa.

---

## 10. Contribuição e manutenção

### Fluxo recomendado para contribuição

1. atualize a branch principal localmente;
2. crie uma branch descritiva para a mudança;
3. mantenha alterações pequenas e focadas;
4. preserve a separação entre `common`, `home` e `catalog`;
5. execute os testes antes de abrir uma pull request;
6. execute o build para alterações de rota, import ou estilo;
7. atualize o README quando houver mudança de contrato ou configuração.

Exemplo:

```bash
git checkout -b feat/catalogo-filtros
npm install
CI=1 npm test -- --watch=false --runInBand
npm run build
```

### Commits recomendados

Use mensagens curtas e descritivas, preferencialmente seguindo um padrão como Conventional Commits:

```text
feat: adiciona filtro por cidade
fix: corrige fallback da API de animais
refactor: separa componentes do catálogo
test: cobre abertura do formulário de adoção
docs: atualiza configuração da API
```

### Roadmap sugerido

#### Dados e backend

- extrair `REACT_APP_API_URL` para configuração por ambiente;
- consolidar `animaisService.js` como única camada de consulta;
- adicionar persistência de candidaturas;
- criar endpoint `POST` para pré-adoção;
- validar contratos de API com schema;
- adicionar tratamento de timeout e estados HTTP distintos.

#### Produto

- implementar autenticação para equipe da ONG;
- criar painel administrativo;
- aprovar ou rejeitar candidaturas;
- cadastrar histórico, cidade, datas e múltiplas fotos do pet;
- incluir página detalhada por animal;
- adicionar notificações por e-mail ou WhatsApp;
- gerar QR Code real para doações PIX.

#### Qualidade

- adicionar testes unitários para `petHelpers` e normalização;
- cobrir filtros e ordenação com testes de componente;
- testar o fluxo de formulário com validação;
- executar auditorias de acessibilidade;
- adicionar lint e formatador automatizados;
- revisar a estratégia de imagens e performance.

### Manutenção diária

- manter a URL da API documentada por ambiente;
- verificar alterações no contrato de `BuscaTodoAnimais`;
- evitar lógica de negócio dentro do JSX;
- adicionar opções fixas em `catalogOptions.js`;
- manter funções de transformação em utilitários ou serviços;
- atualizar testes quando o fluxo de adoção mudar.

---

## Conclusão

O Patas em Casa possui uma base frontend organizada para uma experiência institucional e de adoção responsável. A divisão atual entre páginas, componentes por domínio, serviços, constantes, utilitários e estilos facilita a evolução do produto sem misturar a landing page com o catálogo.

O projeto está pronto para desenvolvimento local e para integração com uma API de animais. Para evoluir para um produto operacional completo, os próximos passos mais importantes são configurar ambientes de API, persistir candidaturas e criar o fluxo administrativo de avaliação e aprovação.
