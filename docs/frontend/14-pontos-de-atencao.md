# 14. Pontos de atenção

Encontrados ao ler o código para esta documentação. Nada foi alterado. Itens com ⚠️ dependem de decisão ou informação
que o código não dá. TODOs no código: não há `TODO`/`FIXME`; há dois avisos "ATENÇÃO" (itens C1 e C2).

## Conteúdo e regras a confirmar

| # | Ponto | Onde | Efeito |
| --- | --- | --- | --- |
| C1 | ⚠️ **Telefone, endereço e CNPJ da ONG são valores de exemplo** (o próprio arquivo avisa: "substitua pelos reais antes de publicar") | `shared/constants/organization.js` | Aparecem no rodapé, na chave Pix (CNPJ) e nas páginas — dados falsos publicados |
| C2 | ⚠️ Requisitos de idade mínima (18 anos) e documentos para o termo são "os usuais" e "a ONG deve confirmar antes de publicar" | `features/adoption/adoptionGuide.js` | Texto da página "Como funciona" |
| C3 | ⚠️ O formulário promete contato "em até 48 horas" | `AdoptionFormModal` (tela de confirmação) | Compromisso que o sistema não controla |
| C4 | ⚠️ Etapas padrão genéricas ("Navegue pelos pets disponíveis perto de você", "Converse com o abrigo") aparecem se a API não responder ou não tiver etapas | `useAdoptionSteps.defaultSteps` | Texto diferente do processo real da ONG |

## Funcionalidades incompletas (a interface sugere, mas não oferece)

| # | Ponto | Onde | API disponível |
| --- | --- | --- | --- |
| F1 | Não há como **marcar o termo de adoção como assinado**; o aviso de aprovação diz "Quando o termo for assinado, registre no pedido" e o dashboard lista "Termo a assinar" | `AdoptionDetailDialog` | `POST /adoption-requests/:id/term-signed` |
| F2 | Não há triagem manual: mudar status entre abertos, prioridade, responsável e **anotações** | `AdoptionDetailDialog` | `PATCH /adoption-requests/:id` |
| F3 | Voluntários: não dá para **editar, ativar nem excluir**; inscrições do site "chegam como inativas, aguardando triagem" sem forma de aprovar | `VolunteersPage` | `PATCH`/`DELETE /volunteers/:id` |
| F4 | Sem tela para **trocar a própria senha** | Painel | `PATCH /me/password` |
| F5 | Sem exportação CSV de animais e de doações (só de adotantes e da agenda) | `AnimalsPage`, `DonationsPage` | `GET /animals/export`, `/donations/export` |
| F6 | "Avisos" e "Central de ajuda" são marcadores fixos ("Não há avisos…", "canal ainda não configurado") | `AdminLayout` | — |
| F7 | O quadro de pedidos por status (kanban) e a série mensal de doações não são usados | — | `GET /adoption-requests/board`, `/donations/monthly` |

## Segurança

| # | Ponto | Onde | Efeito |
| --- | --- | --- | --- |
| S1 | Token de acesso no `localStorage` | `api/client.js`, `AdminLoginPage` | Um script injetado (XSS) consegue lê-lo. Atenuantes: o token vale 15 min, o React escapa conteúdo e não há `dangerouslySetInnerHTML`. Não há Content-Security-Policy no `index.html` |
| S2 | Campo-armadilha `website` da doação **não é enviado** à API | `DonationPage` (`iniciarDoacao` só manda `valor, nome, email, tipo`) | A proteção anti-robô da API não funciona na doação online |
| S3 | `patas_admin_user` (nome, e-mail, cargo) é gravado e **nunca lido**; só some no logout ou com sessão expirada | `AdminLoginPage`, `api/client.js` | Dado pessoal guardado sem necessidade |
| S4 | O token salvo vai também nas chamadas públicas | Interceptor de requisição | Exposição desnecessária do token (a API ignora) |
| S5 | A proteção de rotas no navegador só confere se **existe** um token (não se é válido) | `RequireAdminSession` | Esperado: a validação real é o `/me` e a API |

## Dívida técnica e código duplicado

