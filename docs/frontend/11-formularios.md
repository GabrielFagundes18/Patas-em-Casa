# 11. Formulários e validações

Não há biblioteca de formulários: todos usam estado React controlado. A validação acontece em duas camadas — atributos
HTML/regras no front e **validação definitiva na API**, cujas mensagens (`error.message` e `details[]`) são mostradas
na tela. Abaixo, cada formulário com campos, regras do front, mensagens e destino.

---

## Pedido de adoção (`AdoptionFormModal`)

Destino: `POST /api/v1/public/adoption-requests`. `noValidate` no `<form>`: as regras são as de `validateStep`.

| Passo | Campo | Tipo | Regra no front | Mensagem |
| --- | --- | --- | --- | --- |
| 1 | `nome` | texto (máx. 150) | `trim` com 2+ caracteres | "Informe seu nome completo." |
| 1 | `email` | e-mail (máx. 150) | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | "Informe um e-mail válido." |
| 1 | `telefone` | tel (máx. 20) | 10 a 13 dígitos; formatado ao sair do campo | "Informe um telefone com DDD." |
| 1 | `cidade` | texto (máx. 100) | 2+ caracteres | "Informe sua cidade." |
| 2 | `moradia` | radio: Casa, Apartamento, Chácara ou sítio | obrigatório | "Escolha o tipo de moradia." |
| 2 | `moradores` | checkbox: Só eu, Outros adultos, Crianças ("Só eu" exclusivo) | 1+ | "Conte quem mora com você." |
| 2 | `outrosAnimais` | checkbox: Não tenho, Cães, Gatos, Outros animais ("Não tenho" exclusivo) | 1+ | "Conte se há outros animais em casa." |
| 2 | `tempoEmCasa` | radio: Quase o dia todo, Metade do dia, Pouco tempo… | obrigatório | "Conte quanto tempo você passa em casa." |
| 2 | `rotinaLivre` | textarea (máx. 1600) | opcional | — |
| 3 | `visita_preferida_em` | `datetime-local` (mín. agora) | opcional; se preenchido, não pode ser passado | "Escolha uma data e um horário a partir de agora." |
| 3 | `ambiente_seguro` | checkbox | obrigatório marcado | "Confirme que você tem um ambiente seguro para o animal." |
| 3 | `ciente_pos_adocao` | checkbox | obrigatório marcado | "Confirme que está de acordo com o acompanhamento pós-adoção." |
| — | `website` | texto escondido (armadilha) | deve ficar vazio | (a API recusa) |

Envio: `{ animal_id, nome, email, telefone, cidade, rotina: composeRotina(form), ambiente_seguro, ciente_pos_adocao, visita_preferida_em?, website }`.
O texto `rotina` junta "Moradia / Mora com / Outros animais / Tempo em casa" e o texto livre. Erro da API num campo
(`details[].field`; `rotina` é associado a `rotinaLivre`) leva ao passo desse campo com a mensagem ao lado. Sem
conexão: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente." O passo 3 mostra um resumo
com "Editar".

## Inscrição de voluntário (`VolunteerSignup`)

Destino: `POST /api/v1/public/volunteers`.

| Campo | Regra no front | Mensagem |
| --- | --- | --- |
| `nome` | obrigatório, 2–150 | validação nativa |
| `email` | obrigatório, `type=email` | validação nativa |
| `telefone` | obrigatório, `type=tel`, máx. 20 | validação nativa |
| `areas` | 1+ das 9 áreas | "Escolha ao menos uma área em que você quer ajudar." |
| `website` | armadilha | — |

Sucesso: "Inscrição recebida (protocolo VOL-…). Obrigado!…" e o formulário é limpo.

## Doação online (`DonationPage`) e atalho da Home (`Donation`)

Destino: `POST /api/v1/public/donations/checkout` → redireciona para o Mercado Pago.

| Campo | Regra no front | Mensagem |
| --- | --- | --- |
| `tipo` | `unica` ou `recorrente` | — |
| valor | sugerido (25/50/100/200) ou livre: R$ 5 a R$ 10.000, aceita vírgula, arredondado a 2 casas | "Escolha um valor entre R$ 5,00 e R$ 10.000,00." |
| `nome` | obrigatório, 2–150 | nativa |
| `email` | obrigatório, `type=email`, máx. 150 | nativa |
| `website` | campo escondido presente, **mas não enviado** | — |

O atalho da Home só escolhe tipo e valor e navega para `/doar?tipo=&valor=` (sem envio à API).

## Cancelamento da doação mensal (`CancelSubscriptionPage`)

Sem token: `email` (obrigatório, `type=email`) → `POST …/subscriptions/cancel-link`. Com token: botão "Sim, cancelar"
→ `POST …/subscriptions/cancel`. Erros: mensagem da API ou "Não foi possível … Tente novamente."

## Login, esqueci a senha e redefinição

| Formulário | Campos e regras | Destino |
| --- | --- | --- |
| `AdminLoginPage` | `email` (obrigatório, `type=email`), `password` (obrigatório) | `POST /auth/login` |
| `AdminForgotPasswordPage` | `email` (obrigatório, `type=email`) | `POST /auth/forgot-password` |
| `AdminResetPasswordPage` | `senha` e `confirmacao` (obrigatórias, 10–72); iguais ("As senhas não são iguais."); dica "Mínimo de 10 caracteres, com letras e números." | `POST /auth/reset-password` (`{ token, nova_senha }`); detalhes da política vêm da API |

---

## Formulários do painel

### Filtros de animais (`AnimalsPage`)

