const ejs = require('ejs');
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

const uploadFiles = multer({ storage: storage }).fields([
    { name: 'fotoFachada', maxCount: 1 },
    { name: 'fotoMapa', maxCount: 1 },
    { name: 'fotosAnexos', maxCount: 20 },
    { name: 'membrete', maxCount: 1 }
]);

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

app.post('/api/plantillas', uploadFiles, async (req, res) => {
    try {
        const config = JSON.parse(req.body.configuracion);
        let membrete_url = null;
        if (req.files && req.files['membrete']) {
            membrete_url = req.files['membrete'][0].filename;
        } else {
            const [oldPlantilla] = await db.query('SELECT membrete_url FROM plantillas_pdf WHERE es_predeterminada = 1 LIMIT 1');
            if (oldPlantilla.length > 0) membrete_url = oldPlantilla[0].membrete_url;
        }

        await db.query('UPDATE plantillas_pdf SET es_predeterminada = 0');
        
        const ajustes = JSON.stringify({ ejeX: config.ejeX, ejeY: config.ejeY, escala: config.escala });
        const query = `INSERT INTO plantillas_pdf (nombre, configuracion_campos, ajustes_membrete, membrete_url, es_predeterminada) VALUES (?, ?, ?, ?, 1)`;
        
        await db.query(query, [config.nombre, JSON.stringify(config.estructuraLienzo), ajustes, membrete_url]);
        res.json({ mensaje: "Plantilla guardada exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al guardar plantilla." });
    }
});
// ==============================================================================
// 🎯 GENERADOR DE PDF CON EL ORDEN OFICIAL INCORPORADO
// ==============================================================================
app.get('/api/avaluos/:id/pdf', async (req, res) => {
    try {
        const id = req.params.id;
        const [filas] = await db.query('SELECT * FROM avaluoenntity WHERE id = ?', [id]);
        if (filas.length === 0) return res.status(404).send("<h2>Avalúo no encontrado</h2>");
        
        const datos = filas[0];
        const rutaPDF = path.join(uploadsDir, `Avaluo_${id}.pdf`);

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

        const b64Fachada = getBase64Image(datos.foto_fachada);
        const b64Mapa = getBase64Image(datos.foto_mapa);
        const b64Membrete = getBase64Image('membrete_1.png') || getBase64Image('membrete_1.jpg') || getBase64Image('membrete.jpg');
        const b64Firma = getBase64Image('firma_diego.png') || getBase64Image('firma_diego.jpg');
        
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                const dd = String(d.getUTCDate()).padStart(2, '0');
                const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                const yyyy = d.getUTCFullYear();
                return `${dd}/${mm}/${yyyy}`;
            } catch(e) { return dateStr; }
        };
        
        const b64Croquis = '';

        // Los anexos viajan como DATOS a la plantilla (no como HTML armado aquí).
        // Si un archivo no existe, el anexo queda con b64 vacío y la plantilla
        // pinta un placeholder: una foto perdida nunca aborta el informe.
        let anexos = [];
        if (datos.fotos_anexos) {
            try {
                const anexosObj = JSON.parse(datos.fotos_anexos);
                if (Array.isArray(anexosObj)) {
                    anexos = anexosObj.map((anexo, i) => ({
                        id_foto: String(anexo.id || i + 1),
                        titulo: anexo.titulo || 'ANEXO FOTOGRÁFICO',
                        b64: getBase64Image(anexo.filename || anexo.url)
                    }));
                }
            } catch (e) {
                console.error("Error parseando anexos:", e);
            }
        }

        // Evita la unidad duplicada ("8.451,11 M² M²", "128 METROS CUADRADOS M²"):
        // solo agrega "M²" si el funcionario no escribió ya la unidad en el campo.
        const areaM2 = (valor) => {
            const s = String(valor == null ? '' : valor).trim();
            if (!s) return '';
            return /m²|m2|metro/i.test(s) ? s : `${s} M²`;
        };

        const escapeHTML = (str) => String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // Capítulo "ANEXOS": hoja nueva y las fotos una debajo de la otra, en el
        // mismo orden en que el funcionario las dejó en el formulario.
        // Cada <tr> es indivisible (break-inside: avoid en la hoja de estilos),
        // así el pie de foto y su imagen nunca se separan entre páginas.
        const renderAnexos = (lista) => {
            if (!lista || lista.length === 0) return '';
            let html = '<div style="page-break-before: always;"></div>';
            html += '<div class="corp-title"><span class="corp-bullet"></span>Anexos</div>';
            html += '<table class="grid-anexos"><tbody>';
            for (const foto of lista) {
                html += '<tr><td>';
                if (foto.titulo) html += `<div class="anexo-caption">${escapeHTML(foto.titulo)}</div>`;
                html += foto.b64
                    ? `<img src="${foto.b64}" class="anexo-img" />`
                    : '<div class="anexo-fallback">Imagen no disponible</div>';
                html += '</td></tr>';
            }
            html += '</tbody></table>';
            return html;
        };

        const [plantillas] = await db.query('SELECT * FROM plantillas_pdf WHERE es_predeterminada = 1 LIMIT 1');
        let htmlPlantilla = '';
        let configMembrete = { ejeX: 0, ejeY: 0, escala: 100 };
        let b64MembreteFinal = b64Membrete;

        if (plantillas.length > 0) {
            const p = plantillas[0];
            if (p.membrete_url) b64MembreteFinal = getBase64Image(p.membrete_url);
            try { configMembrete = JSON.parse(p.ajustes_membrete || '{"ejeX":0,"ejeY":0,"escala":100}'); } catch(e){}
            
            let bloques = [];
            try { bloques = JSON.parse(p.configuracion_campos || '[]'); } catch(e){}
            
            const procesarVariables = (texto) => {
                if (!texto) return '';
                return texto.replace(/{{(.*?)}}/g, (match, variable) => {
                    return datos[variable.trim()] !== undefined ? datos[variable.trim()] : '';
                });
            };

            
            try {
                htmlPlantilla = await ejs.renderFile(path.join(__dirname, 'views', 'pdf-template.ejs'), {
                    datos,
                    bloques,
                    configMembrete,
                    b64Fachada,
                    b64Mapa,
                    b64MembreteFinal,
                    b64Firma,
                    b64Croquis,
                    anexos,
                    renderAnexos,
                    areaM2,
                    formatDate,
                    procesarVariables
                });
            } catch (err) {
                console.error("Error rendering EJS:", err);
                return res.status(500).send("Error rendering PDF template");
            }
        } else {
            return res.status(404).send('<div style="padding: 50px; text-align: center; color: red;">No hay una plantilla configurada en el Gestor de Plantillas.</div>');
        }

        let browser;
        try {
            browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 180000 });
            const page = await browser.newPage();
            await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0', timeout: 60000 });

            await page.pdf({
                path: rutaPDF,
                format: 'Letter',
                printBackground: true,
                displayHeaderFooter: false,
                margin: { top: '0', bottom: '0', left: '0', right: '0' }
            });
        } finally {
            if (browser) await browser.close();
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.sendFile(rutaPDF);

    } catch (error) {
        console.error(error);
        res.status(500).send(`<div style="font-family: Arial; padding: 50px; text-align: center;"><h2 style="color: red;">❌ Error al generar el PDF</h2><p>${error.message}</p></div>`);
    }
});

const PORT = 3000;
app.listen(PORT, () => { console.log(`Servidor Backend corriendo en http://localhost:${PORT}`); });