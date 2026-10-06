// O quê: cartão com a chave Pix da ONG e botão de copiar.
// Como: usa a Clipboard API e mostra "Copiada" por 2 segundos; falha de cópia não quebra a tela.
// Para quê: doação direta sem intermediários, usada na Home e como alternativa na página de doação.
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ORGANIZACAO } from '../../constants/organizacao';
import '../Donation/Donation.css';

export function PixKey() {
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

  return (
    <div className="pix-tag">
      <span className="tag-hole" aria-hidden="true" />
      <span className="pix-label">Doação via PIX</span>

      <div className="pix-key-row">
        <span className="pix-key-value">{ORGANIZACAO.pix.chave}</span>
        <button
          type="button"
          className="copy-btn"
          onClick={handleCopy}
          aria-label={copied ? 'Chave PIX copiada' : 'Copiar chave PIX'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copiada' : 'Copiar'}</span>
        </button>
      </div>

      <p className="pix-note">Chave {ORGANIZACAO.pix.tipo} · CNPJ {ORGANIZACAO.cnpj}</p>
    </div>
  );
}
