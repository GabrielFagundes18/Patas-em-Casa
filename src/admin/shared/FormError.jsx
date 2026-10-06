// Erro devolvido pela API com os detalhes por campo (ex.: política de senha, e-mail já cadastrado).
export default function FormError({ error, fallback }) {
  if (!error) return null;

  const apiError = error?.response?.data?.error;
  const details = [...new Set((apiError?.details || []).map((detail) => detail.message).filter(Boolean))];

  return (
    <div className="admin-alert is-error" role="alert">
      <p>{apiError?.message || fallback}</p>
      {details.length > 0 ? (
        <ul>
          {details.map((message) => <li key={message}>{message}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
