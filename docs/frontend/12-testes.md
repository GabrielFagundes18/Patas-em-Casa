# 12. Testes

## Organização

- **Jest** (do `react-scripts`) + **Testing Library** (`@testing-library/react`, `jest-dom`); ambiente jsdom.
- Arquivos `*.test.js` **ao lado do código** testado: 21 arquivos, **91 testes** (resultado em 2026-10-07: 91
  aprovados, 0 falhas, ≈ 4 s).
- `src/setupTests.js`: importa `jest-dom`; implementa `HTMLDialogElement.showModal/close` (o jsdom não tem) e expõe a
  Web Crypto quando falta (usada por `generatePassword`).
- Estratégia: **os serviços de API são substituídos por mocks** (`jest.mock('api/animals')`, `jest.mock('./teamService')`
  etc.); as telas são renderizadas em `MemoryRouter`; consultas pela árvore acessível (`getByRole`, `getByLabelText`);
  interações com `fireEvent` do Testing Library (o pacote `user-event` não é usado). `IntersectionObserver` recebe stub onde é preciso. Não há
  testes contra a API real nem testes de ponta a ponta no navegador.

## Como rodar

| Comando | O que faz |
| --- | --- |
| `npm test` | Modo observação (roda os testes dos arquivos alterados) |
| `CI=true npm test -- --watchAll=false` | Todos, uma vez |
| `CI=true npm test -- --watchAll=false --coverage` | Com relatório de cobertura (em `coverage/`, ignorada pelo Git) — não há meta configurada |

Avisos esperados no console: "React Router Future Flag Warning" (`v7_startTransition`, `v7_relativeSplatPath`).

## Arquivos e o que cobrem

| Arquivo | Testes | Cobre |
| --- | ---: | --- |
| `app/App.test.js` | 9 | Home e link ao catálogo; catálogo → perfil → formulário; login em `/admin/login`; menu e rotas do painel conforme permissões; sessão expirada volta ao login; destaque do primeiro urgente; histórias e etapas da API; 404; rota do painel sem sessão vai ao login guardando a página |
| `features/home/LandingPage.test.js` | 4 | Vitrine com 4 (urgentes primeiro); atalho de doação abre `/doar` com tipo e valor; inscrição de voluntário exige área e confirma; anos de atuação |
| `features/catalog/AdoptionCatalog.test.js` | 10 | Erro com nova tentativa; menu/rodapé e urgentes primeiro; link antigo `?pet=`; filtros rápidos na URL; URL aplicada ao abrir; chips da gaveta; busca com espera e por temperamento; favoritos; compartilhar; placeholder de foto e convite no fim |
| `features/catalog/catalogFilters.test.js` | 11 | Regras puras de filtro, faixas de idade, temperamento, busca sem acento, ordenações, chips, ida e volta pela URL, valores desconhecidos |
| `features/animal-profile/AnimalProfilePage.test.js` | 3 | Galeria, temperamento, saúde e abertura do formulário; animal adotado (410); animal inexistente |
| `features/adoption/AdoptionFormModal/AdoptionFormModal.test.js` | 7 | Os 3 passos, revisão e formato enviado; erros por passo; erro da API leva ao passo; falha de conexão; formatação do telefone; texto `rotina` em ordem fixa |
| `features/adoption/HowAdoptionWorksPage.test.js` | 1 | Etapas, requisitos, documentos e chamada |
| `features/donation/DonationPages.test.js` | 4 | Envio e redirecionamento ao Mercado Pago; 503 aponta para o Pix; retorno confirmado; cancelamento com token e pedido de link |
| `shared/utils/petMapper.test.js` | 4 | Mapeamento, não inventar dados, só a data, idade em meses/anos |
| `shared/utils/petText.test.js` | 3 | Tempo de espera, data inválida, concordância com o sexo |
| `admin/security/AdminLoginPage.test.js` | 3 | Sem conexão; mensagem de credenciais; sessão gravada |
| `admin/security/AdminPasswordPages.test.js` | 3 | Esqueci a senha; convite cria senha e volta ao login; link expirado |
| `admin/dashboard/DashboardOverview.test.js` | 2 | Indicadores, listas e agenda; erro com nova tentativa |
| `admin/animals/AnimalsPage.test.js` | 3 | Lista com status e cuidados; filtros na URL; cadastro com os campos atuais |
| `admin/animals/AnimalPhotos.test.js` | 2 | Enviar, trocar principal, remover; erro da API |
| `admin/adoptions/AdoptionsPage.test.js` | 6 | Lista e filtros; detalhe com respostas; recusa com justificativa; agendar visita com e-mail (e aviso de falha); entrevista sem e-mail; remarcar e cancelar |
| `admin/adopters/AdoptersPage.test.js` | 4 | Contatos mascarados e filtro por UF; revelar libera edição e só envia o que mudou; anonimizar exige a palavra; sem `lgpd:approve` as ações somem |
| `admin/donations/DonationsPage.test.js` | 3 | Doação manual; online não editável; cancelar mensal |
| `admin/stories/StoriesPage.test.js` | 3 | Criar publicada com animal; publicar rascunho; somente leitura sem botões |
| `admin/team/TeamPage.test.js` | 5 | Adicionar com senha; detalhes da política vindos da API; sem `team:create`; convite e aviso de falha; editar, nova senha, reenviar convite |
| `admin/volunteers/VolunteersPage.test.js` | 1 | Adicionar voluntário |

