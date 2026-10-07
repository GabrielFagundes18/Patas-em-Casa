# 5. Componentes

Todos os componentes React do projeto, um por um: **77** no total (1 raiz, 20 páginas/telas, 39 componentes
exportados e 17 componentes internos a outros arquivos). Cada ficha traz arquivo, finalidade, props (nome, tipo,
obrigatoriedade, padrão, descrição), estado interno, eventos/callbacks, onde é usado e, quando útil, um exemplo.

Os tipos das props são **inferidos do uso** (o projeto não usa PropTypes nem TypeScript). Os modelos `Pet`,
`AdminUser` e `Filters` estão em [modelo-dados.md](../engenharia/modelo-dados.md).

| Arquivo | Conteúdo |
| --- | --- |
| [Aplicação e layout público](app-e-layout.md) | `App`, `PublicLayout`, `Header`, `NavItem`, `Footer`, `FooterLink`, `NotFoundPage` |
| [Compartilhados do site](compartilhados.md) | `AnimalCard`, `PetPhoto`, `PixKey` |
| [Home](home.md) | `LandingPage`, `Hero`, `HighlightThumb`, `StatsStrip`, `CountUp`, `PetSection`, `HowItWorks`, `Donation`, `Stories`, `StoryAuthor`, `VolunteerSignup` |
| [Catálogo, perfil e adoção](catalogo-perfil-adocao.md) | `AdoptionCatalog`, `FilterDrawer`, `FilterGroup`, `AnimalProfilePage`, `Gallery`, `AdoptionFormModal`, `PetThumb`, `FieldError`, `HowAdoptionWorksPage` |
| [Doação](doacao.md) | `DonationPage`, `DonationReturnPage`, `CancelSubscriptionPage` |
| [Base do painel](painel-base.md) | `RequireAdminSession`, `AdminAuthShell`, `AdminLoginPage`, `AdminForgotPasswordPage`, `AdminResetPasswordPage`, `AdminDashboardPage`, `AdminLayout`, `AdminDialog`, `FormError`, `ListState`, `Pagination`, `SearchField` |
| [Painel: visão geral e animais](painel-dashboard-animais.md) | `DashboardOverview`, `Sparkline`, `PieChart`, `Gauge`, `MonthlyBars`, `AnimalsPage`, `AnimalFormDialog`, `AnimalPhotos` |
| [Painel: adoções e adotantes](painel-adocoes-adotantes.md) | `AdoptionsPage`, `AdoptionDetailDialog`, `AdoptionDetailBody`, `AppointmentsSection`, `DecisionPanel`, `SchedulePanel`, `ReschedulePanel`, `CancelAppointmentPanel`, `DurationField`, `AdoptersPage`, `AdopterDetailDialog`, `EditForm`, `LgpdPanel` |
| [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md) | `DonationsPage`, `DonationFormDialog`, `SubscriptionsSection`, `StoriesPage`, `StoryFormDialog`, `VolunteersPage`, `VolunteerFormDialog`, `TeamPage`, `TeamMemberDialog`, `PasswordField`, `ResetPasswordDialog` |

## Índice

