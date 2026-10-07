# Componentes — painel: doações, histórias, voluntários e equipe

---

## `DonationsPage`

| | |
| --- | --- |
| Arquivo | `src/admin/donations/DonationsPage.jsx` (default) |
| Para que serve | Seção "Doações": cartões de resumo (arrecadado no mês, total confirmado, por tipo), filtros, tabela, registro/edição manual e a seção de doações mensais |
| Estado | `usePaginatedList(listDonations)`, `summary`, `summaryKey`, `dialog` (`{ donation \| null }`), `notice` |
| Efeitos | `fetchDonationSummary()` ao abrir e após salvar (erro ignorado: os cartões não aparecem) |
| Regras na tela | Doação online (`gateway` preenchido) mostra "Online (Mercado Pago)" e não tem botão de editar; cancelada também não |
| Filtros (URL) | `q` (doador), `status`, `metodo`, `tipo` |
| Permissões | `donations:create` (Registrar), `donations:update` (Editar e cancelar mensais) |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

---

## `DonationFormDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/donations/DonationFormDialog.jsx` (default) |
| Para que serve | Registrar/editar doação feita fora do site |
| Estado | `form` (doador, e-mail, tipo, valor, método, situação, data), `saving`, `error` |
| Eventos | `submit` → `onSubmit(payload)`: valor com vírgula aceito, data enviada como `AAAA-MM-DDT12:00:00-03:00` (meio-dia de Brasília); na edição, e-mail em branco **não é enviado** (mantém o atual, que chega mascarado) |
| Usado em | `DonationsPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `donation` | doação da API \| null | não | — | Com valor = edição |
| `onClose` | `() => void` | sim | — | Cancelar |
| `onSubmit` | `(payload) => Promise` | sim | — | Salvar |

---

## `SubscriptionsSection`

| | |
| --- | --- |
| Arquivo | `src/admin/donations/SubscriptionsSection.jsx` (default) |
| Para que serve | "Doações mensais": assinaturas do Mercado Pago (doador, valor mensal, arrecadado, situação, desde) com filtro de situação e cancelamento |
| Estado | `page`, `status`, `data` (`{ items, meta }`), `loading`, `error`, `notice` — **paginação própria, fora da URL** (10 por página) |
| Eventos | `cancel(subscription)` → `window.confirm` → `cancelSubscription(id)` → recarrega |
| Usado em | `DonationsPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `canCancel` | boolean | sim | Mostra a coluna de ações (vem de `donations:update`) |

---

## `StoriesPage`

| | |
| --- | --- |
| Arquivo | `src/admin/stories/StoriesPage.jsx` (default) |
| Para que serve | Seção "Histórias": lista (autor, trecho de 90 caracteres, animal, situação, data), filtro publicada/rascunho, criar, editar, publicar/despublicar e excluir |
| Estado | `usePaginatedList(listStories)`, `dialog`, `notice` |
| Eventos | `save`, `run(action, texto)` (publicar/despublicar com `updateStory({ publicado })`), `remove` (`window.confirm`) |
| Permissões | `stories:create`, `stories:update`, `stories:delete` |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

---

