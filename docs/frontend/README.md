# Documentação do front-end — Patas em Casa

Documentação completa do front-end (React 19 + Create React App), escrita **a partir do código** do repositório
`Patas-em-Casa` em 2026-10-07 (branch `refactor/estrutura-pastas`). Só descreve o que existe; o que é ambíguo está
marcado com **⚠️ A confirmar** e o que foi deduzido sem evidência explícita, com **⚠️ inferido, confirmar** (lista no
fim). A API consumida está documentada em `Patas-em-Casa-BackEnd/docs/backend/`.

## Índice

| # | Documento | Conteúdo |
| --- | --- | --- |
| 1 | [Visão geral](01-visao-geral.md) | O que o sistema faz, para quem, fluxos principais, stack |
| 2 | [Como rodar](02-como-rodar.md) | Pré-requisitos, comandos, variáveis de ambiente, problemas comuns |
| 3 | [Estrutura de pastas](03-estrutura.md) | Árvore completa, contagem por pasta, convenções |
| 4 | [Rotas e páginas](04-rotas-e-paginas.md) | As 19 rotas, proteção e cada página (objetivo, componentes, dados, ações) |
| 5 | [Componentes](05-componentes/README.md) | Os 77 componentes, um por um, em 9 arquivos |
| 6 | [Estado](06-estado.md) | Estado local, URL, `localStorage`, evento de sessão expirada |
| 7 | [Comunicação com a API](07-api.md) | Cliente Axios, interceptors, erros e as 60 funções de chamada |
| 8 | [Autenticação e permissões](08-autenticacao.md) | Login, token, renovação, logout, permissões por aba e botão |
| 9 | [Hooks, utils e helpers](09-hooks-utils.md) | 6 hooks, utilitários, formatadores e constantes |
| 10 | [Estilos e UI](10-estilos-ui.md) | CSS por componente, tokens, fontes, breakpoints, classes reutilizáveis, acessibilidade |
| 11 | [Formulários e validações](11-formularios.md) | Cada formulário: campos, regras, mensagens, destino |
| 12 | [Testes](12-testes.md) | Organização, como rodar, cobertura medida e lacunas |
| 13 | [Build e deploy](13-build-deploy.md) | Build, ambientes, CI/CD, requisitos de hospedagem |
| 14 | [Pontos de atenção](14-pontos-de-atencao.md) | Conteúdo a confirmar, funcionalidades incompletas, segurança, dívidas, desempenho, usabilidade |

**Engenharia de software** ([engenharia/](engenharia/)):

| Documento | Conteúdo |
| --- | --- |
| [requisitos.md](engenharia/requisitos.md) | 52 RF, 21 RNF e 29 RN com status e prioridade; matriz requisito → caso de uso → telas/arquivos |
| [casos-de-uso.md](engenharia/casos-de-uso.md) | Atores, 2 diagramas PlantUML (include/extend) e a especificação de 31 casos de uso |
| [diagrama-classes.md](engenharia/diagrama-classes.md) | 3 diagramas de classes em Mermaid (dados/serviços/estado, site, painel) |
| [modelo-dados.md](engenharia/modelo-dados.md) | Diagramas dos dados da API e locais, e dicionário de dados |
| [arquitetura.md](engenharia/arquitetura.md) | Objetivo, padrão, C4 (contexto, containers, componentes), 4 sequências, 13 decisões, tecnologias, RNF, implantação, riscos e melhorias |

## Inventário

Levantado antes de escrever, sobre os 145 arquivos fora de `node_modules/`, `build/` e `.git/`.

