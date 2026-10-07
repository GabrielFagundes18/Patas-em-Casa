# 2. Como rodar

## Pré-requisitos

| Item | Versão | Observação |
| --- | --- | --- |
| Node.js | ⚠️ A confirmar | O `package.json` não declara `engines`. O CRA 5 exige Node 14+; o ambiente onde esta documentação foi escrita usa Node 24.20.0 |
| npm | 11.19.0 (ambiente atual) | Há `package-lock.json`, então o gerenciador é o **npm** |
| API Patas em Casa | — | Repositório `Patas-em-Casa-BackEnd`, rodando por padrão em `http://localhost:4000` |

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm ci` (ou `npm install`) | Instala as dependências do `package-lock.json` |
| `npm start` | Servidor de desenvolvimento do CRA em `http://localhost:3000` com recarga automática |
| `npm run build` | Build de produção otimizado em `build/` |
| `npm test` | Jest + Testing Library em modo observação |
| `CI=true npm test -- --watchAll=false` | Roda todos os testes uma vez (21 arquivos, 91 testes) |
| `npm run eject` | Ejeta a configuração do CRA (irreversível; não usado) |
| Lint | Não há script próprio. O ESLint (`react-app`, `react-app/jest`, em `eslintConfig` do `package.json`) roda dentro do `npm start`/`npm run build`; com `CI=true`, avisos do lint quebram o build |

Depois de mudar `jsconfig.json` ou `.env`, é preciso reiniciar o `npm start`.

## Variáveis de ambiente

O CRA só expõe ao código variáveis com prefixo `REACT_APP_`, lidas **na hora do build** (o valor fica embutido no
JavaScript gerado). O arquivo `.env` está no `.gitignore`; só o `.env.example` vai para o Git.

| Variável | Obrigatória | Padrão no código | Uso | Exemplo |
| --- | --- | --- | --- | --- |
| `REACT_APP_API_URL` | não | `http://localhost:4000` | `baseURL` do Axios (`src/api/client.js`); as URLs de fotos vêm prontas da API | `https://api.exemplo.org` |

Variáveis usadas pelo próprio CRA (não lidas pelo código do projeto): `PUBLIC_URL` (aparece em `public/index.html` como
`%PUBLIC_URL%`), `NODE_ENV` (definida pelo CRA), `CI` (testes e build em modo CI).

## Primeiro acesso ao painel

O painel exige um usuário criado no back-end (script `npm run definir-senha` ou convite por e-mail — ver a documentação
do back-end). Depois: `http://localhost:3000/admin/login`.

## Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| "Module not found: Can't resolve 'shared/…'" | O servidor foi iniciado antes do `jsconfig.json` (`baseUrl: src`) existir | Reiniciar `npm start` |
| Catálogo mostra "Não conseguimos carregar os animais" | API fora do ar ou `REACT_APP_API_URL` errado | Subir a API / corrigir o `.env` e reiniciar |
| Login falha com "Não foi possível conectar ao servidor" | Idem, ou a origem do site não está no `CORS_ORIGIN` da API | Conferir a API |
