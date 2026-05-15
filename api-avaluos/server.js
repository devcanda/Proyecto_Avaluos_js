const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir) },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// === ENDPOINTS DASHBOARD Y SLA ===
app.get('/api/dashboard', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const [atrasados] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega < ? AND estado = "Activo"', [hoy]);
        const [enProceso] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega >= ? AND estado = "Activo"', [hoy]);
        const [pendientes] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega IS NULL AND estado = "Activo"');
        res.json({ atrasados: atrasados[0].total, enProceso: enProceso[0].total, pendientes: pendientes[0].total });
    } catch (error) { res.status(500).json({ error: "Error en indicadores" }); }
});

app.get('/api/avaluos', async (req, res) => {
    try {
        const [filas] = await db.query(`SELECT id, fechaRegistro, fecha_limite_entrega, estado, Solicitante AS solicitante, NumeroDocumento AS documento, TipoDeAvaluo AS tipo_avaluo, FechaDeVisita AS fecha_visita, DATE_FORMAT(FechaDeVisita, '%Y-%m-%d') AS fecha_vis_formato FROM avaluoenntity ORDER BY id DESC`);
        res.json(filas);
    } catch (error) { res.status(500).json({ error: "Error al obtener el listado" }); }
});

app.put('/api/avaluos/:id/tiempo', async (req, res) => {
    try {
        await db.query('UPDATE avaluoenntity SET fecha_limite_entrega = ? WHERE id = ?', [req.body.fecha_limite ? req.body.fecha_limite : null, req.params.id]);
        res.json({ mensaje: "Fecha límite asignada." });
    } catch (error) { res.status(500).json({ error: "Error interno." }); }
});

app.put('/api/avaluos/:id/finalizar', async (req, res) => {
    try { await db.query('UPDATE avaluoenntity SET estado = "Finalizado" WHERE id = ?', [req.params.id]); res.json({ mensaje: "Finalizado." }); } catch (error) { res.status(500).json({ error: "Error." }); }
});

app.put('/api/avaluos/:id/reactivar', async (req, res) => {
    try { await db.query('UPDATE avaluoenntity SET estado = "Activo" WHERE id = ?', [req.params.id]); res.json({ mensaje: "Reactivado." }); } catch (error) { res.status(500).json({ error: "Error." }); }
});

app.get('/api/avaluos/:id', async (req, res) => {
    try {
        const [filas] = await db.query('SELECT * FROM avaluoenntity WHERE id = ?', [req.params.id]);
        if (filas.length > 0) res.json(filas[0]);
        else res.status(404).json({ error: "Avalúo no encontrado" });
    } catch (error) { res.status(500).json({ error: "Error al obtener el avalúo" }); }
});

// === CREAR AVALÚO (SOLO GUARDAR EN DB) ===
app.post('/api/avaluos', upload.array('fotos', 20), async (req, res) => {
    try {
        const datos = JSON.parse(req.body.datosFormulario);
        delete datos.acabadosEdificacion; delete datos.ofertasMercado;
        datos.estado = 'Activo'; datos.fechaRegistro = new Date().toISOString().split('T')[0];

        const columnas = Object.keys(datos);
        const placeholders = columnas.map(() => '?').join(', ');
        const valores = Object.values(datos);

        const query = `INSERT INTO avaluoenntity (${columnas.join(', ')}) VALUES (${placeholders})`;
        const [resultado] = await db.query(query, valores);
        res.json({ mensaje: "Guardado correctamente", id: resultado.insertId });
    } catch (error) {
        console.error(error); res.status(500).json({ error: "Error de SQL" });
    }
});

// === ACTUALIZAR AVALÚO (SOLO GUARDAR EN DB) ===
app.put('/api/avaluos/:id', upload.array('fotos', 20), async (req, res) => {
    try {
        const datos = JSON.parse(req.body.datosFormulario);
        delete datos.acabadosEdificacion; delete datos.ofertasMercado; delete datos.id; 

        const columnas = Object.keys(datos);
        const valores = Object.values(datos);
        const setClause = columnas.map(k => `${k} = ?`).join(', ');

        const query = `UPDATE avaluoenntity SET ${setClause} WHERE id = ?`;
        await db.query(query, [...valores, req.params.id]);
        res.json({ mensaje: "Actualizado correctamente." });
    } catch (error) {
        console.error(error); res.status(500).json({ error: "Error de SQL" });
    }
});

// === COMPROBADOR DE ESTADO (Para la barra de carga) ===
app.get('/api/avaluos/:id/pdf-status', async (req, res) => {
    res.status(200).json({ status: "OK" });
});

