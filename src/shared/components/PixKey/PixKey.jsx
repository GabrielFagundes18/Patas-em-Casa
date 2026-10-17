/*
 * ============================================================================
 * ARQUIVO: PixKey.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Mostra a CHAVE PIX da ONG com um botão "Copiar". Tem dois visuais:
 *     - "card"   (padrão): um cartão em forma de etiqueta, usado na página de doação;
 *     - "inline": uma faixa em linha, usada na seção de doação da página inicial.
 *   Ao copiar, o botão mostra "Copiada" por 2 segundos.
 *
 * PRINCIPAIS ITENS:
 *   - PixKey({ variant }): o componente (exportação nomeada).
 *   - handleCopy(): função interna que copia a chave.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react                         → useState.
 *   - lucide-react                  → ícones Check (✓) e Copy.
 *   - shared/constants/organization → ORGANIZACAO (chave Pix, tipo e CNPJ).
 *   - ./PixKey.css                  → estilos dos dois visuais.
 *   - Usado por: features/donation/DonationPage.jsx (card) e
 *     features/home/sections/Donation/Donation.jsx (inline).
 * ============================================================================
 */

// O quê: chave Pix da ONG com botão de copiar, em cartão (variant "card") ou em linha (variant "inline").
// Como: usa a Clipboard API e mostra "Copiada" por 2 segundos; falha de cópia não quebra a tela.
// Para quê: doação direta sem intermediários: cartão na página de doação, linha na seção de doação da Home.
// Hook de estado.
import { useState } from 'react';
// Ícones: Check (confirmação) e Copy (copiar).
import { Check, Copy } from 'lucide-react';
// Dados da ONG (de onde vem a chave Pix).
import { ORGANIZACAO } from 'shared/constants/organization';
// Estilos do componente.
import './PixKey.css';

/*
 * COMPONENTE: PixKey
 * O que faz: exibe a chave Pix e permite copiá-la.
 * Parâmetros (props):
 *   - variant ('card' | 'inline', padrão 'card'): qual visual usar.
 * Retorno: JSX do cartão ou da faixa.
 * Onde é usado: DonationPage.jsx e a seção Donation da home.
 */
export function PixKey({ variant = 'card' }) {
  // copied: true logo depois de copiar (muda o texto/ícone do botão por 2 segundos).
  const [copied, setCopied] = useState(false);

  /*
   * FUNÇÃO INTERNA: handleCopy
   * O que faz: copia a chave Pix para a área de transferência e mostra a confirmação.
   * Parâmetros: nenhum. Retorno: Promise (função async), sem valor útil.
   * Onde é usada: no onClick dos botões "Copiar".
   */
  async function handleCopy() {
    try {
      // Copia o texto da chave. Pode falhar (ex.: sem permissão ou fora de HTTPS).
      await navigator.clipboard.writeText(ORGANIZACAO.pix.chave);
      // Mostra "Copiada".
      setCopied(true);
      // setTimeout agenda uma função para daqui a 2000 ms (2 s): volta ao texto "Copiar".
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Se a cópia falhar, apenas garante que não aparece "Copiada" (a tela não quebra).
      setCopied(false);
    }
  }

  // Texto para leitores de tela, conforme o estado.
  const copyLabel = copied ? 'Chave PIX copiada' : 'Copiar chave PIX';
  // Ícone conforme o estado (JSX pode ser guardado em variável).
  const copyIcon = copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />;

  // Visual "inline" (faixa da página inicial).
  if (variant === 'inline') {
    return (
      <div className="pix-inline">
        <span className="pix-inline-label">Prefere Pix?</span>
        {/* <code> indica texto "técnico" (a chave), exibido em fonte monoespaçada. */}
        <code className="pix-inline-key">{ORGANIZACAO.pix.chave}</code>
        {/* type="button" evita que o botão envie algum formulário em volta. */}
        <button type="button" className="pix-inline-copy" onClick={handleCopy} aria-label={copyLabel}>
          {copyIcon}
          <span>{copied ? 'Copiada' : 'Copiar'}</span>
        </button>
      </div>
    );
  }

  // Visual "card" (padrão): etiqueta da página de doação.
  return (
    <div className="pix-tag">
      {/* Furo decorativo da "etiqueta"; aria-hidden porque não tem significado. */}
      <span className="tag-hole" aria-hidden="true" />
      <span className="pix-label">Doação via PIX</span>

      {/* Linha com a chave e o botão de copiar. */}
      <div className="pix-key-row">
        <span className="pix-key-value">{ORGANIZACAO.pix.chave}</span>
        <button type="button" className="copy-btn" onClick={handleCopy} aria-label={copyLabel}>
          {copyIcon}
          <span>{copied ? 'Copiada' : 'Copiar'}</span>
        </button>
      </div>

      {/* Observação com o tipo da chave e o CNPJ da ONG. */}
      <p className="pix-note">Chave {ORGANIZACAO.pix.tipo} · CNPJ {ORGANIZACAO.cnpj}</p>
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente escolhe o visual pela prop "variant".
 *   2. Mostra a chave Pix (de ORGANIZACAO) e um botão "Copiar".
 *   3. Ao clicar, handleCopy copia a chave e muda o estado "copied" para true.
 *   4. O botão passa a mostrar ✓ "Copiada"; após 2 s, volta a "Copiar".
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Props com valor padrão (variant = 'card') e variações visuais de um componente.
 *   - Clipboard API (navigator.clipboard.writeText) com async/await e try/catch.
 *   - setTimeout para efeitos temporários.
 *   - Guardar JSX em variáveis.
 *   - Acessibilidade: aria-label dinâmico e aria-hidden em elementos decorativos.
 *   - Tag <code> para textos técnicos.
 * ============================================================================
 */
