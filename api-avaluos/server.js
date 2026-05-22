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
        
        let croquisFilename = datos.CroquisImg;
        if (croquisFilename && croquisFilename.includes('/')) croquisFilename = croquisFilename.split('/').pop();
        const b64Croquis = getBase64Image(croquisFilename);
        
        let anexosHTML = '';
        if (datos.fotos_anexos) {
            try {
                const anexosObj = JSON.parse(datos.fotos_anexos);
                anexosObj.forEach(anexo => {
                    const b64 = getBase64Image(anexo.filename);
                    if (b64) {
                        anexosHTML += `
                        <div style="width:48%; display:inline-block; margin-bottom:15px; border:1px solid #ccc; padding:5px; text-align:center; box-sizing: border-box; page-break-inside: avoid; background: white;">
                            <img src="${b64}" style="width:100%; height:220px; object-fit:cover;" />
                            <div style="background:#f4f6f9; font-weight:bold; padding:6px; font-size:10px; text-transform:uppercase; color:#1a2b4c;">${anexo.titulo || 'ANEXO FOTOGRÁFICO'}</div>
                        </div>`;
                    }
                });
            } catch(e){}
        }

        const [plantillas] = await db.query('SELECT * FROM plantillas_pdf WHERE es_predeterminada = 1 LIMIT 1');
        let htmlContenidoDinamico = '';
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

            htmlContenidoDinamico = bloques.map(bloque => {
                if (bloque.tipo === 'titulo') {
                    return `<div class="titulo-documento" style="text-align: ${bloque.alineacion || 'center'}; font-size: ${bloque.fontSize || '13px'}; color: ${bloque.color || '#1a2b4c'}; margin-top: 20px;">${procesarVariables(bloque.contenido)}</div>`;
                }
                if (bloque.tipo === 'texto_libre') {
                    return `<div style="text-align: ${bloque.alineacion || 'left'}; margin-bottom: 15px; font-size: 11px;">${procesarVariables(bloque.contenido)}</div>`;
                }
                if (bloque.tipo === 'tabla_info') {
                    let filasHTML = '';
                    let colArray = bloque.columnas || [];
                    for(let i = 0; i < colArray.length; i += 2) {
                        let c1 = colArray[i];
                        let c2 = colArray[i+1];
                        filasHTML += `<tr>`;
                        filasHTML += `<th>${procesarVariables(c1.label)}</th><td>${procesarVariables(c1.campo)}</td>`;
                        if(c2) {
                            filasHTML += `<th>${procesarVariables(c2.label)}</th><td>${procesarVariables(c2.campo)}</td>`;
                        } else {
                            filasHTML += `<th colspan="2"></th>`;
                        }
                        filasHTML += `</tr>`;
                    }
                    return `<table class="data-table">${filasHTML}</table>`;
                }
                if (bloque.tipo === 'imagenes_portada') {
                    return `
                    <table style="width: 100%; border:none; margin-bottom:15px; background: transparent;">
                        <tr>
                            <td style="border:none; width:50%; padding:10px; vertical-align: top;">
                                <div class="foto-box">FACHADA GENERAL DEL INMUEBLE</div>
                                ${b64Fachada ? `<img src="${b64Fachada}" style="width:100%; height:${bloque.alturaFachada || '240px'}; object-fit:contain; border:1px solid #ccc; background: white; padding:4px;"/>` : `<div style="height:${bloque.alturaFachada || '240px'}; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:gray; background: white;">Fotografía no cargada</div>`}
                            </td>
                            <td style="border:none; width:50%; padding:10px; vertical-align: top;">
                                <div class="foto-box">GEOLOCALIZACIÓN SATELITAL</div>
                                ${b64Mapa ? `<img src="${b64Mapa}" style="width:100%; height:${bloque.alturaFachada || '240px'}; object-fit:contain; border:1px solid #ccc; background: white; padding:4px;"/>` : `<div style="height:${bloque.alturaFachada || '240px'}; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:gray; background: white;">Captura no cargada</div>`}
                            </td>
                        </tr>
                    </table>`;
                }
                
                // === BLOQUES COMPLEJOS PREDISEÑADOS ===
                if (bloque.tipo === 'seccion_general_imagenes') {
                    return `
                    <table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 20px; word-wrap: break-word; overflow-wrap: break-word;">
                                <div class="corp-title"><span class="corp-bullet"></span>DIRECCIÓN</div>
                                <table class="zebra-table">
                                    <tr><td colspan="2" style="font-weight: bold; text-transform: uppercase; padding-bottom: 8px; word-break: break-word;">${datos.Direccion || ''}</td></tr>
                                    <tr><td class="zebra-label">Departamento</td><td class="zebra-value">${datos.Departamento || ''}</td></tr>
                                    <tr><td class="zebra-label">Municipio</td><td class="zebra-value">${datos.Municipio || ''}</td></tr>
                                    <tr><td class="zebra-label">Barrio</td><td class="zebra-value">${datos.Barrio || ''}</td></tr>
                                    <tr><td class="zebra-label">Código DANE</td><td class="zebra-value">${datos.CodigoDane || ''}</td></tr>
                                </table>
                                ${b64Fachada ? `<img src="${b64Fachada}" style="width:100%; height:250px; margin-top:5px; object-fit:cover;" />` : `<div style="width:100%; height:250px; margin-top:5px; border:1px solid #eee; background:#f9f9f9; display:flex; align-items:center; justify-content:center; color:#999; font-size:11px;">Sin Fachada</div>`}
                                <div style="font-size: 11px; font-weight: bold; margin-top: 8px; margin-bottom: 10px; background: #f4f6f9; padding: 6px; text-align: center; border-radius: 4px;"><span style="color: #2d56a0;">📍 Latitud:</span> <span style="color: #333333;">${datos.Latitud || '4.099315'}</span> &nbsp;&nbsp;&nbsp; <span style="color: #2d56a0;">🗺️ Longitud:</span> <span style="color: #333333;">${datos.Longitud || '-76.176867'}</span></div>
                                ${b64Mapa ? `<img src="${b64Mapa}" style="width:100%; height:250px; object-fit:cover;" />` : `<div style="width:100%; height:250px; border:1px solid #eee; background:#f9f9f9; display:flex; align-items:center; justify-content:center; color:#999; font-size:11px;">Sin Mapa</div>`}
                            </td>
                            <td style="width: 50%; vertical-align: top; padding-left: 10px; word-wrap: break-word; overflow-wrap: break-word;">
                                <div class="corp-title"><span class="corp-bullet"></span>GENERAL</div>
                                <table class="zebra-table">
                                    <tr><td class="zebra-label">Fecha de visita</td><td class="zebra-value">${formatDate(datos.FechaDeVisita)}</td></tr>
                                    <tr><td class="zebra-label">Fecha del avalúo</td><td class="zebra-value">${formatDate(datos.FechaDelAvalio)}</td></tr>
                                    <tr><td class="zebra-label">Tipo de avalúo</td><td class="zebra-value">${datos.TipoDeAvaluo || ''}</td></tr>
                                    <tr><td class="zebra-label">Finalidad del avalúo</td><td class="zebra-value">${datos.FinalidadDelAvaluo || ''}</td></tr>
                                    <tr><td class="zebra-label">Objeto del avalúo</td><td class="zebra-value">${datos.ObjetoDelAvaluo || ''}</td></tr>
                                    <tr><td class="zebra-label">Solicitante</td><td class="zebra-value" style="text-transform: uppercase;">${datos.Solicitante || ''}</td></tr>
                                    <tr><td class="zebra-label">Tipo de documento</td><td class="zebra-value">${datos.NumeroDocumento || ''}</td></tr>
                                    <tr><td class="zebra-label">Tipo de bien</td><td class="zebra-value">${datos.TipoDeBien || ''}</td></tr>
                                    <tr><td class="zebra-label">Sector</td><td class="zebra-value">${datos.Sector || ''}</td></tr>
                                    <tr><td class="zebra-label">Vivienda</td><td class="zebra-value">${datos.Vivienda === '1' ? 'SI' : (datos.Vivienda === '2' ? 'NO' : '')}</td></tr>
                                    <tr><td class="zebra-label">Estrato</td><td class="zebra-value">${datos.Estrato || ''}</td></tr>
                                    <tr><td class="zebra-label">Producto</td><td class="zebra-value">${datos.Producto || ''}</td></tr>
                                </table>
                                
                                <div class="corp-title" style="margin-top: 25px;"><span class="corp-bullet"></span>MATRÍCULA INMOBILIARIA</div>
                                <table class="zebra-table-2">
                                    <tr><th>TIPO</th><th>NÚMERO</th><th>TIPO</th><th>NÚMERO</th></tr>
                                    <tr><td>${datos.matriculainmTipo1 || ''}</td><td>${datos.matriculainmNumero1 || ''}</td><td>${datos.matriculainmTipo2 || ''}</td><td>${datos.matriculainmNumero2 || ''}</td></tr>
                                </table>

                                <!-- CAJA DE FIRMA -->
                                <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; position: relative;">
                                    <div style="color: #1d429a; font-size: 14px; font-weight: bold; margin-bottom: 4px;">Diego Antonio Candamil Rengifo</div>
                                    <table style="width: 100%; border:none; margin-bottom: 12px;">
                                        <tr>
                                            <td style="width: 60%; vertical-align: top; padding: 0;">
                                                <div style="font-size: 11px; color: #333; margin-bottom: 6px;">Valuador</div>
                                                <div style="font-size: 10px; color: #666; line-height: 1.3;">
                                                    R.A.A. AVAL-94355782<br/>
                                                    Inmuebles Urbanos-Rurales
                                                </div>
                                            </td>
                                            <td style="width: 40%; vertical-align: middle; text-align: right; padding: 0;">
                                                ${b64Firma ? `<img src="${b64Firma}" style="max-width:160px; max-height: 60px; object-fit: contain;" />` : `<div style="height:40px; color:#ccc; font-style:italic; font-size:10px; text-align:right; display:flex; align-items:center; justify-content:flex-end;">(Firma pendiente)</div>`}
                                            </td>
                                        </tr>
                                    </table>
                                    <div style="font-size: 9px; color: #777; text-align: justify; line-height: 1.45;">
                                        Diego A. Candamil Nit. 94.355.782, hace constar que el presente avalúo fue revisado
                                        y aprobado por su área técnica. Este documento ha sido firmado digitalmente, con
                                        un certificado de firma digital provisto por una entidad de certificación digital
                                        autorizada por la Superintendencia de industria y comercio, de conformidad con lo
                                        dispuesto por los artículos 28 de la ley 527 de 1999 y 15 del decreto 1747 de 2000.<br/>
                                        En caso que el presente documento se encuentre impreso, este tendrá la connotación
                                        de copia simple del original electrónico.
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>`;
                }
                
                if (bloque.tipo === 'seccion_sector') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                                <div class="corp-title"><span class="corp-bullet"></span>Sector</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0; width:45%;">Demanda/Interés</td><td>${datos.DemandaInteres || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Uso predominante</td><td>${datos.UsoPredominante || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Legalidad</td><td>${datos.Legalidad || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Transporte</td><td>${datos.Transporte || ''}</td></tr>
                                </table>
                                
                                <div class="corp-subtitle" style="margin-top: 10px;">Impacto ambiental negativo</div>
                                <div style="margin-bottom: 8px; font-size: 11px; color:#2d56a0; display: flex; align-items: center; gap: 4px;">
                                    <span style="display:inline-block;">${datos.Aire ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Aire</span> &nbsp;
                                    <span style="display:inline-block;">${datos.AguasServidas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Aguas Servidas</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Basura ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Basura</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Inseguridad ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Inseguridad</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Ruido ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Ruido</span>
                                </div>
                                <div class="corp-subtitle">Observaciones</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">${datos.SectorObservaciones || 'No se evidencia ningún impacto ambiental negativo, excepto por la polución vehicular.'}</p>
                                
                                <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Equipamiento</div>
                                <table class="comparables-table">
                                    <tr>
                                        <th>EQUIPAMIENTO</th>
                                        <th>NIVEL DE EQUIPAMIENTO</th>
                                        <th>DISTANCIA APROX EN METROS</th>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Áreas Verdes</td>
                                        <td>${datos.AreasVerdesNE || ''}</td>
                                        <td>${datos.AreasVerdesDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Asistencial</td>
                                        <td>${datos.AsistencialNE || ''}</td>
                                        <td>${datos.AsistencialDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Comercial</td>
                                        <td>${datos.ComercialNE || ''}</td>
                                        <td>${datos.ComercialDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Escolar</td>
                                        <td>${datos.EscolarNE || ''}</td>
                                        <td>${datos.EscolarDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Estacionamientos</td>
                                        <td>${datos.EstacionamientosNE || ''}</td>
                                        <td>${datos.EstacionamientosDAM || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#2d56a0;">Áreas recreativas</td>
                                        <td>${datos.AreasRecreativasNE || ''}</td>
                                        <td>${datos.AreasRecreativasDAM || ''}</td>
                                    </tr>
                                </table>

                                <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Infraestructura urbana del sector</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Vías de acceso</td><td>${datos.ViasDeAcceso || ''}</td><td style="color:#2d56a0;">Pavimentadas</td><td>${datos.Pavimentadas || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Andenes</td><td>${datos.Andenes || ''}</td><td style="color:#2d56a0;">Sardineles</td><td>${datos.Sardineles || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Acueducto</td><td>${datos.Acueducto || ''}</td><td style="color:#2d56a0;">Alcantarillado</td><td>${datos.Alcantarillado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Energía eléctrica</td><td>${datos.EnergiaElectrica || ''}</td><td style="color:#2d56a0;">Telefonía</td><td>${datos.Telefonia || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Gas natural</td><td colspan="3">${datos.GasNatural || ''}</td></tr>
                                </table>

                                <div class="corp-subtitle">Amoblamiento urbano</div>
                                <div style="margin-bottom: 8px; font-size: 11px; color:#2d56a0; line-height: 1.5;">
                                    <span style="display:inline-block;">${datos.Alamedas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Alamedas</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Alumbrado ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Alumbrado</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Arborizacion ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Arborización</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Ciclorutas ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Ciclorutas</span><br/>
                                    <span style="display:inline-block;">${datos.Paradero ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Paradero</span> &nbsp;
                                    <span style="display:inline-block;">${datos.Parques ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Parques</span> &nbsp;
                                    <span style="display:inline-block;">${datos.ZonasVerdes ? '&#9679;' : '&#9675;'}</span> <span style="color:#333; font-size: 11px;">Zonas verdes</span>
                                </div>

                                <div class="corp-subtitle">Perspectivas de valorización</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">${datos.PerspectivasDeValorizacion || 'De acuerdo con las condiciones del sector y a la dinámica del mercado, se consideran perspectivas de valoración altas.'}</p>
                            </td>
                            <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                                <div class="corp-title"><span class="corp-bullet"></span>Edificación estructura</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Estado de la construcción</td><td>${datos.EstadoDeLaConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Avance (en construcción)</td><td>${datos.AvanceEnConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estado de conservación</td><td>${datos.EstadoDeConservacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">No. de pisos del inmueble</td><td>${datos.NoDePisosDelInmueble || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Número de sótanos</td><td>${datos.NumeroDeSotanos || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Vida útil</td><td>${datos.VidaUtil || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Vida remanente</td><td>${datos.VidaRemanente || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Año de construcción</td><td>${datos.YearDeConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Edad</td><td>${datos.Edad || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estructura</td><td>${datos.Estructura || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Material de Estructura</td><td>${datos.MaterialDeEstructura || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estado</td><td>${datos.EstructuraEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Remodelado</td><td>${datos.Remodelado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Uso Actual Predominante</td><td>${datos.UsoActualPredominante || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Ajuste sismorresistente</td><td>${datos.AjusteSismorresistente || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Cubierta</td><td>${datos.Cubierta || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Fachada</td><td>${datos.Fachada || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Tipo de fachada en metros</td><td>${datos.TipoDeFachadaEnMetros || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estructura reforzada</td><td>${datos.EstructuraReforzada || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Daños previos</td><td>${datos.DanosPrevios || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Material de construcción</td><td>${datos.MaterialDeConstruccion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Iluminación</td><td>${datos.Iluminacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Ventilación</td><td>${datos.Ventilacion || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Irregularidad planta</td><td>${datos.IrregularidadPlanta || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Irregularidad altura</td><td>${datos.IrregularidadAltura || ''}</td></tr>
                                </table>
                                <div class="corp-subtitle">Comentarios de la estructura</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">${datos.ComentariosDeLaEstructura || 'No se evidencia ninguna clase de construcción sobre el lote objeto de avalúo.'}</p>
                            </td>
                        </tr>
                    </table>`;
                }
                
                if (bloque.tipo === 'seccion_textos_legales') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <div style="font-size: 11px; text-align: justify; margin-bottom: 15px; line-height: 1.45;">
                        <div class="corp-title"><span class="corp-bullet"></span>Definición de Términos y Conceptos</div>
                        <p><b>AVALÚO:</b> Es el estudio o proceso mediante el cual se estima y documenta el valor de un bien raíz o bien inmueble, de acuerdo a la apreciación personal expresada por un profesional...</p>
                        <p><b>VALOR COMERCIAL:</b> Es la cantidad estimada de dinero circulante a cambio de la cual el vendedor y el comprador del bien que se valúa...</p>
                        
                        <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Condicionantes y Salvedades al Avalúo</div>
                        <p>Conforme al artículo 18 de la Resolución 620, del 23/09/2008, del IGAC; por la cual se establece la metodología...</p>
                        <p>La información y antecedentes de propiedad asentados en el presente Avalúo es la contenida en la documentación oficial...</p>
                        
                        <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Metodología Valuatoria</div>
                        <p>Método Físico, Directo o enfoque de COSTOS, es el proceso técnico necesario para estimar el costo de reproducción o de reemplazo...</p>
                        <p>Método Comparativo o de MERCADO, es el desarrollo analítico a través del cual se obtiene un valor que resulta de comparar el bien que se valúa...</p>
                    </div>
                        <p><b>AVALÚO:</b> Es el estudio o proceso mediante el cual se estima y documenta el valor de un bien raíz o bien inmueble, de acuerdo a la apreciación personal expresada por un profesional...</p>
                        <p><b>VALOR COMERCIAL:</b> Es la cantidad estimada de dinero circulante a cambio de la cual el vendedor y el comprador del bien que se valúa...</p>
                        <div style="color: #1d429a; font-weight: bold; text-transform: uppercase; margin-top: 10px;">Condicionantes y Salvedades al Avalúo</div>
                        <p>Conforme al artículo 18 de la Resolución 620, del 23/09/2008, del IGAC; por la cual se establece la metodología...</p>
                        <p>La información y antecedentes de propiedad asentados en el presente Avalúo es la contenida en la documentación oficial...</p>
                        <div style="color: #1d429a; font-weight: bold; text-transform: uppercase; margin-top: 10px;">Metodología Valuatoria</div>
                        <p>Método Físico, Directo o enfoque de COSTOS, es el proceso técnico necesario para estimar el costo de reproducción o de reemplazo...</p>
                        <p>Método Comparativo o de MERCADO, es el desarrollo analítico a través del cual se obtiene un valor que resulta de comparar el bien que se valúa...</p>
                    </div>`;
                }

                if (bloque.tipo === 'seccion_usos_propuestos') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <div style="margin-bottom: 15px;">
                        <div class="corp-title"><span class="corp-bullet"></span>Usos Propuestos</div>
                        <table class="comparables-table">
                            <tr>
                                <th>Globo de Terreno</th>
                                <th>Uso Principal</th>
                                <th>Uso Complementario</th>
                                <th>Uso Compatible</th>
                                <th>Normas Particulares</th>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-weight: bold; color: #2d56a0;">M 01 A</td>
                                <td>${datos.UsoPrincipal || 'Dotacional Servicios Básicos'}</td>
                                <td>Comercial C3, Actividades relacionadas...</td>
                                <td>Estaciones de Servicio...</td>
                                <td>Uso Principal de cobertura regional</td>
                            </tr>
                        </table>
                    </div>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
                            <tr style="background: #f4f6f9;">
                                <th style="border: 1px solid black; padding: 4px;">Globo de Terreno</th>
                                <th style="border: 1px solid black; padding: 4px;">Uso Principal</th>
                                <th style="border: 1px solid black; padding: 4px;">Uso Complementario</th>
                                <th style="border: 1px solid black; padding: 4px;">Uso Compatible</th>
                                <th style="border: 1px solid black; padding: 4px;">Normas Particulares</th>
                            </tr>
                            <tr>
                                <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">M 01 A</td>
                                <td style="border: 1px solid black; padding: 4px;">${datos.UsoPrincipal || 'Dotacional Servicios Básicos'}</td>
                                <td style="border: 1px solid black; padding: 4px;">Comercial C3, Actividades relacionadas...</td>
                                <td style="border: 1px solid black; padding: 4px;">Estaciones de Servicio...</td>
                                <td style="border: 1px solid black; padding: 4px;">Uso Principal de cobertura regional</td>
                            </tr>
                        </table>
                    </div>`;
                }

                if (bloque.tipo === 'seccion_areas_normatividad') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 20px; word-wrap: break-word; overflow-wrap: break-word;">
                                <div class="corp-title"><span class="corp-bullet"></span>Aspectos Jurídicos</div>
                                <table class="zebra-table">
                                    <tr><td class="zebra-label">Propietario</td><td class="zebra-value">${datos.Propietario || ''}</td></tr>
                                    <tr><td class="zebra-label">Número de escritura</td><td class="zebra-value">${datos.NumeroDeEscritura || ''}</td></tr>
                                    <tr><td class="zebra-label">Fecha</td><td class="zebra-value">${formatDate(datos.AspJFecha)}</td></tr>
                                    <tr><td class="zebra-label">Número de notaría</td><td class="zebra-value">${datos.NumeroDeNotaria || ''}</td></tr>
                                    <tr><td class="zebra-label">Municipio</td><td class="zebra-value">${datos.AspMunicipio || ''}</td></tr>
                                    <tr><td class="zebra-label">Departamento</td><td class="zebra-value">${datos.AspDepartamento || ''}</td></tr>
                                    <tr><td class="zebra-label">CHIP</td><td class="zebra-value">${datos.Chip || ''}</td></tr>
                                    <tr><td class="zebra-label">Cédula catastral</td><td class="zebra-value">${datos.CedulaCatastral || ''}</td></tr>
                                    <tr><td class="zebra-label">Tipo de propiedad</td><td class="zebra-value">${datos.TipoDePropiedad || ''}</td></tr>
                                    <tr><td class="zebra-label">Coeficiente de copropiedad</td><td class="zebra-value">${datos.CoeficienteDeCopropiedad || ''}</td></tr>
                                    <tr><td class="zebra-label">Licencia de construcción</td><td class="zebra-value">${datos.LicenciaDeConstruccion || ''}</td></tr>
                                </table>
                                
                                <div class="corp-title" style="margin-top: 25px;"><span class="corp-bullet"></span>Información de Áreas y Normatividad</div>
                                
                                <div class="corp-subtitle" style="margin-top: 0; margin-bottom: 8px;">Información del área</div>
                                <div class="corp-badge">ÁREA LOTE</div>
                                <div style="display:inline-block; margin-left: 15px; color:#333; font-weight:bold; font-size:11px;">${datos.AreaLote || '0'} M²</div>
                                <table class="zebra-table">
                                    <tr><td class="zebra-label">Forma</td><td class="zebra-value">${datos.Forma || ''}</td></tr>
                                    <tr><td class="zebra-label">Topografía</td><td class="zebra-value">${datos.Topografia || ''}</td></tr>
                                    <tr><td class="zebra-label">Frente</td><td class="zebra-value">${datos.Frente || ''}</td></tr>
                                    <tr><td class="zebra-label">Fondo</td><td class="zebra-value">${datos.Fondo || ''}</td></tr>
                                    <tr><td class="zebra-label">Relación de frente/fondo</td><td class="zebra-value">${datos.RelacionFrenteFondo || ''}</td></tr>
                                </table>
                                
                                <div class="corp-subtitle" style="margin-bottom: 8px;">Normas de uso de suelo</div>
                                <table class="zebra-table">
                                    <tr><td class="zebra-label">Decreto/Acuerdo</td><td class="zebra-value">${datos.DecretoAcuerdo || ''}</td></tr>
                                    <tr><td class="zebra-label">Uso principal</td><td class="zebra-value">${datos.UsoPrincipal || ''}</td></tr>
                                    <tr><td class="zebra-label">Aislamiento lateral posterior</td><td class="zebra-value">${datos.AislamientoPosterior || datos.AislamientoLateral || ''}</td></tr>
                                    <tr><td class="zebra-label">Índice de construcción</td><td class="zebra-value">${datos.IndiceDeConstruccion || '0'}</td></tr>
                                </table>
                                
                                <div class="corp-subtitle" style="margin-bottom: 8px;">Áreas construidas</div>
                                <div class="corp-badge">ÁREA VALORADA</div>
                                <div style="display:inline-block; margin-left: 15px; color:#333; font-weight:bold; font-size:11px;">${datos.AreaValorada || '0'} M²</div>
                                <table class="zebra-table">
                                    <tr><td class="zebra-label">Área medida en la inspección</td><td class="zebra-value">${datos.AreaMedidaEnLaInspeccion || '0'} M²</td></tr>
                                    <tr><td class="zebra-label">Área registrada en título</td><td class="zebra-value">${datos.AreaRegistradaEnTitulo || '0'} M²</td></tr>
                                    <tr><td class="zebra-label">Área susceptible de legalización</td><td class="zebra-value">${datos.AreaSusceptibleDeLegalizacion || '0'} M²</td></tr>
                                    <tr><td class="zebra-label">Área catastral</td><td class="zebra-value">${datos.AreaCatastral || '0'} M²</td></tr>
                                    <tr><td class="zebra-label">Área licencia de construcción</td><td class="zebra-value">${datos.AreaLicenciaDeConstruccion || ''}</td></tr>
                                </table>
                                
                                <div class="corp-subtitle">Observaciones</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #555;">${datos.AreaValoradaObservaciones || 'Nota: se toma la decisión de liquidar lo máximo permitido por la excelente y estratégica ubicación del predio objeto del encargo valuatorio.'}</p>
                            </td>
                            
                            <td style="width: 50%; vertical-align: top; padding-left: 10px; word-wrap: break-word; overflow-wrap: break-word;">
                                <div class="corp-title"><span class="corp-bullet"></span>Descripción General</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333; margin-bottom: 30px;">${datos.DescripcionGeneral || 'El predio valorado en el siguiente informe es un lote de terreno ubicado en la entrada sur del municipio'}</p>
                                
                                <div class="corp-title"><span class="corp-bullet"></span>Oferta y Demanda</div>
                                <table style="width: 100%; border:none; margin-bottom: 10px; table-layout: fixed;">
                                    <tr>
                                        <td style="width: 60%; vertical-align: middle; padding: 0;">
                                            <div class="corp-badge" style="margin-bottom: 0;">TIEMPO ESPERADO DE<br/>COMERCIALIZACIÓN</div>
                                        </td>
                                        <td style="width: 40%; vertical-align: middle; text-align: right; padding: 0;">
                                            <div style="color:#1d429a; font-weight:bold; font-size:12px;">${datos.TiempoEsperadoDeComercializacion || '0'}</div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div class="corp-subtitle">Comportamiento oferta y demanda</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333;">${datos.ComportamientoOfertayDemanda || 'Del análisis del segmento del mercado relativo a los inmuebles comparables con el que se valora, se deduce que la oferta en la zona es baja por encontrarse la mayoría de los lotes y predios adjudicados, contraria a la demanda alta.'}</p>
                                
                                <div class="corp-subtitle">Descripción sector, actividad inmobiliaria, vías importantes</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333;">${datos.DescripcionSectorInmobiliario || ''}</p>
                                
                                <div class="corp-subtitle">Actualidad edificadora</div>
                                <p style="font-size: 11px; text-align: justify; line-height: 1.45; color: #333;">${datos.ActualidadEdificadora || 'En el sector donde se localiza el inmueble objeto del Avalúo, se evidencia una actividad edificadora creciente.'}</p>
                            </td>
                        </tr>
                    </table>`;
                }

                if (bloque.tipo === 'seccion_croquis') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <div class="corp-title"><span class="corp-bullet"></span>Croquis</div>
                    ${b64Croquis ? `<img src="${b64Croquis}" style="width:100%; height:800px; object-fit:contain;" />` : '<div style="height:800px; text-align:center; padding-top:400px; border:1px solid #ccc;">Croquis no disponible</div>'}
                    `;
                }

                if (bloque.tipo === 'seccion_predio_dotacion') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <table style="width: 100%; border:none; margin-bottom:15px; table-layout: fixed;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                                <div class="corp-title"><span class="corp-bullet"></span>Predio</div>
                                <div class="corp-subtitle" style="margin-top: 0;">Servicios</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Acueducto</td><td>${datos.P_Acueducto || 'No tiene'}</td><td style="color:#2d56a0;">Alcantarillado</td><td>${datos.P_Alcantarillado || 'No tiene'}</td></tr>
                                    <tr><td style="color:#2d56a0;">Energía eléctrica</td><td>${datos.P_Energia || 'No tiene'}</td><td style="color:#2d56a0;">Gas natural</td><td>${datos.P_Gas || 'No tiene'}</td></tr>
                                    <tr><td style="color:#2d56a0;">Telefonía</td><td colspan="3">${datos.P_Telefonia || 'No tiene'}</td></tr>
                                </table>
                                <div class="corp-subtitle">Dependencias</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Alcobas</td><td>${datos.PredioAlcobas || ''}</td><td style="color:#2d56a0;">Alcoba de servicio</td><td>${datos.PredioAlcobaServicio || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Balcón</td><td>${datos.PredioBalcon || ''}</td><td style="color:#2d56a0;">Baño de servicio</td><td>${datos.PredioBanoServicio || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Baño privado</td><td>${datos.PredioBanoPrivado || ''}</td><td style="color:#2d56a0;">Baño social</td><td>${datos.PredioBanoSocial || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Cocina</td><td>${datos.PredioCocina || ''}</td><td style="color:#2d56a0;">Comedor</td><td>${datos.PredioComedor || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Estar habitación</td><td>${datos.PredioEstarHabitacion || ''}</td><td style="color:#2d56a0;">Estudio</td><td>${datos.PredioEstudio || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Jardín</td><td>${datos.PredioJardin || ''}</td><td style="color:#2d56a0;">Patio interior</td><td>${datos.PredioPatioInterior || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Sala</td><td>${datos.PredioSala || ''}</td><td style="color:#2d56a0;">Terraza</td><td>${datos.PredioTerraza || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Zona de ropas</td><td>${datos.PredioZonaDeRopas || ''}</td><td style="color:#2d56a0;">Closet</td><td>${datos.PredioCloset || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Predio subdividido</td><td colspan="3">${datos.PredioPredioSubdividido || ''}</td></tr>
                                </table>
                                <div class="corp-subtitle">Garajes</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Total Cupos de Parqueo</td><td>${datos.PredioTotalCuposDeParqueo || ''}</td><td style="color:#2d56a0;">Uso exclusivo</td><td>${datos.PredioUsoExclusivo || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Bahía comunal</td><td>${datos.PredioBahiaComunal || ''}</td><td style="color:#2d56a0;">Cubierto</td><td>${datos.PredioCubierto || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Descubierto</td><td>${datos.PredioDescubierto || ''}</td><td style="color:#2d56a0;">Doble</td><td>${datos.PredioDoble || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Privado</td><td>${datos.PredioPrivado || ''}</td><td style="color:#2d56a0;">Sencillo</td><td>${datos.PredioSencillo || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Servidumbre</td><td colspan="3">${datos.PredioServidumbre || ''}</td></tr>
                                </table>
                                <div class="corp-subtitle">Otros</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0;">Bodega</td><td>${datos.PredioBodega || ''}</td><td style="color:#2d56a0;">Depósito</td><td>${datos.PredioDeposito || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Tipo de depósito</td><td>${datos.PredioTipoDeposito || ''}</td><td style="color:#2d56a0;">Oficina</td><td>${datos.PredioOficina || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Local</td><td colspan="3">${datos.PredioLocal || ''}</td></tr>
                                </table>
                                
                                <div class="corp-title" style="margin-top: 15px;"><span class="corp-bullet"></span>Edificación Acabados</div>
                                <table class="comparables-table">
                                    <tr>
                                        <th>Acabados por recinto</th>
                                        <th>Acabados Pisos</th>
                                        <th>Acabados Muros</th>
                                    </tr>
                                    ${(Array.isArray(datos.acabadosEdificacion) && datos.acabadosEdificacion.length > 0) ? datos.acabadosEdificacion.map(a => `
                                    <tr>
                                        <td>${a.recinto || ''}</td>
                                        <td>${a.pisos || ''}</td>
                                        <td>${a.muros || ''}</td>
                                    </tr>
                                    `).join('') : `<tr><td colspan="3" style="text-align:center;">Sin detalles de acabados</td></tr>`}
                                </table>
                            </td>
                            <td style="width: 50%; vertical-align: top;">
                                <div class="corp-subtitle" style="margin-top: 0;">Estado de la edificación</div>
                                <table class="zebra-table-2" style="margin-bottom: 8px;">
                                    <tr><td style="color:#2d56a0; font-weight:bold;">TIPO</td><td style="color:#2d56a0; font-weight:bold;">CALIDAD</td><td style="color:#2d56a0; font-weight:bold;">ESTADO</td></tr>
                                    <tr><td style="color:#2d56a0;">Carpintería Metálica</td><td>${datos.CarpinteriaMetalicaCalidad || ''}</td><td>${datos.CarpinteriaMetalicaEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Carpintería en Madera</td><td>${datos.CarpinteriaEnMaderaCalidad || ''}</td><td>${datos.CarpinteriaEnMaderaEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Pisos</td><td>${datos.PisosCalidad || ''}</td><td>${datos.PisosEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Muros</td><td>${datos.MurosCalidad || ''}</td><td>${datos.MurosEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Techos</td><td>${datos.TechosCalidad || ''}</td><td>${datos.TechosEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Cocina</td><td>${datos.CocinaCalidad || ''}</td><td>${datos.CocinaEstado || ''}</td></tr>
                                    <tr><td style="color:#2d56a0;">Baños</td><td>${datos.BanosCalidad || ''}</td><td>${datos.BanosEstado || ''}</td></tr>
                                </table>
                                <div class="corp-title" style="margin-top: 15px;"><span class="corp-bullet"></span>Dotación Comunal</div>
                                <div style="font-size: 11px;"><span style="color:#2d56a0;">Valor Admón.</span> <span style="color:#333;">${datos.DCValorAdmon || ''}</span> &nbsp;&nbsp;&nbsp; <span style="color:#2d56a0;">Mensualidad</span> <span style="color:#333;">${datos.DCMensualidad || ''}</span></div>
                                <div style="margin-top: 3px; font-size: 11px;"><span style="color:#2d56a0;">Valor admón m²</span> <span style="color:#333;">${datos.DCValorAdmonM2 || ''}</span> &nbsp;&nbsp;&nbsp; <span style="color:#2d56a0;">Vigilancia Priv.</span> <span style="color:#333;">${datos.DCVigilanciaPrivada || ''}</span></div>
                                <div style="margin-top: 3px; font-size: 11px;"><span style="color:#2d56a0;">Ascensores</span> <span style="color:#333;">${datos.DCAscensores || ''}</span></div>
                                <div style="line-height:1.8; margin-top:5px;">
                                    ${['A.A. Central', 'BBQ', 'Bicicletero', 'Bomba eyect', 'Calefacción', 'Cancha multiuso', 'Cancha Squash', 'CCTV', 'Citofonía', 'Club house', 'Equipo de presión', 'Garajes residentes', 'Garajes visitantes', 'Gimnasio', 'Golfito', 'Guardería', 'Juegos niños', 'Piscina', 'Planta eléctrica', 'Portería', 'Salón comunal', 'Salón de juegos', 'Sauna', 'Shut basuras', 'Tanque de agua', 'Teatrino', 'Terraza comunal', 'Turco', 'Vigilancia 24 horas', 'Zonas verdes', 'Otros'].map(lbl => {
                                        let field = 'DC' + lbl.replace(/[^a-zA-Z]/g, '');
                                        if (lbl === 'Bomba eyect') field = 'DCBombaEyect';
                                        if (lbl === 'Equipo de presión') field = 'DCEquipoPresion';
                                        if (lbl === 'Juegos niños') field = 'DCJuegosNinos';
                                        if (lbl === 'Shut basuras') field = 'DCShutBasuras';
                                        if (lbl === 'Zonas verdes') field = 'DCZonaVerde';
                                        if (lbl === 'Vigilancia 24 horas') field = 'DCVigilancia24Horas';
                                        if (lbl === 'A.A. Central') field = 'DCAACentral';
                                        let check = datos[field] ? 'background-color:#2d56a0;' : 'background-color:transparent;';
                                        return `<span style="display:inline-block; white-space:nowrap; margin-right:8px;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; border:1px solid #2d56a0; margin-right:3px; vertical-align:middle; ${check}"></span><span style="vertical-align:middle;" class="corp-subtitle">${lbl}</span></span>`;
                                    }).join('')}
                                </div>
                            </td>
                        </tr>
                    </table>`;
                }

                if (bloque.tipo === 'seccion_comparables_valoracion') {
                    return `
                    <div style="page-break-before: always;"></div>
                    <div class="corp-title"><span class="corp-bullet"></span>Comparables de inmuebles en venta semejantes en uso al sujeto</div>
                    <div class="corp-subtitle" style="margin-top: 0; margin-bottom: 5px;">Investigación de comparables</div>
                    <table class="comparables-table">
                        <tr><th>#</th><th>DIRECCIÓN</th><th>EDAD</th><th>ÁREA LOTE</th><th>ÁREA CONSTR.</th><th>VALOR CONSTR.</th><th>VALOR COMERCIAL</th><th>FUENTE</th></tr>
                        ${(Array.isArray(datos.ofertasMercado) && datos.ofertasMercado.length > 0) ? datos.ofertasMercado.map((of, i) => `
                        <tr>
                            <td style="text-align:center;">${i+1}</td>
                            <td>${of.direccion || ''}</td>
                            <td style="text-align:center;">${of.edad || ''}</td>
                            <td style="text-align:right;">${of.areaLote || ''}</td>
                            <td style="text-align:right;">${of.areaConstr || ''}</td>
                            <td style="text-align:right;">${of.valorConstr || ''}</td>
                            <td style="text-align:right;">${of.valorComercial || ''}</td>
                            <td>${of.fuente || ''}</td>
                        </tr>
                        `).join('') : `<tr><td colspan="8" style="text-align:center;">No hay comparables registrados</td></tr>`}
                        <tr style="background:#1d429a; color:white;"><td colspan="2" style="text-align:center; font-weight:bold; padding:5px;">SUJETO</td><td style="text-align:center;">${datos.Edad || '0'}</td><td style="text-align:right;">${datos.AreaLote || '0,00'}</td><td style="text-align:right;">${datos.AreaValorada || '0,00'}</td><td></td><td></td><td></td></tr>
                    </table>

                    <div class="corp-title" style="margin-top: 20px;"><span class="corp-bullet"></span>Diagnostico valores de referencia</div>
                    <p style="text-align: justify; line-height: 1.45; color: #333; margin-top:2px;">${datos.DVRDiagnostico || 'Se realizó la búsqueda de inmuebles con características similares al inmueble objeto del avalúo...'}</p>

                    <div class="corp-subtitle" style="margin-top:20px; margin-bottom: 5px;">Cuadro de valoración terreno</div>
                    <table class="comparables-table" style="text-align: center;">
                        <tr><th>TERRENO</th><th>DESCRIPCIÓN</th><th>ÁREA</th><th>UNIDAD DE MEDIDA</th><th>VALOR M²</th><th>PRECIO TOTAL</th><th>PORCENTAJE</th></tr>
                        <tr>
                            <td>LOTE</td>
                            <td>${datos.CVTDescripcion || ''}</td>
                            <td>${datos.CVTArea || '0'}</td>
                            <td>${datos.CVTUniadDeMedida || ''}</td>
                            <td>${datos.CVTValorUnitario || '0'}</td>
                            <td>${datos.CVTValor || '0'}</td>
                            <td>${datos.CVTPorcentaje || ''}</td>
                        </tr>
                        <tr style="background:#1d429a; color:white;"><td colspan="2" style="font-weight:bold; padding:5px; text-align:right;">SUBTOTAL TERRENO</td><td style="background:white; color:black; border:1px solid #ccc;">${datos.CVTArea || '0'}</td><td colspan="2" style="background:white; color:black; border:1px solid #ccc;"></td><td style="background:white; color:black; border:1px solid #ccc;">${datos.CVTValor || '0'}</td><td style="background:white; color:black; border:1px solid #ccc;">${datos.CVTPorcentaje || ''}</td></tr>
                    </table>

                    <div class="corp-subtitle" style="margin-top: 20px; margin-bottom: 5px;">Cuadro de valoración edificaciones</div>
                    <table class="comparables-table" style="text-align: center;">
                        <tr><th>EDIFICACIONES</th><th>DESCRIPCIÓN</th><th>ÁREA</th><th>UNIDAD DE MEDIDA</th><th>VALOR M²</th><th>PRECIO TOTAL</th><th>PORCENTAJE</th></tr>
                        <tr>
                            <td>CONSTRUCCIÓN</td>
                            <td>${datos.CVEDescripcion || ''}</td>
                            <td>${datos.CVEArea || '0'}</td>
                            <td>${datos.CVEUniadDeMedida || ''}</td>
                            <td>${datos.CVEValorUnitario || '0'}</td>
                            <td>${(Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0)).toLocaleString('es-CO')}</td>
                            <td>${datos.CVEPorcentaje || ''}</td>
                        </tr>
                        <tr style="background:#1d429a; color:white;"><td colspan="2" style="font-weight:bold; padding:5px; text-align:right;">SUBTOTAL EDIFICACIONES</td><td style="background:white; color:black; border:1px solid #ccc;">${datos.CVEArea || '0'}</td><td colspan="2" style="background:white; color:black; border:1px solid #ccc;"></td><td style="background:white; color:black; border:1px solid #ccc;">${(Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0)).toLocaleString('es-CO')}</td><td style="background:white; color:black; border:1px solid #ccc;">${datos.CVEPorcentaje || ''}</td></tr>
                    </table>
                    
                    <!-- CAJA DE FIRMA AL FINAL DEL DOCUMENTO -->
                    <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; position: relative;">
                        <div style="color: #1d429a; font-size: 14px; font-weight: bold; margin-bottom: 4px;">Diego Antonio Candamil Rengifo</div>
                        <table style="width: 100%; border:none; margin-bottom: 12px;">
                            <tr>
                                <td style="width: 60%; vertical-align: top; padding: 0;">
                                    <div style="font-size: 11px; color: #333; margin-bottom: 6px;">Valuador</div>
                                    <div style="font-size: 10px; color: #666; line-height: 1.3;">
                                        R.A.A. AVAL-94355782<br/>
                                        Inmuebles Urbanos-Rurales
                                    </div>
                                </td>
                                <td style="width: 40%; vertical-align: middle; text-align: right; padding: 0;">
                                    ${b64Firma ? `<img src="${b64Firma}" style="max-width:160px; max-height: 60px; object-fit: contain;" />` : `<div style="height:40px; color:#ccc; font-style:italic; font-size:10px; text-align:right; display:flex; align-items:center; justify-content:flex-end;">(Firma pendiente)</div>`}
                                </td>
                            </tr>
                        </table>
                        <div style="font-size: 9px; color: #777; text-align: justify; line-height: 1.45;">
                            Diego A. Candamil Nit. 94.355.782, hace constar que el presente avalúo fue revisado
                            y aprobado por su área técnica. Este documento ha sido firmado digitalmente, con
                            un certificado de firma digital provisto por una entidad de certificación digital
                            autorizada por la Superintendencia de industria y comercio, de conformidad con lo
                            dispuesto por los artículos 28 de la ley 527 de 1999 y 15 del decreto 1747 de 2000.<br/>
                            En caso que el presente documento se encuentre impreso, este tendrá la connotación
                            de copia simple del original electrónico.
                        </div>
                    </div>
                    `;
                }

                return '';
            }).join('\n');
        }

        // Si htmlContenidoDinamico está vacío (no hay plantilla válida), usamos un mensaje por defecto
        if (!htmlContenidoDinamico || htmlContenidoDinamico.trim() === '') {
            htmlContenidoDinamico = `<div style="text-align:center; padding: 50px; font-size: 16px; color: red;">No hay una plantilla configurada en el Gestor de Plantillas, o los bloques no son válidos.</div>`;
        }

        const htmlPlantilla = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 0; size: letter; }
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; line-height: 1.4; margin: 0; padding: 0; }
                
                /* ESTILOS CORPORATIVOS GLOBALES */
                .corp-title { color: #1d429a; font-weight: bold; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; }
                .corp-bullet { display: inline-block; width: 6px; height: 6px; background-color: #1d429a; margin-right: 8px; vertical-align: middle; }
                .zebra-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; table-layout: fixed; word-wrap: break-word; }
                .zebra-table tr:nth-child(odd) { background-color: #f4f6f9; }
                .zebra-table tr:nth-child(even) { background-color: #ffffff; }
                .zebra-table td { padding: 5px 8px; border: none; word-wrap: break-word; overflow-wrap: break-word; }
                .zebra-label { color: #2d56a0; font-weight: normal; width: 45%; }
                .zebra-value { color: #333333; width: 55%; }
                .zebra-table-2 { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; table-layout: fixed; word-wrap: break-word; }
                .zebra-table-2 th { background-color: #f4f6f9; color: #2d56a0; font-weight: bold; padding: 5px 8px; text-align: left; }
                .zebra-table-2 td { padding: 5px 8px; color: #333333; word-wrap: break-word; overflow-wrap: break-word; }
                .zebra-table-2 tr:nth-child(even) { background-color: #f4f6f9; }
                .corp-badge { background: #1d429a; color: white; padding: 5px 10px; font-weight: bold; font-size: 11px; display: inline-block; text-transform: uppercase; margin-bottom: 8px; }
                .corp-subtitle { color: #2d56a0; font-size: 11px; margin-top: 12px; margin-bottom: 4px; }
                
                /* Fondo inyectado dinámicamente con ajustes milimétricos */
                .fondo-membrete { 
                    position: fixed; 
                    top: ${configMembrete.ejeY || 0}mm; 
                    left: ${configMembrete.ejeX || 0}mm; 
                    width: ${configMembrete.escala || 100}%; 
                    z-index: -1000; 
                }

                table.page-layout { width: 100%; border-collapse: collapse; border: none; }
                table.page-layout > thead > tr > td { height: 3.8cm; border: none; padding: 0; }
                table.page-layout > tfoot > tr > td { height: 4.2cm; border: none; padding: 0; }
                table.page-layout > tbody > tr > td { padding: 0.2cm 2cm; border: none; }

                .titulo-documento { font-weight: bold; text-transform: uppercase; margin-bottom: 15px; clear: both; letter-spacing: 0.5px;}
                table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; background: rgba(255,255,255,0.96); }
                table.data-table th, table.data-table td { border: 1px solid #dee2e6; padding: 5px 6px; text-align: left; font-size: 9.5px; }
                table.data-table th { background-color: #f4f6f9; color: #1a2b4c; width: 23%; font-weight: bold; }
                table.data-table td { width: 27%; color: #444; }
                .comparables-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
                .comparables-table th, .comparables-table td { border: 1px solid #dee2e6; padding: 5px 6px; }
                .comparables-table th { background-color: #f4f6f9; color: #2d56a0; font-weight: bold; }
                .comparables-table td { color: #333; }
                .foto-box { background:#f4f6f9; padding:5px; border:1px solid #ccc; font-weight:bold; color:#1a2b4c; font-size:10px; margin-bottom:5px; text-align: center; }
            </style>
        </head>
        <body>
            <img src="${b64MembreteFinal}" class="fondo-membrete" />
            <table class="page-layout">
                <thead><tr><td></td></tr></thead>
                <tbody>
                    <tr>
                        <td>
                            ${htmlContenidoDinamico}
                        </td>
                    </tr>
                </tbody>
                <tfoot><tr><td></td></tr></tfoot>
            </table>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0' });
        
        await page.pdf({ 
            path: rutaPDF, 
            format: 'Letter', 
            printBackground: true,
            displayHeaderFooter: false, 
            margin: { top: '0', bottom: '0', left: '0', right: '0' }
        });
        
        await browser.close();
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