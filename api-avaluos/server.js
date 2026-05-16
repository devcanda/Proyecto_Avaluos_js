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
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir) },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// AÑADIDO: 'membrete' para recibir la imagen de las plantillas
const uploadFiles = multer({ storage: storage }).fields([
    { name: 'fotoFachada', maxCount: 1 },
    { name: 'fotoMapa', maxCount: 1 },
    { name: 'fotosAnexos', maxCount: 20 },
    { name: 'membrete', maxCount: 1 } 
]);

// ==========================================
// RUTAS DEL DASHBOARD Y AVALÚOS (INTACTAS)
// ==========================================
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

app.post('/api/avaluos', uploadFiles, async (req, res) => {
    try {
        const datos = JSON.parse(req.body.datosFormulario);
        delete datos.acabadosEdificacion; delete datos.ofertasMercado;
        datos.estado = 'Activo'; datos.fechaRegistro = new Date().toISOString().split('T')[0];

        if (req.files['fotoFachada']) datos.foto_fachada = req.files['fotoFachada'][0].filename;
        if (req.files['fotoMapa']) datos.foto_mapa = req.files['fotoMapa'][0].filename;
        
        const metaAnexos = JSON.parse(req.body.metaAnexos || '[]');
        let anexosFinales = [];
        let nuevosArchivos = req.files['fotosAnexos'] || [];
        let nuevosIndex = 0;

        for (let meta of metaAnexos) {
            if (meta.tipo === 'nuevo' && nuevosArchivos[nuevosIndex]) {
                anexosFinales.push({ filename: nuevosArchivos[nuevosIndex].filename, titulo: meta.titulo });
                nuevosIndex++;
            }
        }
        datos.fotos_anexos = JSON.stringify(anexosFinales);

        const columnas = Object.keys(datos);
        const placeholders = columnas.map(() => '?').join(', ');
        const valores = Object.values(datos);

        const query = `INSERT INTO avaluoenntity (${columnas.join(', ')}) VALUES (${placeholders})`;
        const [resultado] = await db.query(query, valores);
        res.json({ mensaje: "Guardado correctamente", id: resultado.insertId });

    } catch (error) { console.error(error); res.status(500).json({ error: "Error al guardar." }); }
});

app.put('/api/avaluos/:id', uploadFiles, async (req, res) => {
    try {
        const datos = JSON.parse(req.body.datosFormulario);
        delete datos.acabadosEdificacion; delete datos.ofertasMercado; delete datos.id; 

        if (req.files['fotoFachada']) datos.foto_fachada = req.files['fotoFachada'][0].filename;
        if (req.files['fotoMapa']) datos.foto_mapa = req.files['fotoMapa'][0].filename;

        const metaAnexos = JSON.parse(req.body.metaAnexos || '[]');
        let anexosFinales = [];
        let nuevosArchivos = req.files['fotosAnexos'] || [];
        let nuevosIndex = 0;

        for (let meta of metaAnexos) {
            if (meta.tipo === 'viejo') {
                anexosFinales.push({ filename: meta.filename, titulo: meta.titulo });
            } else if (meta.tipo === 'nuevo' && nuevosArchivos[nuevosIndex]) {
                anexosFinales.push({ filename: nuevosArchivos[nuevosIndex].filename, titulo: meta.titulo });
                nuevosIndex++;
            }
        }
        datos.fotos_anexos = JSON.stringify(anexosFinales);

        const columnas = Object.keys(datos);
        const valores = Object.values(datos);
        const setClause = columnas.map(k => `${k} = ?`).join(', ');

        const query = `UPDATE avaluoenntity SET ${setClause} WHERE id = ?`;
        await db.query(query, [...valores, req.params.id]);
        res.json({ mensaje: "Actualizado correctamente." });

    } catch (error) { console.error(error); res.status(500).json({ error: "Error de SQL" }); }
});

app.get('/api/avaluos/:id/pdf-status', async (req, res) => { res.status(200).json({ status: "OK" }); });


