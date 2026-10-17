/*
 * ============================================================================
 * ARQUIVO: setupTests.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Arquivo de configuração dos TESTES automatizados do front-end. O Jest (o
 *   executor de testes usado pelo react-scripts) roda este arquivo
 *   automaticamente ANTES de cada arquivo de teste (*.test.js).
 *   Ele prepara o ambiente de teste, que simula um navegador (o "jsdom"), mas
 *   não tem tudo o que um navegador real tem. Aqui "completamos" o que falta.
 *
 * PRINCIPAIS ITENS:
 *   - Importa os "matchers" extras do jest-dom (ex.: toBeInTheDocument).
 *   - Cria versões simples de showModal() e close() para o elemento <dialog>.
 *   - Garante que window.crypto.getRandomValues exista.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - @testing-library/jest-dom → biblioteca de verificações para elementos da página.
 *   - node:crypto               → módulo de criptografia do Node.js (fornece webcrypto).
 *   - É usado por TODOS os arquivos *.test.js do front-end (de forma automática).
 *   - Os diálogos do painel (ex.: admin/shared/AdminDialog.jsx) usam <dialog>;
 *     o gerador de senha da equipe (admin/team) usa crypto.getRandomValues.
 * ============================================================================
 */

// Importa o jest-dom só pelo "efeito": ele adiciona novas verificações ao "expect" do Jest,
// como expect(elemento).toBeInTheDocument() ou .toHaveTextContent('...').
import '@testing-library/jest-dom';

// O jsdom ainda não implementa os métodos de <dialog>; os diálogos do painel dependem deles.
// "typeof X !== 'undefined'" verifica se a classe HTMLDialogElement existe no ambiente,
// sem gerar erro caso ela não exista.
if (typeof HTMLDialogElement !== 'undefined') {
  // ".prototype" é o "molde" compartilhado por todos os elementos <dialog>. Adicionar um método
  // nele faz o método existir em todos os <dialog> da página.
  // "||=" só atribui se o método ainda não existir (não substitui uma implementação real).
  // A versão falsa de showModal apenas marca o diálogo como aberto ("this" é o próprio <dialog>).
  HTMLDialogElement.prototype.showModal ||= function showModal() { this.open = true; };
  // A versão falsa de close apenas marca o diálogo como fechado.
  HTMLDialogElement.prototype.close ||= function close() { this.open = false; };
}

// Nem todo jsdom expõe a Web Crypto que os navegadores têm (usada para gerar senhas iniciais).
// "?." (encadeamento opcional): se window.crypto não existir, o resultado é undefined
// e o "!" transforma em true, entrando no if.
if (!window.crypto?.getRandomValues) {
  // Object.defineProperty cria a propriedade window.crypto apontando para a Web Crypto do Node.js.
  // "require" carrega o módulo node:crypto (funciona aqui porque os testes rodam no Node).
  // configurable: true permite que a propriedade seja alterada/removida depois, se preciso.
  Object.defineProperty(window, 'crypto', { value: require('node:crypto').webcrypto, configurable: true });
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao rodar "npm test", o Jest executa este arquivo antes de cada arquivo de teste.
 *   2. Ele ativa as verificações do jest-dom.
 *   3. Se o <dialog> não tiver showModal/close, cria versões simples.
 *   4. Se não houver window.crypto.getRandomValues, usa a implementação do Node.
 *   5. Depois disso, os testes rodam como se estivessem num navegador mais completo.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testes automatizados com Jest e Testing Library.
 *   - jsdom: um "navegador falso" que roda dentro do Node.js.
 *   - "Polyfill": código que implementa um recurso que falta no ambiente.
 *   - Prototype em JavaScript (como métodos são compartilhados entre objetos).
 *   - Operadores "||=" e "?.".
 *   - Object.defineProperty.
 *   - O elemento HTML <dialog> e a API Web Crypto.
 * ============================================================================
 */
