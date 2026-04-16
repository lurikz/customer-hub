/**
 * Middleware de autenticação via API key.
 * O cliente deve enviar o header `x-api-key` com o mesmo valor da env API_KEY.
 */
export function apiKeyAuth(req, res, next) {
  const expected = process.env.API_KEY;

  if (!expected || expected.length < 16) {
    // Falha segura: se a chave não estiver configurada corretamente, recusa tudo.
    return res
      .status(500)
      .json({ error: 'Servidor mal configurado: API_KEY ausente ou muito curta.' });
  }

  const provided = req.header('x-api-key');
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  return next();
}
