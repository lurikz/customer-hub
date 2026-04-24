import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

async function seed() {
  console.log('🌱 Populando banco de dados...');
  
  try {
    // 1. Criar Plano Master
    const { rows: planRows } = await pool.query(`
      INSERT INTO plans (name, max_users, features)
      VALUES ('Plano Master', 999, '{"clientes": true, "agenda": true}')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    let planId = planRows[0]?.id;
    if (!planId) {
       const res = await pool.query("SELECT id FROM plans WHERE name = 'Plano Master' LIMIT 1");
       planId = res.rows[0].id;
    }

    // 2. Criar Tenant Master
    const { rows: tenantRows } = await pool.query(`
      INSERT INTO tenants (name, plan_id)
      VALUES ('Mudali Tech Master', $1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [planId]);
    
    let tenantId = tenantRows[0]?.id;
    if (!tenantId) {
      const res = await pool.query("SELECT id FROM tenants WHERE name = 'Mudali Tech Master' LIMIT 1");
      tenantId = res.rows[0].id;
    }

    // 3. Criar Perfil de Administrador para o Tenant
    const { rows: roleRows } = await pool.query(`
      INSERT INTO roles (name, tenant_id, permissions)
      VALUES ('Administrador Master', $1, '{"clients": {"visualizar": true, "editar": true, "excluir": true}, "agenda": {"acessar": true}}')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [tenantId]);
    
    let roleId = roleRows[0]?.id;
    if (!roleId) {
       const res = await pool.query("SELECT id FROM roles WHERE name = 'Administrador Master' AND tenant_id = $1 LIMIT 1", [tenantId]);
       roleId = res.rows[0].id;
    }

    // 4. Criar Usuário Master
    const email = 'padilha.ctt@gmail.com';
    const password = 'mp469535';
    const hash = await bcrypt.hash(password, 12);
    
    await pool.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, role_id)
      VALUES ($1, 'Padilha Master', $2, $3, 'super_admin', $4)
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        role = EXCLUDED.role,
        role_id = EXCLUDED.role_id
    `, [tenantId, email, hash, roleId]);

    console.log('✅ Seed finalizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
