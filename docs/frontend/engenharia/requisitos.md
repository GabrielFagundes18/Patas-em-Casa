# Requisitos do front-end

Requisitos **extraídos do código** do front (engenharia reversa). Regras que só a API aplica estão na documentação do
back-end; aqui entram as que o front implementa ou expõe.

| Status | Significado |
| --- | --- |
| Implementado | Existe no código, com tela/componente identificável |
| Parcialmente implementado | Existe com lacuna conhecida (descrita na linha e em [14](../14-pontos-de-atencao.md)) |
| ⚠️ inferido, confirmar | O código sugere a intenção, mas ela não está explícita; precisa de confirmação |

**Prioridade** (alta/média/baixa): ⚠️ atribuída por esta documentação conforme o peso no fluxo principal (adotar,
doar, operar o painel); o código não registra prioridades. Confirmar com a ONG.

Atores: **Visitante**, **Membro da equipe**, **Administrador**, **API Patas em Casa** (sistema), **Mercado Pago** (sistema).

## 1. Requisitos funcionais

### Site público

| ID | Nome | Descrição | Ator | Prioridade | Onde | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RF01 | Página inicial | Home com topo, números, vitrine, etapas, doação, histórias e voluntariado | Visitante | alta | `LandingPage` | Implementado |
| RF02 | Números da ONG | Resgatados, adoções, aguardando lar (API) e anos de atuação (calculado) com contagem animada | Visitante | média | `StatsStrip`, `api/content.buscarNumeros` | Implementado |
| RF03 | Destaque e vitrine | Destacar o primeiro urgente e mostrar 4 animais com urgentes primeiro | Visitante | alta | `Hero`, `PetSection` | Implementado |
| RF04 | Histórias | Mostrar até 3 histórias publicadas; esconder a seção se não houver | Visitante | baixa | `Stories` | Implementado |
| RF05 | Etapas da adoção | Mostrar as etapas cadastradas (com padrão se a API falhar) | Visitante | média | `HowItWorks`, `HowAdoptionWorksPage`, `useAdoptionSteps` | Implementado |
| RF06 | Busca no catálogo | Buscar por nome, raça, linha de resumo (espécie, raça, idade, porte) ou temperamento, sem acento/maiúscula | Visitante | alta | `AdoptionCatalog`, `catalogFilters.filterPets` | Implementado |
| RF07 | Filtros | Filtros rápidos e gaveta (espécie, porte, idade, sexo, temperamento, castrado, vacinado, urgentes) com chips removíveis | Visitante | alta | `AdoptionCatalog`, `FilterDrawer` | Implementado |
| RF08 | Ordenação | Urgentes primeiro, esperando há mais tempo, chegaram por último, nome | Visitante | média | `catalogFilters.sortPets` | Implementado |
| RF09 | Favoritos | Marcar animais com coração e filtrar "Meus favoritos", sem cadastro | Visitante | baixa | `useFavorites`, `AnimalCard` | Implementado |
| RF10 | Compartilhar | Compartilhar o link do perfil (Web Share ou copiar) | Visitante | baixa | `sharePet`, `AnimalCard`, `AnimalProfilePage` | Implementado |
| RF11 | Busca compartilhável | Busca, filtros e ordem na URL; voltar do navegador mantém a busca | Visitante | média | `readCatalogParams`/`writeCatalogParams` | Implementado |
| RF12 | Carregamento progressivo | Mostrar 8 cartões por vez, carregando mais ao rolar ou no botão | Visitante | média | `AdoptionCatalog` | Implementado |
| RF13 | Perfil do animal | Página com galeria, dados, temperamento, saúde e chegada | Visitante | alta | `AnimalProfilePage` | Implementado |
| RF14 | Animal indisponível | Mensagens próprias para adotado/em processo (410) e inexistente (404) | Visitante | média | `AnimalProfilePage` | Implementado |
| RF15 | Pedido de adoção | Formulário em 3 passos, revisão e protocolo | Visitante, API | alta | `AdoptionFormModal`, `api/adoptions` | Implementado |
| RF16 | Como funciona | Etapas, requisitos, documentos, dúvidas e contato | Visitante | média | `HowAdoptionWorksPage`, `adoptionGuide` | Implementado (textos ⚠️ a confirmar) |
| RF17 | Doação online | Doação única ou mensal pelo Mercado Pago, com valor sugerido ou livre | Visitante, API, Mercado Pago | alta | `DonationPage`, `api/donations.iniciarDoacao` | Implementado |
| RF18 | Atalho de doação | Escolher tipo e valor na Home e seguir para `/doar` já preenchido | Visitante | média | `Donation`, `donationPath` | Implementado |
| RF19 | Chave Pix | Mostrar e copiar a chave Pix | Visitante | média | `PixKey` | Implementado |
| RF20 | Retorno da doação | Consultar e mostrar a situação ao voltar do Mercado Pago, repetindo enquanto pendente | Visitante, API | média | `DonationReturnPage` | Implementado |
| RF21 | Cancelar doação mensal | Pedir link por e-mail e cancelar com o token do link | Visitante, API | média | `CancelSubscriptionPage` | Implementado |
| RF22 | Inscrição de voluntário | Nome, e-mail, telefone e áreas; protocolo | Visitante, API | média | `VolunteerSignup`, `api/volunteers` | Implementado |
| RF23 | Página não encontrada | 404 com caminhos de volta | Visitante | baixa | `NotFoundPage` | Implementado |
| RF24 | Navegação do site | Menu (com gaveta no celular), rodapé com contatos, "pular para o conteúdo", âncoras da Home | Visitante | média | `Header`, `Footer`, `PublicLayout` | Implementado |

