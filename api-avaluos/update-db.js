const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'candamil_avaluo'
  });
  const newOrder = JSON.stringify([
    { id: 1, tipo: 'seccion_general_imagenes' },
    { id: 2, tipo: 'seccion_areas_normatividad' },
    { id: 3, tipo: 'seccion_sector' },
    { id: 4, tipo: 'seccion_predio_dotacion' },
    { id: 5, tipo: 'seccion_comparables_valoracion' },
    { id: 6, tipo: 'seccion_croquis' },
    { id: 7, tipo: 'seccion_usos_propuestos' },
    { id: 8, tipo: 'seccion_textos_legales' }
  ]);
  const [res] = await conn.execute('UPDATE plantillas_pdf SET configuracion_campos = ? WHERE es_predeterminada = 1', [newOrder]);
  console.log('Affected rows:', res.affectedRows);
  await conn.end();
}
run().catch(console.error);
