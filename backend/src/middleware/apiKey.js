/**
 * Middleware de autenticação via API key.
 * O cliente deve enviar o header `x-api-key` com o mesmo valor da env API_KEY.
 */
export function apiKeyAuth(req, res, next) {
  const expected = process.env.API_KEY;

  const isProd = process.env.NODE_ENV === 'production';

  // Em desenvolvimento, se a API_KEY não estiver configurada ou for curta,
  // permitimos passar para facilitar o setup inicial.
  if (!isProd && (!expected || expected.length < 16)) {
    return next();
  }

  // Se estiver configurada (ou em produção), validamos.
  if (isProd && (!expected || expected.length < 16)) {
    return res.status(500).json({
      error: 'Servidor mal configurado: API_KEY deve ter pelo menos 16 caracteres em produção.',
    });
  }

  const provided = req.header('x-api-key');

  // Se a chave for fornecida e bater, ok.
  if (provided && provided === expected) {
    return next();
  }

  // Se não bater, ou se não foi fornecida mas estamos em produção, bloqueia.
  if (isProd || (provided && provided !== expected)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Em desenvolvimento, se não foi fornecida e não bloqueamos acima, permitimos.
  return next();
}