### Painel administrativo

| ID | Nome | Descrição | Ator | Prioridade | Onde | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RF25 | Login | Entrar com e-mail e senha, voltando à página pedida | Membro | alta | `AdminLoginPage`, `authService.loginAdmin` | Implementado |
| RF26 | Recuperar acesso | "Esqueci minha senha" e criar/redefinir senha pelo link (inclui convite) | Membro | alta | `AdminForgotPasswordPage`, `AdminResetPasswordPage` | Implementado |
| RF27 | Sessão contínua | Renovar o token automaticamente e avisar quando a sessão expirar | Membro, API | alta | `api/client.js`, `AdminDashboardPage` | Implementado |
| RF28 | Sair | Encerrar a sessão no servidor e no navegador | Membro | alta | `AdminLayout`, `AdminDashboardPage` | Implementado |
| RF29 | Acesso por cargo | Menu, abas e botões conforme as permissões de `/me` | Membro | alta | `AdminLayout`, `AdminDashboardPage`, telas | Implementado |
| RF30 | Navegação do painel | Menu recolhível, gaveta no celular, busca no menu (Ctrl/⌘+K), trilha | Membro | baixa | `AdminLayout` | Implementado |
| RF31 | Indicadores | Visão geral com cartões, gráficos, listas e agenda, atualizada a cada 60 s | Membro | média | `DashboardOverview`, `DashboardCharts` | Implementado |
| RF32 | Exportar agenda | Baixar a agenda filtrada em CSV | Membro | baixa | `DashboardOverview.exportAgenda` | Implementado |
| RF33 | Listar animais | Tabela com 9 filtros, ordenação por nome e paginação na URL | Membro | alta | `AnimalsPage` | Implementado |
| RF34 | Cadastrar/editar animal | Ficha completa; após cadastrar, segue para as fotos | Membro | alta | `AnimalFormDialog` | Implementado |
| RF35 | Status do animal | Mudar o status na tabela, informando motivo quando exigido | Membro, Administrador | alta | `AnimalsPage.changeStatus` | Implementado |
| RF36 | Excluir animal | Excluir com confirmação | Membro | média | `AnimalsPage.removeAnimal` | Implementado |
| RF37 | Fotos do animal | Enviar, escolher principal e remover (até 12) | Membro | alta | `AnimalPhotos` | Implementado |
| RF38 | Listar pedidos | Pedidos com filtros (busca, status, prioridade) | Membro | alta | `AdoptionsPage` | Implementado |
| RF39 | Detalhe do pedido | Dados mascarados, revelar contatos, respostas e histórico | Membro | alta | `AdoptionDetailDialog` | Implementado |
| RF40 | Agenda do pedido | Agendar, remarcar, cancelar e concluir visita/entrevista, com e-mail opcional | Membro | alta | `SchedulePanel`, `ReschedulePanel`, `CancelAppointmentPanel` | Implementado |
| RF41 | Decisão do pedido | Aprovar ou recusar com justificativa interna e aviso opcional | Membro | alta | `DecisionPanel` | Implementado |
| RF42 | Triagem completa | Mover status, prioridade, responsável, anotações e registrar termo assinado | Membro | alta | — | Parcialmente implementado (só agenda e decisão; F1, F2) |
| RF43 | Listar e exportar adotantes | Lista mascarada com filtros e exportação CSV | Membro | média | `AdoptersPage` | Implementado |
| RF44 | Ficha do adotante | Histórico, revelar e editar (contatos só após revelar) | Membro | média | `AdopterDetailDialog`, `EditForm` | Implementado |
| RF45 | Direitos do titular | Exportar dados (JSON), anonimizar e excluir com palavra de confirmação | Administrador | alta | `AdopterDetailDialog`, `LgpdPanel` | Implementado |
| RF46 | Doações | Resumo, lista com filtros, registro e edição manual | Membro | média | `DonationsPage`, `DonationFormDialog` | Implementado |
| RF47 | Doações mensais | Listar assinaturas e cancelar | Membro, Mercado Pago (via API) | média | `SubscriptionsSection` | Implementado |
| RF48 | Histórias | Criar, editar, publicar/despublicar e excluir | Membro | média | `StoriesPage`, `StoryFormDialog` | Implementado |
| RF49 | Voluntários | Listar, filtrar, adicionar, editar, ativar e excluir | Membro | média | `VolunteersPage`, `VolunteerFormDialog` | Parcialmente implementado (sem editar/ativar/excluir; F3) |
| RF50 | Equipe | Listar, adicionar (convite ou senha), editar, nova senha, reenviar convite | Administrador | alta | `TeamPage`, `TeamMemberDialog`, `ResetPasswordDialog` | Implementado |
| RF51 | Trocar a própria senha | Membro troca a senha sem o administrador | Membro | média | — | ⚠️ inferido, confirmar (a API oferece; o front não) |
| RF52 | Exportar animais e doações | CSV de animais e de doações | Membro | baixa | — | ⚠️ inferido, confirmar (a API oferece; o front não) |