## `StoryFormDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/stories/StoryFormDialog.jsx` (default) |
| Para que serve | Criar/editar história: quem conta, animal adotado (opcional), texto, URL da foto, "Publicar no site" |
| Estado | `form`, `animals` (animais `adotado`, até 100, por nome), `saving`, `error` |
| Efeitos | `listAnimals({ status: 'adotado', pageSize: '100', sort: 'nome', order: 'asc' })`; se falhar (sem permissão de animais), o campo some |
| Usado em | `StoriesPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `story` | história \| null | não | — | Com valor = edição (mantém o animal atual mesmo fora da lista) |
| `onClose` | `() => void` | sim | — | Cancelar |
| `onSubmit` | `(payload) => Promise` | sim | — | Salvar |

---

## `VolunteersPage`

| | |
| --- | --- |
| Arquivo | `src/admin/volunteers/VolunteersPage.jsx` (default) |
| Para que serve | Seção "Voluntários": lista (nome, e-mail, telefone, áreas, situação, desde), filtros e "Adicionar voluntário" |
| Estado | `usePaginatedList(listVolunteers)`, `formOpen`, `notice` |
| Filtros (URL) | `q`, `status`, `area` |
| Permissões | `volunteers:create` |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

⚠️ Não há como **editar, ativar ou excluir** um voluntário pelo painel (a API tem `PATCH`/`DELETE /volunteers/:id`),
embora o texto da tela diga que as inscrições do site "chegam como inativas, aguardando triagem".

---

## `VolunteerFormDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/volunteers/VolunteerFormDialog.jsx` (default) |
| Para que serve | Cadastrar voluntário: nome, e-mail, telefone, situação, data de início (hoje, no fuso do navegador), áreas |
| Estado | `form`, `saving`, `error` |
| Usado em | `VolunteersPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `onClose` | `() => void` | sim | Cancelar |
| `onSubmit` | `(payload) => Promise` | sim | Salvar |

---

## `TeamPage`

| | |
| --- | --- |
| Arquivo | `src/admin/team/TeamPage.jsx` (default) |
| Para que serve | Seção "Equipe e acessos": lista (nome, e-mail, cargo, situação, desde), filtros, adicionar, editar, nova senha, reenviar convite |
| Estado | `usePaginatedList(listTeam)`, `dialog` (`{ type: 'create' \| 'edit' \| 'password', member? }`), `notice` |
| Eventos | `addMember`, `editMember`, `resetPassword`, `resendInvite`; `inviteNotice` explica se o convite saiu ou por quê não |
| Filtros (URL) | `q`, `cargo` |
| Permissões | `team:create`, `team:update` |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

---

## `TeamMemberDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/team/TeamMemberDialog.jsx` (default; exporta também `generatePassword` e `PasswordField`) |
| Para que serve | Adicionar membro (convite por e-mail — padrão — ou senha inicial) e editar (nome, e-mail, cargo, ativo) |
| Estado | `form` (`nome, email, cargo, senha, ativo, acesso`), `saving`, `error` |
| Eventos | Criar: `{ nome, email, cargo, ativo, enviar_convite: true }` ou `{ …, senha }`. Editar: `{ nome, email, cargo, ativo }`. Ao desmarcar "Acesso ativo" de quem está ativo, avisa que a pessoa sai na hora |
| Usado em | `TeamPage` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `member` | usuário \| null | não | — | Com valor = edição |
| `onClose` | `() => void` | sim | — | Cancelar |
| `onSubmit` | `(payload) => Promise` | sim | — | Salvar |

### `PasswordField` (exportado)

Campo de senha visível (texto, `autocomplete="new-password"`, 10–72 caracteres, obrigatório) com botão "Gerar senha".

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `id` | string | sim | Id do input e base do id da dica |
| `label` | string | sim | Rótulo |
| `value` | string | sim | Valor |
| `onChange` | `(senha: string) => void` | sim | Novo valor (digitado ou gerado) |
| `hint` | string | sim | Dica abaixo do campo |

Usado em `TeamMemberDialog` e `ResetPasswordDialog`.

```jsx
<PasswordField id="nova" label="Nova senha" value={senha} onChange={setSenha} hint="Mínimo de 10 caracteres." />
```

`generatePassword()` → 14 caracteres de `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789` (sem 0/O/1/l/I), via
`crypto.getRandomValues`; repete até ter letra e número.

---

## `ResetPasswordDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/team/ResetPasswordDialog.jsx` (default) |
| Para que serve | Administrador define nova senha para um membro (a API encerra as sessões dele) |
| Estado | `senha`, `saving`, `error` |
| Usado em | `TeamPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `member` | usuário | sim | Nome no título |
| `onClose` | `() => void` | sim | Cancelar |
| `onSubmit` | `(senha: string) => Promise` | sim | Salvar |
