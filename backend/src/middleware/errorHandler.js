import { ZodError } from 'zod';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err && err.status && err.expose) {
    return res.status(err.status).json({ error: err.message });
  }

  // Erro genérico — NÃO vazar detalhes internos
  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  e.expose = true;
  return e;
}