## 2. Requisitos não funcionais

| ID | Categoria | Descrição | Como o código atende (ou não) | Status |
| --- | --- | --- | --- | --- |
| RNF01 | Desempenho | Visitantes não baixam o código do painel | `React.lazy` nas 4 páginas do painel + `Suspense` | Implementado |
| RNF02 | Desempenho | Catálogo responsivo à digitação | Busca com espera de 300 ms; filtros com `useMemo`; lotes de 8 | Implementado |
| RNF03 | Desempenho | Imagens leves | `fundo.webp` (97 KB) com `fetchPriority="high"`; fotos com `loading="lazy"` e `decoding="async"` | Implementado |
| RNF04 | Desempenho | Escalar com o número de animais | Baixa todos os animais e filtra no navegador; sem cache entre páginas | Parcialmente implementado (P1) |
| RNF05 | Desempenho | Carregar fontes sem bloquear | `@import` no CSS (bloqueante) e uma família sem uso | Parcialmente implementado (P2) |
| RNF06 | Segurança | Sessão curta e renovável | Token de 15 min; cookie HttpOnly de renovação; `X-Requested-With` contra CSRF; renovação única para chamadas simultâneas | Implementado |
| RNF07 | Segurança | Proteger credenciais no navegador | Token no `localStorage`; sem CSP | Parcialmente implementado (S1) |
| RNF08 | Segurança | Interface coerente com as permissões | Menu, abas e botões por `permissions` (a API continua autorizando) | Implementado |
| RNF09 | Privacidade (LGPD) | Expor dados pessoais só quando necessário | Contatos mascarados; revelar é ação explícita e avisa da auditoria; palavra de confirmação em ações irreversíveis; nenhum dado pessoal nos links compartilhados | Implementado |
| RNF10 | Segurança | Barrar robôs nos formulários públicos | Campo-armadilha `website` no pedido e na inscrição; na doação o campo existe mas não é enviado | Parcialmente implementado (S2) |
| RNF11 | Usabilidade | Estados claros | Carregando, erro com "Tentar novamente" e vazio nas listas; mensagens em português da API | Parcialmente implementado (falhas silenciosas, U6) |
| RNF12 | Usabilidade | Formulário longo fácil no celular | 3 passos, validação por passo, mensagem ao lado do campo, foco no erro, telefone formatado, confirmação ao sair | Implementado |
| RNF13 | Acessibilidade | Navegação por teclado e leitor de tela | Skip link; `lang="pt-BR"`; diálogos com foco preso e Esc; `aria-*`; gráficos com texto alternativo; `:focus-visible`; "reduzir movimento" no CSS e JS | Implementado |
| RNF14 | Acessibilidade | Diálogos consistentes | Algumas ações usam `window.prompt`/`confirm` | Parcialmente implementado (U1) |
| RNF15 | Compatibilidade | Navegadores atuais | `browserslist`: `>0.2%`, `not dead`, `not op_mini all`; fallbacks para `matchMedia`/`addListener`, `navigator.share`, Clipboard, `localStorage` bloqueado | Implementado |
| RNF16 | Responsividade | Celular a desktop | Media queries em todos os CSS; menu móvel no site (gaveta) e no painel (900 px); tabelas do painel com `data-label`; gráfico mensal com rolagem | Implementado |
| RNF17 | Manutenibilidade | Código organizado | Pastas por funcionalidade, imports absolutos, comentários "O quê/Como/Para quê" | Parcialmente implementado (duplicações D1–D9, sem tipos) |
| RNF18 | Testabilidade | Testes automatizados | 21 arquivos, 91 testes, 74,6% das linhas | Parcialmente implementado (serviços 0%, T1) |
| RNF19 | Robustez | Falhas de rede não quebram a tela | `AbortController` nas buscas, mensagens de conexão, renovação que não desloga por rede | Parcialmente implementado (sem timeout, P4) |
| RNF20 | Configuração | Apontar para outra API | `REACT_APP_API_URL` (no build) | Implementado |
| RNF21 | SEO | Encontrável em buscadores | Título e descrição no `index.html`; `document.title` no perfil; SPA sem renderização no servidor | Parcialmente implementado |