| Categoria | Quantidade | Documentado em |
| --- | ---: | --- |
| Rotas | 19 caminhos (10 públicos, 8 protegidos do painel, 1 curinga) + 1 rota de proteção sem caminho | [4](04-rotas-e-paginas.md) |
| Páginas/telas | 20 (8 do site, 4 de entrada do painel, 8 seções do painel) | [4](04-rotas-e-paginas.md), [5](05-componentes/README.md) |
| Componentes | 77 no total: 1 raiz, 20 páginas/telas, 39 componentes exportados, 17 internos | [5](05-componentes/README.md) |
| Hooks | 6 (5 exportados + `usePanelSubmit` interno) | [9](09-hooks-utils.md) |
| Serviços de API | 15 arquivos: `client.js`, 5 do site, 9 do painel; 60 funções + renovação interna | [7](07-api.md) |
| Stores/contexts | 0 (estado local, URL, `localStorage`) | [6](06-estado.md) |
| Utils/helpers | 6 módulos (`petMapper`, `petText`, `sharePet`, `catalogFilters`, `statusLabels`, `downloadFile`) com 26 funções, + 10 exportações auxiliares de componentes (funções puras e objetos trocáveis nos testes) | [9](09-hooks-utils.md) |
| Constantes | 7 arquivos | [9](09-hooks-utils.md#constantes-de-conteúdo) |
| Estilos | 25 arquivos CSS | [10](10-estilos-ui.md) |
| Assets | `fundo.webp`, `favicon.svg`, `index.html` | [3](03-estrutura.md), [10](10-estilos-ui.md) |
| `localStorage` | 3 chaves | [6](06-estado.md) |
| Variáveis de ambiente | 1 (`REACT_APP_API_URL`) | [2](02-como-rodar.md) |
| Formulários | Todos os do site, do acesso e do painel (inclusive filtros e painéis de ação) | [11](11-formularios.md) |
| Testes | 21 arquivos, 91 testes (+ `setupTests.js`) | [12](12-testes.md) |
| Configuração/raiz | `package.json`, `package-lock.json`, `jsconfig.json`, `.env.example`, `.gitignore`, `README.md` | [2](02-como-rodar.md), [3](03-estrutura.md) |

## Verificação de cobertura

Feita com um script que lê o código e procura cada item nesta documentação (2026-10-07):

| Categoria | No código | Documentados | Cobertura | Critério |
| --- | ---: | ---: | :---: | --- |
| Arquivos do projeto | 145 | 145 | 100% | Nome de cada arquivo citado |
| Rotas (`App.js`) | 19 | 19 | 100% | Caminho na tabela de rotas |
| Componentes React | 77 | 77 | 100% | Ficha própria (título) na seção 5 |
| Hooks | 6 | 6 | 100% | Seção na 9 |
| Funções de API | 60 | 60 | 100% | Linha na tabela da 7 |
| Funções de utils | 26 | 26 | 100% | Citadas na 9 |
| Arquivos de teste | 21 | 21 | 100% | Linha na 12 |
| Arquivos CSS | 25 | 25 | 100% | Citados (seção 5 ou 10) |
| Chaves de `localStorage` | 3 | 3 | 100% | Tabela da 6 |
| Constantes principais | 10 | 10 | 100% | Citadas |
| Variáveis de ambiente | 1 | 1 | 100% | Tabela da 2 |

Também conferidos: links e âncoras internos (0 quebrados); os 19 diagramas Mermaid passam no parser do Mermaid 11; os
2 diagramas PlantUML foram revisados manualmente (não há Java para validá-los); `npm test`: 91 de 91 passando; cobertura
de testes medida: 74,6% das linhas.

## Itens a confirmar

### ⚠️ A confirmar (8)

| # | Ponto | Onde |
| --- | --- | --- |
| 1 | Versão do Node.js exigida (o `package.json` não declara `engines`) | [2](02-como-rodar.md), [arquitetura](engenharia/arquitetura.md#8-tecnologias-e-versões) |
| 2 | Onde o front é publicado em produção e qual URL de API usa | [13](13-build-deploy.md), [arquitetura](engenharia/arquitetura.md#10-implantação) |
| 3 | Telefone, endereço e CNPJ da ONG (o código diz que são exemplos) | [14 C1](14-pontos-de-atencao.md#conteúdo-e-regras-a-confirmar), [9](09-hooks-utils.md#constantes-de-conteúdo) |
| 4 | Idade mínima (18 anos) e documentos exigidos para o termo | [14 C2](14-pontos-de-atencao.md#conteúdo-e-regras-a-confirmar), [5](05-componentes/catalogo-perfil-adocao.md#howadoptionworkspage), [requisitos RF16](engenharia/requisitos.md#site-público) |
| 5 | Textos das etapas padrão usados quando a API não responde | [14 C4](14-pontos-de-atencao.md#conteúdo-e-regras-a-confirmar) |
| 6 | Fuso do navegador × horário de Brasília nos campos de data/hora do painel | [14 U3](14-pontos-de-atencao.md#usabilidade-e-consistência) |
| 7 | Data de entrada padrão do animal calculada em UTC | [14 U4](14-pontos-de-atencao.md#usabilidade-e-consistência), [11](11-formularios.md#animal-animalformdialog) |
| 8 | Prioridades (alta/média/baixa) dos requisitos funcionais, atribuídas por esta documentação | [requisitos](engenharia/requisitos.md) |

### ⚠️ inferido, confirmar (7)

| # | Ponto | Onde |
| --- | --- | --- |
| 1 | RF51 — deveria haver tela para o membro trocar a própria senha? (a API oferece) | [requisitos](engenharia/requisitos.md#painel-administrativo) |
| 2 | RF52 — deveria haver exportação CSV de animais e doações? (a API oferece) | [requisitos](engenharia/requisitos.md#painel-administrativo) |
| 3 | RN29 / C3 — a promessa de contato "em até 48 horas" é uma regra da ONG? | [requisitos](engenharia/requisitos.md#3-regras-de-negócio), [14 C3](14-pontos-de-atencao.md#conteúdo-e-regras-a-confirmar) |
| 4 | Motivo da organização por funcionalidade (AD02) | [arquitetura](engenharia/arquitetura.md#2-visão-geral-e-padrão) |
| 5 | Motivo de não ter store global (AD06) | [arquitetura](engenharia/arquitetura.md#7-decisões-arquiteturais) |
| 6 | Motivo do CSS puro por componente (AD09) | [arquitetura](engenharia/arquitetura.md#7-decisões-arquiteturais) |
| 7 | Alternativas das decisões AD02, AD03 e AD06–AD13, listadas por esta documentação (não registradas no código) | [arquitetura](engenharia/arquitetura.md#7-decisões-arquiteturais) |

Os demais ⚠️ do texto são **alertas sobre fatos verificados no código** (ex.: campo-armadilha da doação não enviado,
`patas_admin_user` nunca lido, funcionalidades sem tela, fonte sem uso) e estão todos em
[14. Pontos de atenção](14-pontos-de-atencao.md).

## Manutenção desta documentação

Ao mudar o código, atualize junto: a ficha do componente (seção 5) e o índice de componentes; a tabela de chamadas
(seção 7) quando um serviço mudar; a tabela de rotas (seção 4); as regras de formulário (seção 11). O
`README.md` da raiz do repositório está desatualizado em várias partes e pode apontar para esta pasta.