// ==========================================
// 🎨 NUEVAS RUTAS: GESTOR DE PLANTILLAS
// ==========================================
app.get('/api/plantillas', async (req, res) => {
    try {
        const [filas] = await db.query('SELECT * FROM plantillas_pdf ORDER BY es_predeterminada DESC, id DESC');
        res.json(filas);
    } catch (error) { res.status(500).json({ error: "Error al obtener plantillas" }); }
});

app.post('/api/plantillas', uploadFiles, async (req, res) => {
    try {
        const datos = JSON.parse(req.body.configuracion);
        let filename = null;
        if (req.files['membrete']) filename = req.files['membrete'][0].filename;

        const ajustes = JSON.stringify({ ejeX: datos.ejeX, ejeY: datos.ejeY, escala: datos.escala });
        const bloques = JSON.stringify(datos.bloquesSeleccionados);

        // Si es la primera plantilla, la hacemos predeterminada
        const [totales] = await db.query('SELECT COUNT(*) as total FROM plantillas_pdf');
        const esPredeterminada = totales[0].total === 0 ? 1 : 0;

        await db.query(
            'INSERT INTO plantillas_pdf (nombre, membrete_url, ajustes_membrete, configuracion_campos, es_predeterminada) VALUES (?, ?, ?, ?, ?)',
            [datos.nombre, filename, ajustes, bloques, esPredeterminada]
        );
        res.json({ mensaje: "Plantilla creada correctamente" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error al guardar plantilla" }); }
});

app.put('/api/plantillas/:id/activa', async (req, res) => {
    try {
        // Apagamos todas
        await db.query('UPDATE plantillas_pdf SET es_predeterminada = 0');
        // Encendemos la seleccionada
        await db.query('UPDATE plantillas_pdf SET es_predeterminada = 1 WHERE id = ?', [req.params.id]);
        res.json({ mensaje: "Plantilla fijada como oficial." });
    } catch (error) { res.status(500).json({ error: "Error al actualizar." }); }
});


// ==============================================================================
// 🎯 GENERADOR DE PDF - AISLADO: SOLO LA PORTADA (3 IMÁGENES + INFO)
// ==============================================================================
app.get('/api/avaluos/:id/pdf', async (req, res) => {
    try {
        const id = req.params.id;
        const [filas] = await db.query('SELECT * FROM avaluoenntity WHERE id = ?', [id]);
        if (filas.length === 0) return res.status(404).send("<h2>Avalúo no encontrado</h2>");
        
        const datos = filas[0];
        const rutaPDF = path.join(uploadsDir, `Avaluo_${id}.pdf`);

        // Formateador de fechas seguro
        const formatF = (d) => {
            if (!d) return '';
            try { return new Date(d).toISOString().split('T')[0]; } 
            catch(e) { return d; }
        };

        const getBase64Image = (filename) => {
            if (!filename) return '';
            try {
                const filepath = path.join(uploadsDir, filename);
                if (fs.existsSync(filepath)) {
                    const ext = path.extname(filepath).substring(1) || 'jpg';
                    return `data:image/${ext};base64,${fs.readFileSync(filepath).toString('base64')}`;
                }
            } catch (e) {} return '';
        };

        // Extrae las imágenes
        const b64Membrete = getBase64Image('membrete.jpg'); 
        const b64Fachada = getBase64Image(datos.foto_fachada);
        const b64Mapa = getBase64Image(datos.foto_mapa);
        
        let b64TerceraImagen = '';
        if (datos.fotos_anexos) {
            try {
                const anexosObj = JSON.parse(datos.fotos_anexos);
                // Toma la primera foto de la sección de anexos para el Croquis
                if(anexosObj.length > 0) b64TerceraImagen = getBase64Image(anexosObj[0].filename);
            } catch(e){}
        }

        const htmlPlantilla = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 0; size: letter; }
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #222; margin: 0; padding: 0; }
                
                .fondo-membrete { position: absolute; top: 0; left: 0; width: 215.9mm; height: 279.4mm; z-index: -1; object-fit: fill; }

                /* ZONA SEGURA: Ajuste milimétrico para no pisar el membrete */
                .portada-container { 
                    padding-top: 4.2cm;  
                    padding-left: 2.2cm; 
                    padding-right: 2.2cm; 
                    padding-bottom: 3.5cm;
                    height: 279.4mm; 
                    box-sizing: border-box; 
                }

                .header-info { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1a2b4c; padding-bottom: 5px; margin-bottom: 15px; }
                .titulo-documento { color: #1a2b4c; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; margin:0;}
                .folio-box { text-align: right; color: #555; font-size: 9px; }
                .folio-box b { color: #dc3545; font-size: 13px; display: block; margin-top:2px;}

                /* TABLA DE INFO BÁSICA */
                table.info-basica { width: 100%; border-collapse: collapse; margin-bottom: 15px; background: rgba(255,255,255,0.95); }
                table.info-basica td { border: 1px solid #e0e0e0; padding: 6px 10px; font-size: 10px; }
                table.info-basica td.label { background-color: #f4f6f9; color: #1a2b4c; font-weight: bold; width: 15%; text-transform: uppercase; font-size: 8px;}
                
                /* CONTENEDOR DE IMÁGENES */
                .foto-box { background: white; border: 1px solid #e0e0e0; padding: 5px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}
                .foto-titulo { background: #f4f6f9; color: #1a2b4c; padding: 5px; font-size: 9px; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; border-bottom: 1px solid #e0e0e0; }
                
                .img-fachada { width: 100%; height: 280px; object-fit: contain; }
                .img-secundaria { width: 100%; height: 210px; object-fit: contain; }
                
                .grid-inferior { display: flex; justify-content: space-between; width: 100%; }
                .columna-mitad { width: 48.5%; }

                .caja-sin-imagen { display: flex; align-items: center; justify-content: center; color: gray; font-style: italic; border: 1px dashed #ccc; background: #fafafa;}
            </style>
        </head>
        <body>
            <img src="${b64Membrete}" class="fondo-membrete" />
            
            <div class="portada-container">
                <div class="header-info">
                    <h1 class="titulo-documento">INFORME DE AVALÚO<br><span style="font-size:11px; color:#555; font-weight:normal;">${datos.TipoDeAvaluo || 'COMERCIAL'}</span></h1>
                    <div class="folio-box">RADICADO<br><b>#${id}</b></div>
                </div>

                <table class="info-basica">
                    <tr><td class="label">Solicitante</td><td><b>${datos.Solicitante || 'N/A'}</b></td><td class="label">Fecha</td><td><b>${formatF(datos.FechaDelAvalio)}</b></td></tr>
                    <tr><td class="label">Dirección</td><td colspan="3"><b>${datos.Direccion || 'N/A'}</b>, ${datos.Municipio || ''} - ${datos.Departamento || ''}</td></tr>
                </table>

                <div class="foto-box">
                    <div class="foto-titulo">FACHADA DEL INMUEBLE</div>
                    ${b64Fachada ? `<img src="${b64Fachada}" class="img-fachada" />` : '<div class="caja-sin-imagen" style="height:280px;">Sin foto de fachada</div>'}
                </div>

                <div class="grid-inferior">
                    <div class="columna-mitad">
                        <div class="foto-box">
                            <div class="foto-titulo">GEOLOCALIZACIÓN (MAPA)</div>
                            ${b64Mapa ? `<img src="${b64Mapa}" class="img-secundaria" />` : '<div class="caja-sin-imagen" style="height:210px;">Sin foto de mapa</div>'}
                        </div>
                    </div>
                    <div class="columna-mitad">
                        <div class="foto-box">
                            <div class="foto-titulo">CROQUIS / ANEXO</div>
                            ${b64TerceraImagen ? `<img src="${b64TerceraImagen}" class="img-secundaria" />` : '<div class="caja-sin-imagen" style="height:210px;">Sin foto anexa</div>'}
                        </div>
                    </div>
                </div>

            </div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0' });
        await page.pdf({ path: rutaPDF, format: 'Letter', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' }});
        await browser.close();
        res.sendFile(rutaPDF);
    } catch (error) { res.status(500).send(`<h2 style="color: red;">❌ Error: ${error.message}</h2>`); }
});

const PORT = 3000;
app.listen(PORT, () => { console.log(`Servidor Backend corriendo en http://localhost:${PORT}`); });