## 3. Regras de negócio

| ID | Regra | Onde | Status |
| --- | --- | --- | --- |
| RN01 | Um animal é "urgente" quando o status da API é `urgente`; espécie desconhecida vira "Outro"; raça vazia vira "SRD" | `petMapper.mapPetFromApi` | Implementado |
| RN02 | Urgentes primeiro na vitrine (4) e na ordenação padrão; empate por tempo de espera e depois nome | `pickShowcase`, `sortPets` | Implementado |
| RN03 | O destaque do topo é o primeiro urgente (ou o primeiro animal) | `pickHighlight` | Implementado |
| RN04 | Faixas de idade: filhote < 1, jovem 1–2, adulto 3–7, idoso 8+; sem idade não entra em faixa | `AGE_GROUPS`, `ageGroupOf` | Implementado |
| RN05 | Temperamento: o animal precisa ter todos os traços escolhidos; até 10 traços na URL | `filterPets`, `readCatalogParams` | Implementado |
| RN06 | Favoritos ficam só no navegador | `useFavorites` | Implementado |
| RN07 | Pedido de adoção: nome 2+, e-mail válido, telefone com 10–13 dígitos, cidade 2+, moradia, moradores, outros animais e tempo em casa obrigatórios, visita sugerida não pode ser passada, duas confirmações obrigatórias | `validateStep` | Implementado |
| RN08 | "Só eu" e "Não tenho" excluem as outras opções do grupo | `EXCLUSIVE`, `toggleInGroup` | Implementado |
| RN09 | As respostas do passo 2 vão no texto `rotina` em ordem fixa (Moradia, Mora com, Outros animais, Tempo em casa, texto livre) | `composeRotina` | Implementado |
| RN10 | Fechar o pedido com dados não enviados pede confirmação | `AdoptionFormModal.requestClose` | Implementado |
| RN11 | Doação online entre R$ 5 e R$ 10.000, com 2 casas; sugeridos 25/50/100/200; padrão em `/doar`: única de R$ 50; na Home: mensal de R$ 50 | `DonationPage`, `Donation` | Implementado |
| RN12 | Na volta do pagamento, consultar até 6 vezes, a cada 3 s, enquanto estiver pendente | `DonationReturnPage` | Implementado |
| RN13 | Inscrição de voluntário exige ao menos uma área | `VolunteerSignup` | Implementado |
| RN14 | Sessão: renovar uma vez por 401; renovação recusada → sair com aviso; falha de rede na renovação não desloga | `api/client.js` | Implementado |
| RN15 | Menu, aba e botões aparecem só com a permissão correspondente | `adminNavigation`, telas | Implementado |
| RN16 | Mudança de status que exige motivo (inativar, devolver) pede o motivo e tenta de novo | `AnimalsPage.changeStatus` | Implementado |
| RN17 | Depois de cadastrar um animal, o formulário continua aberto em edição para as fotos; até 12 fotos; a primeira vira principal | `AnimalsPage.saveAnimal`, `AnimalPhotos` | Implementado |
| RN18 | Decisão exige justificativa interna de 10+ caracteres; aviso por e-mail vem ligado; a mensagem só vai se avisar | `DecisionPanel` | Implementado |
| RN19 | Agenda: data e hora futuras; duração de 30 a 120 min (padrão 60); sugestão do adotante pré-preenchida se futura | `SchedulePanel` | Implementado |
| RN20 | Contatos do adotante só podem ser editados depois de revelados; só os campos alterados são enviados | `EditForm` | Implementado |
| RN21 | Anonimizar/excluir titular exige digitar exatamente `ANONIMIZAR`/`EXCLUIR` | `LgpdPanel` | Implementado |
| RN22 | Doação online (com `gateway`) e doação cancelada não têm edição | `DonationsPage` | Implementado |
| RN23 | Doação manual: data não pode ser futura e é gravada ao meio-dia de Brasília; e-mail mascarado não é reenviado na edição | `DonationFormDialog` | Implementado |
| RN24 | História só pode ser vinculada a animal adotado; o site mostra só as publicadas | `StoryFormDialog`, `Stories` | Implementado |
| RN25 | Novo membro entra por convite (link de 72 h) ou senha inicial; senha gerada com 14 caracteres sem caracteres ambíguos; desativar alguém avisa que ele sai na hora | `TeamMemberDialog` | Implementado |
| RN26 | Nova senha: 10 a 72 caracteres e confirmação igual | `AdminResetPasswordPage`, `PasswordField` | Implementado |
| RN27 | Após o login, voltar à página do painel que a pessoa tentou abrir | `RequireAdminSession`, `AdminLoginPage` | Implementado |
| RN28 | Sem token, nenhuma tela do painel aparece; `/me` com 401/404 encerra a sessão local | `RequireAdminSession`, `AdminDashboardPage` | Implementado |
| RN29 | O contato da equipe com o adotante acontece "em até 48 horas" | `AdoptionFormModal` (texto) | ⚠️ inferido, confirmar |

