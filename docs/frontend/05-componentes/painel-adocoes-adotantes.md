# Componentes — painel: adoções e adotantes

---

## `AdoptionsPage`

| | |
| --- | --- |
| Arquivo | `src/admin/adoptions/AdoptionsPage.jsx` (default) |
| Para que serve | Seção "Adoções": lista de pedidos (data, animal, adotante, status, prioridade, responsável, termo) com filtros e botão "Detalhes" |
| Estado | `usePaginatedList(listAdoptionRequests)` + `selectedId` |
| Filtros (URL) | `q` (adotante ou animal), `status`, `prioridade`, `page` |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Repassado ao detalhe |

---

## `AdoptionDetailDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/adoptions/AdoptionDetailDialog.jsx` (default; 7 componentes internos e o hook `usePanelSubmit`) |
| Para que serve | Detalhe do pedido (título "Fulano quer adotar Nome", protocolo `PAC-…`): dados do adotante e do animal, agenda, respostas/histórico e ações |
| Estado | `request`, `loading`, `loadError`, `reloadKey`, `contacts` (contatos revelados), `revealing`, `revealError`, `mode` (`{ type: 'view' \| 'agendar' \| 'remarcar' \| 'cancelar-agendamento' \| 'aprovar' \| 'recusar', appointment? }`), `notice` |
| Permissões | `adoptions:approve` (Aprovar/Recusar), `adoptions:update` (agenda), `adopters:reveal` (mostrar contatos) |
| Ações | `reveal`, `approve`, `reject`, `schedule`, `reschedule`, `cancel`, `complete` — cada uma atualiza o pedido, volta à visualização, mostra o aviso (inclusive se o e-mail ao adotante foi ou não enviado: `emailNotice`) e chama `onChanged` |
| Usado em | `AdoptionsPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `requestId` | string (UUID) | sim | Pedido |
| `user` | `AdminUser` | sim | Permissões |
| `onClose` | `() => void` | sim | Fechar |
| `onChanged` | `() => void` | não | Recarregar a lista |

⚠️ O diálogo **não oferece**: mudar status/prioridade/responsável, adicionar anotação (`PATCH /adoption-requests/:id`)
nem marcar o termo como assinado (`POST …/term-signed`) — embora a API tenha essas rotas e o aviso de aprovação diga
"Quando o termo for assinado, registre no pedido". Ver [14](../14-pontos-de-atencao.md).

### `AdoptionDetailBody` (interno)

Corpo do detalhe; escolhe qual painel de ação mostrar conforme `mode` e se o pedido está aberto
(`novo`, `em_analise`, `visita_agendada`).

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `request` | pedido da API | Dados exibidos |
| `contacts` | `{ email, telefone, observacoes }` \| null | Contatos revelados (substituem os mascarados) |
| `mode`, `notice`, `revealing`, `revealError` | — | Estado vindo do pai |
| `canDecide`, `canSchedule`, `canReveal` | boolean | Permissões |
| `onMode` | `(type, appointment?) => void` | Troca de painel |
| `onReveal` | `() => void` | Mostrar contatos |
| `actions` | `{ onApprove, onReject, onSchedule, onReschedule, onCancelAppointment, onComplete }` | Ações |

### `AppointmentsSection` (interno)

Lista os agendamentos (tipo, data/hora em Brasília, duração, local, responsável, status) e a sugestão de visita do
adotante (`visita_preferida_em`). Em agendamentos ativos: Remarcar (só com pedido aberto), Realizada, Cancelar.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `request` | pedido | Usa `agendamentos`, `status`, `visita_preferida_em` |
| `canSchedule` | boolean | Mostra as ações |
| `onMode` | função | Abre remarcar/cancelar |
| `onComplete` | `(appointment) => void` | Marca como realizada |

### `DecisionPanel` (interno)

Aprovar ou recusar: justificativa interna (10–2000, obrigatória), "Avisar por e-mail" (padrão ligado) e mensagem ao
adotante (até 1000). Envia `{ justificativa, notificar_adotante, mensagem_adotante }`.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `kind` | `'aprovar' \| 'recusar'` | Textos e cor do botão |
| `animalName`, `adopterName` | string | Textos |
| `onCancel` | função | Voltar |
| `onConfirm` | `(decisao) => Promise` | Envio (via `usePanelSubmit`) |

### `SchedulePanel` (interno)

Agendar visita ou entrevista: tipo (radio), data e hora (`datetime-local`, mínimo agora; pré-preenche com a
sugestão do adotante se for futura), duração (30/45/60/90/120 min, padrão 60), local (até 300), mensagem (até 1000),
"Enviar e-mail" (padrão ligado).

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `adopterName` | string | Texto do checkbox |
| `preferred` | string \| null | `visita_preferida_em` |
| `onCancel`, `onConfirm` | funções | Voltar / enviar |

### `ReschedulePanel` (interno)

Novo horário, duração, local, mensagem e "Avisar do novo horário" para um agendamento existente.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `appointment` | agendamento | Valores iniciais (`data_hora`, `duracao_minutos`, `local`, `mensagem`) |
| `adopterName` | string | Texto |
| `onCancel`, `onConfirm` | funções | Voltar / enviar |

### `CancelAppointmentPanel` (interno)

Motivo (até 500, opcional) e "Avisar por e-mail". Envia `{ motivo, enviar_email }`.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `appointment` | agendamento | Tipo e data no título |
| `adopterName` | string | Texto |
| `onCancel`, `onConfirm` | funções | Voltar / enviar |

### `DurationField` (interno)

`<select>` de duração (30, 45, 60, 90, 120 min; rótulos "30 min", "1 h", "1,5 h", "2 h").

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `value` | number | Minutos |
| `onChange` | `(minutos: number) => void` | Novo valor |

### Hook interno `usePanelSubmit(onConfirm)`

Devolve `{ saving, error, submit(payload) }`: chama `onConfirm`, guarda o erro e reabilita o botão em caso de falha.

---

## `AdoptersPage`

| | |
| --- | --- |
| Arquivo | `src/admin/adopters/AdoptersPage.jsx` (default) |
| Para que serve | Seção "Adotantes": lista (nome, cidade/UF, contato mascarado, pedidos, situação, cadastro), filtros, exportação CSV e ficha |
| Estado | `usePaginatedList(listAdopters)`, `selectedId`, `exportError` |
| Filtros (URL) | `q` (nome, e-mail ou telefone), `status`, `estado` (27 UFs) |
| Eventos | `exportCsv()` → `exportAdoptersCsv(filtros)` → `downloadFile(blob, 'adotantes-AAAA-MM-DD.csv')` |
| Permissões | `adopters:export` (botão Exportar) |
| Usado em | `AdminDashboardPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `user` | `AdminUser` | sim | Permissões |