Busca (máx. 120), status, espécie, porte, sexo, idade mínima/máxima (0–999,9, passo 0,1), castrado, vacinado.
Aplicados no "Filtrar" e gravados na URL.

### Animal (`AnimalFormDialog`)

Destino: `POST /animals` (novo) ou `PUT /animals/:id` (edição).

| Campo | Regra no front | Padrão |
| --- | --- | --- |
| `nome` | obrigatório, máx. 100 | — |
| `especie` | obrigatório (cachorro, gato, outro) | `cachorro` |
| `raca` | máx. 100; vazio → `null` | — |
| `sexo` | macho/fêmea | `macho` |
| `idade_anos` | número 0–999,9 (passo 0,1); vazio → `null` | — |
| `porte` | pequeno/médio/grande | `medio` |
| `status` | 5 status | `disponivel` |
| `data_entrada` | data | hoje (⚠️ calculado em UTC: `new Date().toISOString()`) |
| `foto_url` | URL, máx. 2048; vazio → `null` | — |
| `temperamento` | texto separado por vírgula (máx. 400), vira lista sem repetidos; dica "até 10 características" | — |
| `descricao` | máx. 10.000; vazio → `null` | — |
| `castrado`, `vacinado` | checkbox | `false` |

Mudança de status pela tabela: `PATCH /animals/:id/status`; se a API responder `MOTIVO_OBRIGATORIO`, um
`window.prompt` pede o motivo. Fotos (`AnimalPhotos`): `accept="image/jpeg,image/png,image/webp"`, múltiplas, máximo
12 no total (o botão some ao atingir); a API confere tipo e tamanho (5 MB).

### Decisão, agenda e cancelamento (`AdoptionDetailDialog`)

| Painel | Campos e regras | Destino |
| --- | --- | --- |
| Aprovar/Recusar | Justificativa interna obrigatória (10–2000); "Avisar por e-mail" (marcado); mensagem ao adotante (até 1000) | `POST …/approve` ou `…/reject` |
| Agendar | Tipo (visita/entrevista), data e hora obrigatórias (mín. agora, no fuso do navegador), duração (30–120), local (até 300), mensagem (até 1000), enviar e-mail (marcado) | `POST …/schedule` |
| Remarcar | Novo horário obrigatório (mín. agora), duração, local, mensagem, avisar | `PATCH …/appointments/:aid` |
| Cancelar agendamento | Motivo (até 500, opcional), avisar | `POST …/appointments/:aid/cancel` |

Erros mostrados com `FormError` (mensagem + detalhes, ex.: conflito de horário).

### Adotante (`AdopterDetailDialog`)

| Formulário | Regras | Destino |
| --- | --- | --- |
| Editar cadastro | Nome obrigatório (2–150); cidade (máx. 100); UF (2 letras, `pattern="[A-Z]{2}"`, maiúsculas automáticas); situação; e-mail (obrigatório, máx. 150), telefone (máx. 20) e endereço (máx. 500) só após revelar; envia só o que mudou, vazio → `null` | `PATCH /adopters/:id` |
| Anonimizar/Excluir | Botão habilita só com `ANONIMIZAR`/`EXCLUIR` digitado exatamente | `POST /adopters/:id/anonymize` / `DELETE /adopters/:id` |

### Doação manual (`DonationFormDialog`)

| Campo | Regra no front | Padrão |
| --- | --- | --- |
| `doador_nome` | obrigatório, 2–150 | — |
| `doador_email` | `type=email`, máx. 150; na edição, vazio mantém o atual | — |
| `valor` | obrigatório, número ≥ 0,01 (passo 0,01; vírgula aceita) | — |
| `data` | obrigatória, máx. hoje; enviada como meio-dia de Brasília | hoje (fuso do navegador) |
| `tipo` | única/recorrente | `unica` |
| `metodo` | pix, cartão, boleto, transferência | `pix` |
| `status` | confirmada, pendente, cancelada (aviso: cancelada não pode mais ser editada) | `confirmada` |

Destino: `POST /donations` ou `PATCH /donations/:id`.

### História (`StoryFormDialog`)

`autor_nome` obrigatório (2–150); `texto` obrigatório (10–5000); `foto_url` (URL, máx. 2048); `animal_id` opcional
(animais adotados); `publicado` (checkbox, padrão desmarcado). Destino: `POST /stories` ou `PATCH /stories/:id`.

### Voluntário (`VolunteerFormDialog`)

`nome` obrigatório (2–150); `email` obrigatório; `telefone` (máx. 20); `status` (ativo/inativo, padrão ativo);
`data_inicio` (padrão hoje); `areas` (opcional no painel). Destino: `POST /volunteers`.

### Membro da equipe (`TeamMemberDialog`) e nova senha (`ResetPasswordDialog`)

| Campo | Regra no front |
| --- | --- |
| `nome` | obrigatório, 2–150 |
| `email` | obrigatório, `type=email`, máx. 150 |
| `cargo` | obrigatório (5 cargos) |
| Acesso (só no cadastro) | "Enviar convite por e-mail" (padrão) ou "Definir senha inicial" |
| `senha` / nova senha (`PasswordField`) | obrigatória, 10–72, botão "Gerar senha"; política completa validada pela API |
| `ativo` | checkbox (padrão marcado); desmarcar avisa que a pessoa sai na hora |

Destinos: `POST /users`, `PATCH /users/:id`, `POST /users/:id/password`.

### Buscas do painel (`SearchField`)

Máx. 120 caracteres; aplicadas ao enviar; gravadas na URL como `q`.
