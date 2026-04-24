import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Busca todas as origens únicas cadastradas pelos clientes do tenant
    const { rows } = await query(
       "SELECT DISTINCT source FROM clients WHERE tenant_id = $1 AND source IS NOT NULL AND source <> '' ORDER BY source ASC",
      [req.auth.tenantId]
    );
    
    const sources = rows.map(r => r.source);
    
    // Fallback caso não existam origens cadastradas
    if (sources.length === 0) {
      return res.json(['Indicação', 'Lead', 'Instagram', 'WhatsApp']);
    }
    
    res.json(sources);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da origem é obrigatório' });
    
    // No modelo atual, a origem é apenas uma string no cliente. 
    // Como a API espera retornar a string criada:
    res.status(201).json(name);
  } catch (e) {
    next(e);
  }
});

export default router;