## 4. Matriz de rastreabilidade

Requisito → caso de uso ([casos-de-uso.md](casos-de-uso.md)) → telas/componentes/arquivos.

| Requisito | Caso de uso | Telas / componentes / arquivos |
| --- | --- | --- |
| RF01–RF05 | UC01 Navegar pela Home | `LandingPage`, `Hero`, `StatsStrip`, `PetSection`, `HowItWorks`, `Stories`, `useAvailableAnimals`, `useAdoptionSteps`, `api/content.js` |
| RF06–RF08, RF11, RF12 | UC02 Buscar e filtrar animais | `AdoptionCatalog`, `FilterDrawer`, `FilterGroup`, `catalogFilters.js`, `catalogOptions.js` |
| RF09 | UC03 Favoritar animal | `useFavorites`, `AnimalCard` |
| RF10 | UC04 Compartilhar animal | `sharePet.js`, `AnimalCard`, `AnimalProfilePage` |
| RF13, RF14 | UC05 Ver perfil do animal | `AnimalProfilePage`, `Gallery`, `api/animals.buscarAnimal`, `petMapper` |
| RF15 | UC06 Solicitar adoção | `AdoptionFormModal`, `api/adoptions.js`, `useDialog` |
| RF16 | UC07 Consultar "Como funciona" | `HowAdoptionWorksPage`, `adoptionGuide.js` |
| RF17, RF18 | UC08 Doar online | `Donation`, `DonationPage`, `api/donations.iniciarDoacao` |
| RF19 | UC12 Copiar chave Pix | `PixKey`, `organization.js` |
| RF20 | UC09 Acompanhar doação | `DonationReturnPage`, `api/donations.consultarDoacao` |
| RF21 | UC10 Cancelar doação mensal | `CancelSubscriptionPage`, `api/donations.js` |
| RF22 | UC11 Inscrever-se como voluntário | `VolunteerSignup`, `volunteerAreas.js`, `api/volunteers.js` |
| RF23, RF24 | UC01 | `NotFoundPage`, `Header`, `Footer`, `PublicLayout` |
| RF25 | UC13 Entrar no painel | `AdminLoginPage`, `AdminAuthShell`, `authService.loginAdmin`, `RequireAdminSession` |
| RF26 | UC14 Recuperar acesso | `AdminForgotPasswordPage`, `AdminResetPasswordPage`, `authService` |
| RF27 | UC16 Manter sessão | `api/client.js`, `AdminDashboardPage` |
| RF28 | UC15 Sair | `AdminLayout`, `AdminDashboardPage`, `authService.logoutAdmin` |
| RF29, RF30 | UC13, todos do painel | `AdminDashboardPage`, `AdminLayout`, `adminNavigation.js` |
| RF31, RF32 | UC17 Consultar indicadores, UC18 Exportar agenda | `DashboardOverview`, `DashboardCharts`, `dashboardService` |
| RF33, RF34, RF36 | UC19 Gerenciar animais | `AnimalsPage`, `AnimalFormDialog`, `animalService`, `animalOptions.js` |
| RF35 | UC20 Mudar status do animal | `AnimalsPage.changeStatus`, `animalService.updateAnimalStatus` |
| RF37 | UC21 Gerenciar fotos | `AnimalPhotos`, `animalService` |
| RF38, RF39 | UC22 Analisar pedido | `AdoptionsPage`, `AdoptionDetailDialog`, `AdoptionDetailBody`, `adoptionService` |
| RF40 | UC23 Agendar visita/entrevista | `SchedulePanel`, `ReschedulePanel`, `CancelAppointmentPanel`, `AppointmentsSection`, `DurationField` |
| RF41 | UC24 Decidir pedido | `DecisionPanel`, `adoptionService` |
| RF42 | UC22 (parcial) | — |
| RF43, RF44 | UC25 Gerenciar adotantes | `AdoptersPage`, `AdopterDetailDialog`, `EditForm`, `adopterService`, `downloadFile` |
| RF45 | UC26 Atender direitos do titular | `AdopterDetailDialog`, `LgpdPanel`, `adopterService` |
| RF46 | UC27 Gerenciar doações | `DonationsPage`, `DonationFormDialog`, `donationService` |
| RF47 | UC28 Gerenciar doações mensais | `SubscriptionsSection`, `donationService` |
| RF48 | UC29 Gerenciar histórias | `StoriesPage`, `StoryFormDialog`, `storyService` |
| RF49 | UC30 Adicionar voluntário | `VolunteersPage`, `VolunteerFormDialog`, `volunteerService` |
| RF50 | UC31 Gerenciar equipe | `TeamPage`, `TeamMemberDialog`, `PasswordField`, `ResetPasswordDialog`, `teamService` |
| RF51, RF52 | — (não implementados) | — |
| RNF01 | — | `src/app/App.js` (`lazy`) |
| RNF06, RNF14 | UC16 | `api/client.js` |
| RNF09 | UC22, UC25, UC26 | `AdoptionDetailDialog`, `AdopterDetailDialog` |
| RNF13 | todos | `useDialog`, `AdminDialog`, `PublicLayout`, CSS |
