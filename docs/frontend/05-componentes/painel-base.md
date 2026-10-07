# Componentes — base do painel (`src/admin/security`, `layout`, `shared`)

Telas do painel recebem `user` (o objeto de `GET /me`: `{ id, nome, email, cargo, role, permissions[] }`) e usam
`user.permissions.includes('modulo:acao')` para mostrar ou esconder botões.

---

## `RequireAdminSession`

| | |
| --- | --- |
| Arquivo | `src/admin/security/RequireAdminSession.jsx` (default) |
| Para que serve | Rota-moldura das rotas protegidas: com `patas_admin_token` no `localStorage` renderiza `<Outlet />`; sem token, `<Navigate to="/admin/login" replace state={{ from }} />` |
| Props / estado | nenhum |
| Usado em | `App` (`<Route element={<RequireAdminSession />}>`) |

---

## `AdminAuthShell`

| | |
| --- | --- |
| Arquivo | `src/admin/security/AdminAuthShell.jsx` (default); importa `admin.css` e `AdminLoginPage.css` |
| Para que serve | Moldura das telas de acesso: painel lateral com a marca e cartão com título e formulário |
| Estado | nenhum |
| Usado em | `AdminLoginPage`, `AdminForgotPasswordPage`, `AdminResetPasswordPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `titleId` | string | sim | — | Id do `<h1>` (usado em `aria-labelledby`) |
| `eyebrow` | string | não | `'Área administrativa'` | Texto acima do título |
| `title` | string | sim | — | Título |
| `description` | string | não | — | Parágrafo abaixo do título |
| `children` | node | sim | — | Formulário/links |

```jsx
<AdminAuthShell titleId="x" title="Esqueci minha senha" description="…"><form>…</form></AdminAuthShell>
```

---

## `AdminLoginPage`

| | |
| --- | --- |
| Arquivo | `src/admin/security/AdminLoginPage.jsx` (default, lazy) + `AdminLoginPage.css` |
| Props | nenhuma (lê `location.state`) |
| Estado | `form` (`{ email, password }`), `error`, `loading` |
| Comportamento | Se já existe token, redireciona para `/admin`. No envio: `loginAdmin` → grava `patas_admin_token` e `patas_admin_user` → volta a `state.from` ou `/admin`. Avisos de "sessão expirou" e "senha definida" vêm do `state` |
| Mensagens de erro | Sem resposta: "Não foi possível conectar ao servidor…"; com resposta: mensagem da API ou "Não foi possível entrar no painel." |
| Usado em | `App` |

## `AdminForgotPasswordPage`

| | |
| --- | --- |
| Arquivo | `src/admin/security/AdminForgotPasswordPage.jsx` (default, lazy) |
| Estado | `email`, `state` (`idle` → `sending` → `sent` \| `error`, com `message`) |
| Comportamento | `requestPasswordReset(email.trim())`; com sucesso substitui o formulário pela mensagem neutra da API |

## `AdminResetPasswordPage`

| | |
| --- | --- |
| Arquivo | `src/admin/security/AdminResetPasswordPage.jsx` (default, lazy) |
| Estado | `form` (`{ senha, confirmacao }`), `state` (`{ status, message, details[], expired }`) |
| Comportamento | Lê `?token=` e `?convite=1`. Sem token: "Link incompleto". Senhas diferentes: erro local. Sucesso: `navigate('/admin/login', { state: { senhaDefinida: true } })`. `LINK_INVALIDO` → link "Pedir um novo link" |

---

## `AdminDashboardPage`

| | |
| --- | --- |
| Arquivo | `src/admin/AdminDashboardPage.jsx` (default, lazy) |
| Para que serve | Página de todas as rotas `/admin…`: valida a sessão, trata expiração, logout, permissão da aba e renderiza a seção (`renderSection`) |
| Estado | `user`, `error`, `loading` (começa `true` se há token), `retryCount` |
| Efeitos | (1) `fetchAdminMe(token)`; 401/404 → `clearSession()` e `/admin/login`; outro erro → mensagem com "Tentar novamente". (2) Escuta `SESSION_EXPIRED_EVENT` → `/admin/login` com `state.sessaoExpirada` |
| Eventos | `handleLogout` → `logoutAdmin()` (erro ignorado) → `clearSession()` → `/admin/login` |
| Usado em | `App` (rota `/admin` e `/admin/<aba>`) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `activeTab` | `'dashboard' \| 'animais' \| 'adocoes' \| 'adotantes' \| 'historias' \| 'doacoes' \| 'voluntarios' \| 'configuracoes'` | não | `'dashboard'` | Seção a mostrar |

```jsx
<Route path="/admin/animais" element={<AdminDashboardPage activeTab="animais" />} />
```

---

## `AdminLayout`

| | |
| --- | --- |
| Arquivo | `src/admin/layout/AdminLayout.jsx` (default) + `AdminLayout.css`; importa `admin.css` |
| Para que serve | Casca do painel: menu lateral recolhível (grupos de `adminNavigationGroups`, filtrados pelas permissões e pela busca), barra superior (usuário, cargo, busca no menu com **Ctrl/⌘ + K**, avisos, atalho para Equipe), trilha de navegação, título/descrição da seção e diálogo "Central de ajuda" |
| Estado | `collapsed`, `mobileOpen`, `search`, `notificationsOpen`, `helpOpen`, `isMobile` (`matchMedia('(max-width: 900px)')`); refs do menu, da busca, do diálogo de ajuda e do foco anterior |
| Efeitos | Atalho Ctrl/⌘+K; acompanha a largura (900 px); no celular com menu aberto, prende o foco no menu, fecha com Esc e devolve o foco; abre/fecha o `<dialog>` de ajuda |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `user` | `AdminUser \| null` | sim | — | Nome, cargo e permissões (null enquanto valida) |
| `activeTab` | string | sim | — | Chave da seção ativa (destaque no menu, título) |
| `onLogout` | `() => void` | sim | — | Botão "Sair" |
| `children` | node | sim | — | Conteúdo da seção |

⚠️ "Avisos" sempre mostra "Não há avisos disponíveis nesta sessão" e a "Central de ajuda" diz "O canal de atendimento
ainda não está configurado" — são marcadores sem funcionalidade.

---

## `AdminDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/shared/AdminDialog.jsx` (default) |
| Para que serve | Diálogo modal nativo (`<dialog>` + `showModal()`): foco preso e Esc pelo navegador; Esc chama `onClose` (o `cancel` é interceptado) |
| Estado | `dialogRef` |
| Usado em | `AnimalFormDialog`, `AdoptionDetailDialog`, `AdopterDetailDialog`, `DonationFormDialog`, `StoryFormDialog`, `VolunteerFormDialog`, `TeamMemberDialog`, `ResetPasswordDialog` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `id` | string | sim | — | Base do id do título (`${id}-title`) |
| `eyebrow` | string | não | — | Texto acima do título |
| `title` | string | sim | — | Título |
| `onClose` | `() => void` | sim | — | Botão X e Esc |
| `wide` | boolean | não | `false` | Classe `is-wide` (diálogos de detalhe) |
| `children` | node | sim | — | Conteúdo |

```jsx
<AdminDialog id="story-form" eyebrow="Histórias" title="Nova história" onClose={close}>…</AdminDialog>
```

---

## `FormError`

| | |
| --- | --- |
| Arquivo | `src/admin/shared/FormError.jsx` (default) |
| Para que serve | Mostra o erro da API (`error.response.data.error.message`) e a lista de `details[].message` sem repetição |
| Usado em | 8 diálogos/painéis do painel e `AnimalPhotos` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `error` | erro do Axios \| null | não | — | Sem erro, não renderiza |
| `fallback` | string | sim | — | Mensagem quando a API não mandou uma |

---

## `ListState`

| | |
| --- | --- |
| Arquivo | `src/admin/shared/ListState.jsx` (default) |
| Para que serve | Estados comuns das listas: carregando (4 esqueletos), erro com "Tentar novamente", vazio |
| Usado em | `AdoptionsPage`, `AdoptersPage`, `DonationsPage`, `SubscriptionsSection`, `StoriesPage`, `VolunteersPage`, `TeamPage`, `DashboardOverview`, `AdoptionDetailDialog`, `AdopterDetailDialog` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `loading` | boolean | não | — | Prioridade 1 |
| `error` | string | não | — | Prioridade 2 |
| `empty` | boolean | não | — | Prioridade 3 |
| `emptyTitle` | string | não | — | Título do vazio |
| `emptyText` | string | não | — | Texto do vazio |
| `onRetry` | `() => void` | não | — | Botão do erro |

---

## `Pagination`

| | |
| --- | --- |
| Arquivo | `src/admin/shared/Pagination.jsx` (default) |
| Para que serve | "Página X de Y · N registros" com Anterior/Próxima |
| Usado em | `AdoptionsPage`, `AdoptersPage`, `DonationsPage`, `SubscriptionsSection`, `StoriesPage`, `VolunteersPage`, `TeamPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `meta` | `{ page, totalPages, total }` | sim | `meta` da API |
| `onChange` | `(page: number) => void` | sim | Nova página |

---

## `SearchField`

| | |
| --- | --- |
| Arquivo | `src/admin/shared/SearchField.jsx` (default) |
| Para que serve | Busca que só aplica ao enviar (Enter); até 120 caracteres |
| Estado | `draft` (sincronizado quando `value` muda) |
| Usado em | `AdoptionsPage`, `AdoptersPage`, `DonationsPage`, `VolunteersPage`, `TeamPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `value` | string | não | `''` | Valor aplicado (vindo da URL) |
| `onSearch` | `(texto: string) => void` | sim | — | Recebe o texto com `trim` |
| `label` | string | sim | — | `aria-label` e placeholder |
