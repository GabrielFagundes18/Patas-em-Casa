# Componentes — doação (`src/features/donation`)

---

## `DonationPage`

| | |
| --- | --- |
| Arquivo | `src/features/donation/DonationPage.jsx` (default; exporta `redirectTo`) + `DonationPage.css` |
| Para que serve | Página `/doar`: escolhe tipo e valor, informa nome e e-mail e vai para o Mercado Pago; lateral com a chave Pix e link para cancelar a doação mensal |
| Props | nenhuma (lê `?tipo=` e `?valor=`) |
| Estado | `initial` (escolha inicial calculada uma vez por `readInitialChoice`), `tipo`, `choice` (25/50/100/200 ou `'outro'`), `custom` (valor livre), `sending`, `error` (`{ status?, message, details[] }`) |
| Eventos | `submit` → valida R$ 5–10.000 → `iniciarDoacao({ valor (2 casas), nome, email, tipo })` → `redirectTo.go(checkout_url)` |
| Usado em | `App` |

`readInitialChoice`: `tipo=recorrente` ou única; `valor` sugerido, `outro`, ou número entre 5 e 10.000 (vira "outro"
preenchido); qualquer outra coisa → única, R$ 50. `redirectTo` é um objeto exportado para os testes trocarem o
redirecionamento. O campo-armadilha `website` existe no formulário, **mas o valor não é enviado** à API (⚠️ ver
[14](../14-pontos-de-atencao.md)).

---

## `DonationReturnPage`

| | |
| --- | --- |
| Arquivo | `src/features/donation/DonationReturnPage.jsx` (default; exporta `POLL_INTERVAL_MS`) |
| Para que serve | Página `/doar/retorno`: consulta a doação e mostra a mensagem do status |
| Props | nenhuma (lê `?ref=` ou `?assinatura=`) |
| Estado | `state` (`{ status: 'loading' \| 'missing' \| 'ready', donation? }`) |
| Efeitos | `consultarDoacao`; com `pendente`, nova consulta a cada `POLL_INTERVAL_MS.value` (3000 ms), até 6 tentativas; cancela no desmonte |
| Usado em | `App` |

---

## `CancelSubscriptionPage`

| | |
| --- | --- |
| Arquivo | `src/features/donation/CancelSubscriptionPage.jsx` (default; usa `DonationPage.css`) |
| Para que serve | Página `/doar/cancelar`: com token, confirma e cancela; sem token, pede o e-mail e envia um link novo |
| Props | nenhuma (lê `?token=`) |
| Estado | `state` (`{ status: 'idle' \| 'sending' \| 'cancelled' \| 'requested' \| 'error', valor?, message? }`) |
| Eventos | `confirmCancel()` → `cancelarDoacaoMensal(token)`; `requestLink(event)` → `pedirLinkCancelamento(email)` |
| Usado em | `App` |