## Cobertura medida (2026-10-07)

Total: **74,6% das linhas**, 73,2% das instruções, 69,0% dos ramos, 67,4% das funções.

| Faixa | Arquivos |
| --- | --- |
| 100% | `App`, `NotFoundPage`, `HowAdoptionWorksPage`, `Hero`, `PetSection`, `HowItWorks`, `Donation`, `AnimalCard`, `Footer`, `PublicLayout`, `FilterGroup`, `AdminLoginPage`, `AdminAuthShell`, `TeamMemberDialog`, `FormError`, `ListState`, `useAdoptionSteps`, `useAvailableAnimals`, `petMapper`, `petText`, `catalogFilters` e as constantes |
| 80–99% | `DonationReturnPage` (96), `Stories` (93), `AdoptionFormModal` (92), `StoryFormDialog` (91), `DonationFormDialog` (91), `useFavorites`, `AnimalPhotos`, `AdminForgotPasswordPage` (90), `SubscriptionsSection` (89), `TeamPage` (89), `usePaginatedList` (88), `AnimalProfilePage`, `DonationPage`, `AdminResetPasswordPage` (87–88), `Header` (87), `VolunteerFormDialog` (85), `AnimalFormDialog` (84), `CancelSubscriptionPage`, `RequireAdminSession`, `DashboardCharts` (83), `AdoptionDetailDialog` (83), `ResetPasswordDialog`, `AdopterDetailDialog` (82), `AdoptionCatalog` (81), `DonationsPage`, `PetPhoto` (80) |
| 50–79% | `AdoptionsPage` (79), `VolunteerSignup` (78), `AdminDialog` (78), `LandingPage` (76), `StoriesPage` (75), `FilterDrawer` (73), `DashboardOverview` (70), `useDialog`, `VolunteersPage` (65), `AdminDashboardPage` (64), `StatsStrip` (63), `AdoptersPage` (62), `Pagination` (60), `PixKey`, `sharePet` (55), `AnimalsPage` (54), `SearchField` (50) |
| < 50% | `AdminLayout` (48), **`api/client.js` (28)** |
| 0% | Todos os serviços (`api/*.js` públicos e `admin/*/…Service.js`), `downloadFile.js`, `index.js` — sempre substituídos por mocks |

## O que não está coberto

- **Interceptores do Axios** (`api/client.js`): renovação de sessão, fila de chamadas simultâneas, falha de rede na
  renovação, envio do token. O teste de sessão expirada do `App.test.js` simula o evento, não o interceptor.
- **Contrato com a API**: as URLs, métodos e corpos dos serviços nunca são exercitados (mocks em todas as telas). Uma
  mudança de rota na API não quebraria nenhum teste do front.
- `AdminLayout`: busca no menu, atalho Ctrl/⌘+K, menu móvel com foco preso, ajuda e avisos.
- `AnimalsPage`: ordenação, paginação, mudança de status com motivo (`window.prompt`), exclusão.
- `DashboardOverview`: atualização automática, troca de fonte/período, exportação da agenda.
- `sharePet` com Web Share API; `PixKey` (cópia); paginação e busca do painel; exportação CSV de adotantes e JSON do
  titular (`downloadFile`).
- Responsividade e aparência (não há testes visuais); acessibilidade só pelo uso de consultas por papel/rótulo (sem
  `jest-axe`).
