# Componentes — compartilhados do site

---

## `AnimalCard`

| | |
| --- | --- |
| Arquivo | `src/shared/components/AnimalCard/AnimalCard.jsx` (export nomeado) + `AnimalCard.css` |
| Para que serve | Cartão de um animal (mesmo visual na Home e no catálogo): foto, selo "Urgente", nome, espécie/sexo/idade/porte, tempo de espera, descrição, até 3 traços de temperamento, cuidados (castrado/vacinado concordando com o sexo), link "Conhecer o/a Nome" e botões opcionais de favoritar e compartilhar |
| Estado | nenhum |
| Usado em | `PetSection` (sem favoritar/compartilhar), `AdoptionCatalog` (com ambos) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `pet` | `Pet` | sim | — | Animal já mapeado |
| `headingLevel` | number (2–6) | não | `3` | Nível do título do nome (`h2` no catálogo, `h3` na Home) |
| `isFavorite` | boolean | não | `false` | Estado do coração (`aria-pressed`) |
| `onToggleFavorite` | `(pet: Pet) => void` | não | — | Se passado, mostra o botão de favoritar |
| `onShare` | `(pet: Pet) => void` | não | — | Se passado, mostra o botão de compartilhar |

Eventos emitidos: `onToggleFavorite(pet)`, `onShare(pet)`. O link vai para `/animais/<id>` (ou `/adotar` se não houver id).

```jsx
<AnimalCard pet={pet} headingLevel={2} isFavorite={isFavorite(pet.id)} onToggleFavorite={handleFavorite} onShare={handleShare} />
```

---

## `PetPhoto`

| | |
| --- | --- |
| Arquivo | `src/shared/components/PetPhoto/PetPhoto.jsx` (export nomeado) + `PetPhoto.css` |
| Para que serve | Foto do animal (`motion.img`) com alternativa "Foto em breve" (pata) quando não há URL ou a imagem falha |
| Estado | `failed` (o `onError` da imagem liga o placeholder) |
| Usado em | `AnimalCard`, `Stories` |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `pet` | `{ image: string, alt: string }` (um `Pet` serve) | sim | — | URL e texto alternativo |
| `layoutId` | string | não | — | Repassado ao `motion.img` (animação compartilhada). ⚠️ Nenhum chamador passa hoje |
| `style` | object | não | — | Estilo inline. ⚠️ Nenhum chamador passa hoje |
| `loading` | `'lazy' \| 'eager'` | não | — | Atributo `loading` da imagem |

```jsx
<PetPhoto pet={pet} loading="lazy" />
```

---

## `PixKey`

| | |
| --- | --- |
| Arquivo | `src/shared/components/PixKey/PixKey.jsx` (export nomeado) + `PixKey.css` |
| Para que serve | Mostra a chave Pix de `ORGANIZACAO.pix` com botão "Copiar" (Clipboard API; "Copiada" por 2 s; falha não quebra a tela) |
| Estado | `copied` |
| Usado em | `Donation` (Home, `variant="inline"`), `DonationPage` (cartão) |

| Prop | Tipo | Obrig. | Padrão | Descrição |
| --- | --- | :---: | --- | --- |
| `variant` | `'card' \| 'inline'` | não | `'card'` | Cartão com tipo da chave e CNPJ, ou linha compacta |

```jsx
<PixKey variant="inline" />
```