| # | Ponto | Onde |
| --- | --- | --- |
| D1 | Leitura/gravação da sessão espalhada: chaves `'patas_admin_token'`/`'patas_admin_user'` como texto em 4 arquivos; `AdminLoginPage` grava direto em vez de usar `storeSession`; `AdminLoginPage` e `AdminDashboardPage` leem sem `try/catch` (ao contrário do resto) | `client.js`, `RequireAdminSession`, `AdminLoginPage`, `AdminDashboardPage` |
| D2 | `AnimalsPage` reimplementa a lista paginada (`usePaginatedList`) e o `errorMessage` | `admin/animals/AnimalsPage.jsx` |
| D3 | Leitura de erro da API repetida com nomes diferentes: `readError` (2×), `lerErro`, `errorMessage` (3×) | `VolunteerSignup`, `DonationPage`, `AdoptionFormModal`, `CancelSubscriptionPage`, `usePaginatedList`, `AnimalsPage` |
| D4 | Datas "agora/hoje" no fuso do navegador repetidas: `today()` (2×), `agoraLocal`, `localDateTimeValue` | `DonationFormDialog`, `VolunteerFormDialog`, `AdoptionFormModal`, `AdoptionDetailDialog` |
| D5 | Exportação CSV da agenda reimplementa o download (`downloadFile` existe) | `DashboardOverview.exportAgenda` |
| D6 | Áreas de voluntário duplicadas com rótulos diferentes: `captacao` = "Captação de recursos" (site) × "Captação" (painel) | `volunteerAreas.js`, `statusLabels.volunteerAreaLabels` |
| D7 | Rótulos de espécie/porte/sexo em 3 lugares (`catalogOptions`, `animalOptions`, `petMapper`); rótulos de cargo próprios do front (diferentes dos da API) | — |
| D8 | Protocolo `PAC-` recalculado no painel (`protocolOf`), duplicando a regra da API | `AdoptionDetailDialog` |
| D9 | Campos e props sem uso: `Pet.code`, `Pet.stamp`, `Pet.tags`; `PetPhoto.layoutId`/`style`; `defaultSteps[].icon` | `petMapper`, `PetPhoto`, `useAdoptionSteps` |
| D10 | Comentários desatualizados: "services/api.js" (hoje `api/client.js`) | `api/adoptions.js`, `api/content.js` |
| D11 | **README do repositório desatualizado**: diz que há duas rotas, que o curinga cai na Home, (ADR-005) que o formulário de adoção é local e nada é persistido, e (seção 4) cita pastas `pages/` e `services/` que não existem mais | `README.md` |
| D12 | `globals.css` importado duas vezes | `src/index.js`, `src/app/App.js` |
| D13 | Seletor global `header { … }` afeta qualquer `<header>` (já causou bug no formulário de adoção); `.admin-card` com largura máxima herdada de um modal antigo (mantida por decisão) | `Header.css`, `globals.css` |
| D14 | 15 larguras de breakpoint diferentes, sem escala comum | CSS |
| D15 | Sem TypeScript/PropTypes (contratos de props implícitos), sem Prettier (aspas simples e duplas misturadas), sem script de lint separado | Projeto |
| D16 | Avisos do React Router sobre a v7 (`v7_startTransition`, `v7_relativeSplatPath`) | Testes e console |

## Desempenho

| # | Ponto | Onde | Efeito |
| --- | --- | --- | --- |
| P1 | Home e catálogo baixam **todos** os animais disponíveis (todas as páginas de 100) e filtram no navegador; cada página busca de novo (sem cache) | `buscarTodoAnimais`, `useAvailableAnimals` | Tempo e dados crescem com o cadastro |
| P2 | Fontes do Google por `@import` dentro do CSS (atrasa a primeira renderização) e a família **Work Sans é baixada sem uso** | `globals.css` | Download extra e bloqueio |
| P3 | O dashboard recarrega a cada 60 s indefinidamente, mesmo com a aba oculta | `DashboardOverview` | Chamadas desnecessárias |
| P4 | Axios sem `timeout` | `api/client.js` | Uma API travada deixa a tela "carregando" indefinidamente |

## Usabilidade e consistência

| # | Ponto | Onde |
| --- | --- | --- |
| U1 | `window.prompt`/`window.confirm` em ações do painel (motivo do status, excluir animal/história, cancelar assinatura) e ao sair do formulário de adoção — fora do padrão de diálogos acessíveis do resto | `AnimalsPage`, `StoriesPage`, `SubscriptionsSection`, `AdoptionFormModal` |
| U2 | Remover foto do animal não pede confirmação | `AnimalPhotos` |
| U3 | ⚠️ Horários do painel (`min` dos campos de data/hora, "hoje") usam o fuso do navegador, mas a API interpreta como horário de Brasília | `AdoptionDetailDialog`, formulários do painel |
| U4 | ⚠️ Data de entrada padrão do animal calculada em UTC (entre 21h e meia-noite em Brasília, vira o dia seguinte) | `AnimalFormDialog.createForm` |
| U5 | O resumo do passo 3 do pedido de adoção não mostra "outros animais" | `AdoptionFormModal` |
| U6 | Falhas silenciosas: números da Home viram "—", histórias somem, resumo de doações some, sem aviso | `StatsStrip`, `Stories`, `DonationsPage` |
| U7 | Paginação das doações mensais fica fora da URL (diferente das outras listas) | `SubscriptionsSection` |

## Testes

| # | Ponto |
| --- | --- |
| T1 | Serviços de API com 0% de cobertura e `api/client.js` com 28%: renovação de sessão e contrato com a API não são testados (ver [12](12-testes.md#o-que-não-está-coberto)) |
| T2 | Sem testes de ponta a ponta, visuais ou de acessibilidade automatizada |