| # | Componente | Tipo | Documento |
| --- | --- | --- | --- |
| 1 | `App` | raiz | [Aplicação e layout público](app-e-layout.md#app) |
| 2 | `PublicLayout` | componente | [Aplicação e layout público](app-e-layout.md#publiclayout) |
| 3 | `Header` | componente | [Aplicação e layout público](app-e-layout.md#header) |
| 4 | `NavItem` | interno | [Aplicação e layout público](app-e-layout.md#navitem-interno-de-headerjsx) |
| 5 | `Footer` | componente | [Aplicação e layout público](app-e-layout.md#footer) |
| 6 | `FooterLink` | interno | [Aplicação e layout público](app-e-layout.md#footerlink-interno-de-footerjsx) |
| 7 | `NotFoundPage` | página/tela | [Aplicação e layout público](app-e-layout.md#notfoundpage) |
| 8 | `AnimalCard` | componente | [Compartilhados do site](compartilhados.md#animalcard) |
| 9 | `PetPhoto` | componente | [Compartilhados do site](compartilhados.md#petphoto) |
| 10 | `PixKey` | componente | [Compartilhados do site](compartilhados.md#pixkey) |
| 11 | `LandingPage` | página/tela | [Home](home.md#landingpage) |
| 12 | `Hero` | componente | [Home](home.md#hero) |
| 13 | `HighlightThumb` | interno | [Home](home.md#highlightthumb-interno-de-herojsx) |
| 14 | `StatsStrip` | componente | [Home](home.md#statsstrip) |
| 15 | `CountUp` | interno | [Home](home.md#countup-interno) |
| 16 | `PetSection` | componente | [Home](home.md#petsection) |
| 17 | `HowItWorks` | componente | [Home](home.md#howitworks) |
| 18 | `Donation` | componente | [Home](home.md#donation) |
| 19 | `Stories` | componente | [Home](home.md#stories) |
| 20 | `StoryAuthor` | interno | [Home](home.md#storyauthor-interno) |
| 21 | `VolunteerSignup` | componente | [Home](home.md#volunteersignup) |
| 22 | `AdoptionCatalog` | página/tela | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#adoptioncatalog) |
| 23 | `FilterDrawer` | componente | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#filterdrawer) |
| 24 | `FilterGroup` | componente | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#filtergroup) |
| 25 | `AnimalProfilePage` | página/tela | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#animalprofilepage) |
| 26 | `Gallery` | interno | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#gallery-interno) |
| 27 | `AdoptionFormModal` | componente | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#adoptionformmodal) |
| 28 | `PetThumb` | interno | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#petthumb-interno) |
| 29 | `FieldError` | interno | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#fielderror-interno) |
| 30 | `HowAdoptionWorksPage` | página/tela | [Catálogo, perfil e adoção](catalogo-perfil-adocao.md#howadoptionworkspage) |
| 31 | `DonationPage` | página/tela | [Doação](doacao.md#donationpage) |
| 32 | `DonationReturnPage` | página/tela | [Doação](doacao.md#donationreturnpage) |
| 33 | `CancelSubscriptionPage` | página/tela | [Doação](doacao.md#cancelsubscriptionpage) |
| 34 | `RequireAdminSession` | componente | [Base do painel](painel-base.md#requireadminsession) |
| 35 | `AdminAuthShell` | componente | [Base do painel](painel-base.md#adminauthshell) |
| 36 | `AdminLoginPage` | página/tela | [Base do painel](painel-base.md#adminloginpage) |
| 37 | `AdminForgotPasswordPage` | página/tela | [Base do painel](painel-base.md#adminforgotpasswordpage) |
| 38 | `AdminResetPasswordPage` | página/tela | [Base do painel](painel-base.md#adminresetpasswordpage) |
| 39 | `AdminDashboardPage` | página/tela | [Base do painel](painel-base.md#admindashboardpage) |
| 40 | `AdminLayout` | componente | [Base do painel](painel-base.md#adminlayout) |
| 41 | `AdminDialog` | componente | [Base do painel](painel-base.md#admindialog) |
| 42 | `FormError` | componente | [Base do painel](painel-base.md#formerror) |
| 43 | `ListState` | componente | [Base do painel](painel-base.md#liststate) |
| 44 | `Pagination` | componente | [Base do painel](painel-base.md#pagination) |
| 45 | `SearchField` | componente | [Base do painel](painel-base.md#searchfield) |
| 46 | `DashboardOverview` | página/tela | [Painel: visão geral e animais](painel-dashboard-animais.md#dashboardoverview) |
| 47 | `Sparkline` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#sparkline) |
| 48 | `PieChart` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#piechart) |
| 49 | `Gauge` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#gauge) |
| 50 | `MonthlyBars` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#monthlybars) |
| 51 | `AnimalsPage` | página/tela | [Painel: visão geral e animais](painel-dashboard-animais.md#animalspage) |
| 52 | `AnimalFormDialog` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#animalformdialog) |
| 53 | `AnimalPhotos` | componente | [Painel: visão geral e animais](painel-dashboard-animais.md#animalphotos) |
| 54 | `AdoptionsPage` | página/tela | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#adoptionspage) |
| 55 | `AdoptionDetailDialog` | componente | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#adoptiondetaildialog) |
| 56 | `AdoptionDetailBody` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#adoptiondetailbody-interno) |
| 57 | `AppointmentsSection` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#appointmentssection-interno) |
| 58 | `DecisionPanel` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#decisionpanel-interno) |
| 59 | `SchedulePanel` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#schedulepanel-interno) |
| 60 | `ReschedulePanel` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#reschedulepanel-interno) |
| 61 | `CancelAppointmentPanel` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#cancelappointmentpanel-interno) |
| 62 | `DurationField` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#durationfield-interno) |
| 63 | `AdoptersPage` | página/tela | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#adopterspage) |
| 64 | `AdopterDetailDialog` | componente | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#adopterdetaildialog) |
| 65 | `EditForm` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#editform-interno) |
| 66 | `LgpdPanel` | interno | [Painel: adoções e adotantes](painel-adocoes-adotantes.md#lgpdpanel-interno) |
| 67 | `DonationsPage` | página/tela | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#donationspage) |
| 68 | `DonationFormDialog` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#donationformdialog) |
| 69 | `SubscriptionsSection` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#subscriptionssection) |
| 70 | `StoriesPage` | página/tela | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#storiespage) |
| 71 | `StoryFormDialog` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#storyformdialog) |
| 72 | `VolunteersPage` | página/tela | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#volunteerspage) |
| 73 | `VolunteerFormDialog` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#volunteerformdialog) |
| 74 | `TeamPage` | página/tela | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#teampage) |
| 75 | `TeamMemberDialog` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#teammemberdialog) |
| 76 | `PasswordField` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#passwordfield-exportado) |
| 77 | `ResetPasswordDialog` | componente | [Painel: doações, histórias, voluntários e equipe](painel-doacoes-historias-voluntarios-equipe.md#resetpassworddialog) |