---

## `AdopterDetailDialog`

| | |
| --- | --- |
| Arquivo | `src/admin/adopters/AdopterDetailDialog.jsx` (default; internos `EditForm` e `LgpdPanel`) |
| Para que serve | Ficha do adotante: contatos (mascarados; endereço "Cadastrado (oculto)"), pedidos, doações, quantidade de histórias, edição e ações LGPD |
| Estado | `adopter`, `loadError`, `reloadKey`, `contacts`, `mode` (`'view' \| 'editar' \| 'anonimizar' \| 'excluir'`), `notice` |
| Permissões | `adopters:reveal` (Mostrar contatos), `adopters:update` (Editar), `lgpd:approve` (Exportar dados do titular, Anonimizar, Excluir) |
| Ações | `revealAdopter`; `save(changes)`; exportar dados → JSON `titular-<id>.json`; `anonymizeAdopter`; `deleteAdopter` (fecha o diálogo) |
| Usado em | `AdoptersPage` |

| Prop | Tipo | Obrig. | Descrição |
| --- | --- | :---: | --- |
| `adopterId` | string (UUID) | sim | Adotante |
| `user` | `AdminUser` | sim | Permissões |
| `onClose` | `() => void` | sim | Fechar |
| `onChanged` | `() => void` | não | Recarregar a lista |

### `EditForm` (interno)

Edita nome (2–150), cidade (até 100), UF (2 letras maiúsculas), situação e — só depois de revelar — e-mail, telefone e
endereço. **Envia apenas os campos alterados**; sem mudanças, só fecha.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `adopter` | adotante | Valores iniciais |
| `contacts` | contatos revelados \| null | Libera os campos de contato |
| `onCancel` | função | Voltar |
| `onSave` | `(changes) => Promise` | Salvar |

### `LgpdPanel` (interno)

Confirmação de ação irreversível: o botão só habilita quando o texto digitado é exatamente `ANONIMIZAR` ou `EXCLUIR`.

| Prop | Tipo | Descrição |
| --- | --- | --- |
| `action` | `'anonimizar' \| 'excluir'` | Texto e palavra exigida |
| `onCancel` | função | Voltar |
| `onConfirm` | `() => Promise` | Executar |