// === GENERAR PDF BAJO DEMANDA Y ABRIR PESTAÑA ===
app.get('/api/avaluos/:id/pdf', async (req, res) => {
    try {
        const id = req.params.id;
        const [filas] = await db.query('SELECT * FROM avaluoenntity WHERE id = ?', [id]);
        if (filas.length === 0) return res.status(404).send("<h2>Avalúo no encontrado</h2>");
        
        const datos = filas[0];
        const nombreArchivo = `Avaluo_${id}.pdf`; 
        const rutaPDF = path.join(uploadsDir, nombreArchivo);

        const htmlPlantilla = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 3.5cm 2cm 2.5cm 3cm; }
                body { font-family: 'Arial', sans-serif; color: #333; font-size: 11px; }
                .membrete-header {
                    position: fixed; top: -3cm; left: 0; right: 0;
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 3px solid #1d429a; padding-bottom: 10px;
                }
                .logo-area { width: 120px; height: 60px; background: #f4f6f9; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 1px dashed #ccc; color: #888;}
                .empresa-info { text-align: center; flex: 1; }
                .empresa-info h1 { color: #1d429a; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 1px; }
                .empresa-info p { margin: 2px 0 0 0; font-size: 10px; color: #555; font-weight: bold;}
                .folio-box { border: 2px solid #1d429a; padding: 5px 15px; text-align: center; border-radius: 5px; width: 100px;}
                .folio-box b { color: #dc3545; display: block; font-size: 14px; margin: 2px 0;}
                .section-title { background-color: #1d429a; color: white; padding: 5px 10px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                th, td { border: 1px solid #dee2e6; padding: 5px; text-align: left; }
                th { background-color: #f8f9fa; color: #1d429a; width: 25%; }
                td { width: 25%; }
            </style>
        </head>
        <body>
            <div class="membrete-header">
                <div class="logo-area">ESPACIO LOGO</div>
                <div class="empresa-info">
                    <h1>CANDAMIL & ASOCIADOS</h1>
                    <p>PERITOS AVALUADORES E INMOBILIARIOS</p>
                    <p style="font-weight: normal;">TULUÁ, VALLE DEL CAUCA</p>
                </div>
                <div class="folio-box">
                    <span style="font-size: 9px; color: #1d429a; font-weight: bold;">RADICADO</span>
                    <b>#${id}</b>
                    <span style="font-size: 9px;">${new Date().toLocaleDateString()}</span>
                </div>
            </div>

            <h3 style="text-align: center; color: #333; margin-top: 10px;">INFORME DE AVALÚO ${datos.TipoDeAvaluo ? datos.TipoDeAvaluo.toUpperCase() : ''}</h3>

            <div class="section-title">1. INFORMACIÓN GENERAL Y JURÍDICA</div>
            <table>
                <tr><th>Solicitante</th><td colspan="3">${datos.Solicitante || ''}</td></tr>
                <tr><th>No. Documento</th><td>${datos.NumeroDocumento || ''}</td><th>Entidad</th><td>${datos.Entidad || ''}</td></tr>
                <tr><th>Propietario</th><td colspan="3">${datos.Propietario || ''}</td></tr>
                <tr><th>Matrícula Inmobiliaria</th><td>${datos.matriculainmNumero1 || ''}</td><th>Cédula Catastral</th><td>${datos.CedulaCatastral || ''}</td></tr>
            </table>

            <div class="section-title">2. UBICACIÓN DEL INMUEBLE</div>
            <table>
                <tr><th>Dirección</th><td colspan="3">${datos.Direccion || ''}</td></tr>
                <tr><th>Departamento</th><td>${datos.Departamento || ''}</td><th>Municipio</th><td>${datos.Municipio || ''}</td></tr>
                <tr><th>Barrio / Sector</th><td>${datos.Barrio || ''} / ${datos.Sector || ''}</td><th>Coordenadas</th><td>${datos.Latitud || ''} , ${datos.Longitud || ''}</td></tr>
            </table>

            <div class="section-title">3. RESUMEN DE VALORACIÓN</div>
            <table>
                <tr style="text-align: center; background-color: #e9ecef;"><th>ÍTEM</th><th>ÁREA (M²)</th><th>VALOR UNITARIO</th><th>VALOR TOTAL</th></tr>
                <tr>
                    <th>Terreno</th><td style="text-align:center;">${datos.CVTArea || '0'}</td>
                    <td style="text-align:center;">$ ${Number(datos.CVTValorUnitario || 0).toLocaleString('es-CO')}</td>
                    <td style="text-align:center; color: #198754; font-weight: bold;">$ ${(Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)).toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                    <th>Construcción</th><td style="text-align:center;">${datos.CVEArea || '0'}</td>
                    <td style="text-align:center;">$ ${Number(datos.CVEValorUnitario || 0).toLocaleString('es-CO')}</td>
                    <td style="text-align:center; color: #198754; font-weight: bold;">$ ${(Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0)).toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                    <th colspan="3" style="text-align: right; background-color: #f8f9fa;">GRAN TOTAL AVALÚO:</th>
                    <td style="text-align:center; color: #198754; font-weight: bold; font-size: 14px;">$ ${((Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)) + (Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0))).toLocaleString('es-CO')}</td>
                </tr>
            </table>

            <div style="position: fixed; bottom: -2cm; left: 0; right: 0; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666;">
                <p style="margin: 0; font-weight: bold; font-size: 12px; color: #333;">Diego Antonio Candamil Rengifo</p>
                <p style="margin: 2px 0 0 0;">Abogado Especialista / Perito Avaluador - R.N.A. AVAL-94355787</p>
            </div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0' });
        await page.pdf({ path: rutaPDF, format: 'Letter', printBackground: true });
        await browser.close();

        res.sendFile(rutaPDF);

    } catch (error) {
        console.error(error);
        // Pantalla de error amigable en la nueva pestaña
        res.status(500).send(`
            <div style="font-family: Arial; padding: 50px; text-align: center;">
                <h2 style="color: red;">❌ Error al generar el PDF</h2>
                <p>Ocurrió un problema en el motor de renderizado (Puppeteer).</p>
                <code style="background: #eee; padding: 10px; display: block; margin-top: 20px;">${error.message}</code>
            </div>
        `);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});