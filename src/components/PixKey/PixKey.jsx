// O quê: chave Pix da ONG com botão de copiar, em cartão (variant "card") ou em linha (variant "inline").
// Como: usa a Clipboard API e mostra "Copiada" por 2 segundos; falha de cópia não quebra a tela.
// Para quê: doação direta sem intermediários: cartão na página de doação, linha na seção de doação da Home.
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ORGANIZACAO } from '../../constants/organizacao';
import './PixKey.css';

export function PixKey({ variant = 'card' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ORGANIZACAO.pix.chave);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const copyLabel = copied ? 'Chave PIX copiada' : 'Copiar chave PIX';
  const copyIcon = copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />;

  if (variant === 'inline') {
    return (
      <div className="pix-inline">
        <span className="pix-inline-label">Prefere Pix?</span>
        <code className="pix-inline-key">{ORGANIZACAO.pix.chave}</code>
        <button type="button" className="pix-inline-copy" onClick={handleCopy} aria-label={copyLabel}>
          {copyIcon}
          <span>{copied ? 'Copiada' : 'Copiar'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pix-tag">
      <span className="tag-hole" aria-hidden="true" />
      <span className="pix-label">Doação via PIX</span>

      <div className="pix-key-row">
        <span className="pix-key-value">{ORGANIZACAO.pix.chave}</span>
        <button type="button" className="copy-btn" onClick={handleCopy} aria-label={copyLabel}>
          {copyIcon}
          <span>{copied ? 'Copiada' : 'Copiar'}</span>
        </button>
      </div>

      <p className="pix-note">Chave {ORGANIZACAO.pix.tipo} · CNPJ {ORGANIZACAO.cnpj}</p>
    </div>
  );
}
