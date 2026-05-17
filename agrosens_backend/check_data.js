const pg = require('pg-promise');
const db = pg()('postgresql://postgres:1234@localhost:5432/agrosens_db');

(async () => {
  try {
    const result = await db.one(`
      SELECT COUNT(*)::int as total 
      FROM lecturas_sensores 
      WHERE timestamp > NOW() - INTERVAL '10 minutes'
    `);
    console.log('Total lecturas recientes:', result.total);
    
    const byLote = await db.any(`
      SELECT id_lote, COUNT(*)::int as cnt 
      FROM lecturas_sensores 
      WHERE timestamp > NOW() - INTERVAL '10 minutes'
      GROUP BY id_lote
    `);
    console.log('Por lote:');
    byLote.forEach(r => console.log(`  Lote ${r.id_lote}: ${r.cnt}`));
    
    db.$pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
