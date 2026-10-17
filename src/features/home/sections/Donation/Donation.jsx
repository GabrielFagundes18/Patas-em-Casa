/*
 * ============================================================================
 * ARQUIVO: Donation.jsx (seção da página inicial)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Seção "Doe" da página inicial. À esquerda explica para onde vai o dinheiro e
 *   mostra a chave Pix; à direita há um mini formulário "Doar online" em que o
 *   visitante escolhe o TIPO (única ou mensal) e o VALOR. Ao enviar, o site abre a
 *   página /doar já com essas escolhas, onde a doação é concluída.
 *
 * PRINCIPAIS ITENS:
 *   - NEEDS, VALUES, TYPES: listas fixas (necessidades, valores e tipos de doação).
 *   - donationPath(tipo, valor): monta o endereço /doar?tipo=...&valor=... (exportada).
 *   - Donation(): o componente da seção (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./Donation.css                     → estilos da seção.
 *   - react (useState), react-router-dom (useNavigate), lucide-react (ícones).
 *   - shared/components/PixKey/PixKey    → chave Pix (versão "inline").
 *   - features/donation/DonationPage.jsx → página /doar, que lê "tipo" e "valor" da URL.
 *   - Classes home-* de features/home/LandingPage.css.
 *   - Quem usa: features/home/LandingPage.jsx.
 * ============================================================================
 */

// O quê: seção de doação da Home: para onde vai o dinheiro, a chave Pix e um atalho para doar online.
// Como: o visitante escolhe tipo (única/mensal) e valor aqui; o botão abre /doar já com essa escolha,
// onde informa nome e e-mail e segue para o Mercado Pago.
// Para quê: começar a doação na própria Home sem repetir o formulário de pagamento.
// Estilos da seção.
import './Donation.css';
// Hook de estado.
import { useState } from 'react';
// useNavigate: devolve uma função para mudar de página pelo código (sem clicar num Link).
import { useNavigate } from 'react-router-dom';
// Ícones: ✓ em círculo, coração e escudo.
import { CircleCheck, Heart, ShieldCheck } from 'lucide-react';
// Componente da chave Pix.
import { PixKey } from 'shared/components/PixKey/PixKey';

// Necessidades permanentes de qualquer abrigo; campanhas específicas ficam fora da Home para não envelhecer.
const NEEDS = ['Ração e alimentação', 'Vacinas e vermífugos', 'Castrações', 'Consultas e remédios'];
// Valores sugeridos (em reais).
const VALUES = [25, 50, 100, 200];
// Tipos de doação: "unica" ou "recorrente" (mensal). value = código; label = texto exibido.
const TYPES = [
  { value: 'unica', label: 'Única' },
  { value: 'recorrente', label: 'Mensal' },
];

/*
 * FUNÇÃO: donationPath (exportada)
 * O que faz: monta o endereço da página de doação com as escolhas na URL.
 * Parâmetros:
 *   - tipo (string): 'unica' ou 'recorrente'.
 *   - valor (number | 'outro'): valor escolhido ou 'outro'.
 * Retorno (string): ex.: "/doar?tipo=recorrente&valor=50".
 * Onde é usada: no envio do formulário desta seção.
 */
export function donationPath(tipo, valor) {
  // URLSearchParams transforma um objeto em "query string" (chave=valor&chave=valor),
  // já codificando caracteres especiais. Dentro da template string, ele vira texto automaticamente.
  return `/doar?${new URLSearchParams({ tipo, valor: String(valor) })}`;
}

/*
 * COMPONENTE: Donation
 * O que faz: desenha a seção de doação e leva o visitante a /doar com as escolhas feitas.
 * Parâmetros: nenhum.
 * Retorno: JSX da <section id="ajudar">.
 * Onde é usado: LandingPage.jsx.
 */
