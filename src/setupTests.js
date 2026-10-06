import '@testing-library/jest-dom';

// O jsdom ainda não implementa os métodos de <dialog>; os diálogos do painel dependem deles.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ||= function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close ||= function close() { this.open = false; };
}

// Nem todo jsdom expõe a Web Crypto que os navegadores têm (usada para gerar senhas iniciais).
if (!window.crypto?.getRandomValues) {
  Object.defineProperty(window, 'crypto', { value: require('node:crypto').webcrypto, configurable: true });
}