function Donation() {
  // Função para navegar para outra página.
  const navigate = useNavigate();
  // Tipo escolhido (começa em "mensal", para incentivar a doação recorrente).
  const [tipo, setTipo] = useState('recorrente');
  // Valor escolhido (começa em 50). Pode ser um número ou 'outro'.
  const [valor, setValor] = useState(50);

  // Texto do botão: "Escolher o valor" para "outro"; senão "Doar R$ 50" ou "Doar R$ 50 por mês".
  const submitLabel = valor === 'outro'
    ? 'Escolher o valor'
    : `Doar R$ ${valor}${tipo === 'recorrente' ? ' por mês' : ''}`;

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: impede o recarregamento da página e navega para /doar com as escolhas.
   * Parâmetros: event (evento de envio do formulário).
   * Retorno: nada.
   */
  function handleSubmit(event) {
    // Impede o envio "tradicional" do formulário (que recarregaria a página).
    event.preventDefault();
    // Vai para /doar?tipo=...&valor=...
    navigate(donationPath(tipo, valor));
  }

  return (
    // id="ajudar": alvo de âncoras para esta seção.
    <section id="ajudar" className="home-section home-donate" aria-labelledby="donate-title">
      <div className="wrap home-donate-layout">
        {/* ===== Coluna de texto ===== */}
        <div className="home-donate-copy">
          <p className="home-eyebrow">Doe</p>
          <h2 id="donate-title" className="home-title">Sua doação vira ração, vacina e cuidado.</h2>
          <p className="home-lead">
            Com uma doação única ou mensal você ajuda a manter os animais alimentados, vacinados e em tratamento até
            encontrarem um lar.
          </p>
          {/* Lista de necessidades com ícone de ✓. */}
          <ul className="home-donate-needs" aria-label="Para onde vai a doação">
            {NEEDS.map((need) => (
              <li key={need}>
                <CircleCheck size={20} aria-hidden="true" />
                {need}
              </li>
            ))}
          </ul>
          {/* Chave Pix em versão de faixa. */}
          <PixKey variant="inline" />
        </div>

        {/* ===== Cartão "Doar online" (um formulário) ===== */}
        <form className="home-donate-card" onSubmit={handleSubmit} aria-labelledby="donate-form-title">
          <h3 id="donate-form-title">Doar online</h3>

          {/* Grupo de botões de rádio para o TIPO. <fieldset> agrupa e <legend> dá o título do grupo. */}
          <fieldset className="home-fieldset">
            <legend>Tipo de doação</legend>
            {/* "Controle segmentado": rádios com aparência de botões lado a lado. */}
            <div className="home-segmented">
              {TYPES.map((option) => (
                // A classe "is-selected" destaca a opção marcada.
                <label key={option.value} className={tipo === option.value ? 'is-selected' : ''}>
                  {/* O rádio fica escondido visualmente (mas acessível); o <label> inteiro é clicável.
                      checked e onChange tornam o rádio "controlado" pelo estado "tipo".
                      name="tipo" agrupa os rádios: só um pode ficar marcado. */}
                  <input
                    checked={tipo === option.value}
                    className="home-visually-hidden"
                    name="tipo"
                    onChange={() => setTipo(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Grupo de botões de rádio para o VALOR. */}
          <fieldset className="home-fieldset">
            <legend>Valor</legend>
            <div className="home-amounts">
              {/* [...VALUES, 'outro'] cria uma lista nova com os valores + a opção "outro". */}
              {[...VALUES, 'outro'].map((option) => (
                // Classes: "is-selected" se marcada; "is-wide" para "outro" (ocupa 2 colunas).
                <label key={option} className={`${valor === option ? 'is-selected' : ''} ${option === 'outro' ? 'is-wide' : ''}`.trim()}>
                  {/* Rádio controlado pelo estado "valor". */}
                  <input
                    checked={valor === option}
                    className="home-visually-hidden"
                    name="valor"
                    onChange={() => setValor(option)}
                    type="radio"
                    value={option}
                  />
                  {/* Texto da opção. */}
                  {option === 'outro' ? 'Outro valor' : `R$ ${option}`}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Botão de envio com o texto calculado acima. */}
          <button type="submit" className="home-donate-submit">
            <Heart size={18} aria-hidden="true" /> {submitLabel}
          </button>
          {/* Observação sobre o pagamento. */}
          <p className="home-donate-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Pagamento pelo Mercado Pago. Única: Pix, cartão ou boleto. Mensal: cartão, e dá para cancelar quando quiser.</span>
          </p>
        </form>
      </div>
    </section>
  );
}

// Exporta a seção como padrão do arquivo.
export default Donation;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A seção mostra para onde vai a doação e a chave Pix.
 *   2. No cartão, o visitante escolhe tipo e valor (rádios controlados pelo estado).
 *   3. O texto do botão se atualiza conforme as escolhas.
 *   4. Ao enviar, handleSubmit navega para /doar?tipo=...&valor=..., onde a
 *      DonationPage termina a doação (nome, e-mail e Mercado Pago).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formulários controlados com botões de rádio (checked + onChange + name).
 *   - <fieldset> e <legend> para agrupar campos (acessibilidade).
 *   - Esconder o rádio visualmente mantendo a acessibilidade (classe visually-hidden).
 *   - Navegação programática com useNavigate.
 *   - URLSearchParams para montar query strings.
 *   - Passar dados entre páginas pela URL.
 *   - event.preventDefault em formulários.
 * ============================================================================
 */
