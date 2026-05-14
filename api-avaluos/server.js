const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

// --- NUEVAS LIBRERÍAS PARA ARCHIVOS Y PDF ---
const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Permitir que React acceda a la carpeta 'uploads' para descargar el PDF luego
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURACIÓN DE MULTER (El "portero" de las imágenes) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){ fs.mkdirSync(dir); } // Crea la carpeta si no existe
    cb(null, dir) 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Le pone un nombre único a cada foto
  }
})
const upload = multer({ storage: storage });


// 1. ENDPOINT: Dashboard (Tarjetas KPI)
app.get('/api/dashboard', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const [atrasados] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega < ? AND estado = "Activo"', [hoy]);
        const [enProceso] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega >= ? AND estado = "Activo"', [hoy]);
        const [pendientes] = await db.query('SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega IS NULL AND estado = "Activo"');
        res.json({ atrasados: atrasados[0].total, enProceso: enProceso[0].total, pendientes: pendientes[0].total });
    } catch (error) { res.status(500).json({ error: "Error en indicadores" }); }
});

// 2. ENDPOINT: Listado de Avalúos
app.get('/api/avaluos', async (req, res) => {
    try {
        const [filas] = await db.query(`SELECT id, fechaRegistro, fecha_limite_entrega, estado, Solicitante AS solicitante, NumeroDocumento AS documento, TipoDeAvaluo AS tipo_avaluo, FechaDeVisita AS fecha_visita, DATE_FORMAT(FechaDeVisita, '%Y-%m-%d') AS fecha_vis_formato FROM avaluoenntity ORDER BY id DESC`);
        res.json(filas);
    } catch (error) { res.status(500).json({ error: "Error al obtener el listado" }); }
});

// 3. ENDPOINTS DE SLA (Tiempos, Finalizar, Reactivar)
app.put('/api/avaluos/:id/tiempo', async (req, res) => {
    try {
        const [resultado] = await db.query('UPDATE avaluoenntity SET fecha_limite_entrega = ? WHERE id = ?', [req.body.fecha_limite ? req.body.fecha_limite : null, req.params.id]);
        res.json({ mensaje: "Fecha límite asignada." });
    } catch (error) { res.status(500).json({ error: "Error interno." }); }
});

app.put('/api/avaluos/:id/finalizar', async (req, res) => {
    try { await db.query('UPDATE avaluoenntity SET estado = "Finalizado" WHERE id = ?', [req.params.id]); res.json({ mensaje: "Finalizado." }); } 
    catch (error) { res.status(500).json({ error: "Error interno." }); }
});

app.put('/api/avaluos/:id/reactivar', async (req, res) => {
    try { await db.query('UPDATE avaluoenntity SET estado = "Activo" WHERE id = ?', [req.params.id]); res.json({ mensaje: "Reactivado." }); } 
    catch (error) { res.status(500).json({ error: "Error interno." }); }
});


// =====================================================================
// 4. NUEVO ENDPOINT: RECIBIR DATOS, GUARDAR FOTOS Y GENERAR PDF
// =====================================================================
app.post('/api/avaluos/generar-pdf', upload.array('fotos', 20), async (req, res) => {
    try {
        // Desempaquetamos los datos enviados desde React
        const datos = JSON.parse(req.body.datosFormulario);
        const titulosImagenes = req.body.titulosImagenes ? JSON.parse(req.body.titulosImagenes) : [];
        const archivosFotos = req.files; // Aquí vienen las imágenes físicas

        console.log("Creando PDF para:", datos.Solicitante);

        // --- MAQUETACIÓN DEL PDF (Estilo Candamil / Tinsa) ---
        let htmlPlantilla = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
                
                /* Estilos de Cabecera */
                .header { border-bottom: 3px solid #1d429a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;}
                .header-title { color: #1d429a; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 1px;}
                .header-subtitle { color: #666; font-size: 12px; margin: 5px 0 0 0; }
                .folio { font-size: 12px; color: #dc3545; font-weight: bold; }

                /* Estilos de Secciones y Tablas */
                .section-title { background-color: #1d429a; color: white; padding: 6px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;}
                th, td { border: 1px solid #dee2e6; padding: 6px 8px; text-align: left; }
                th { background-color: #f8f9fa; color: #1d429a; font-weight: bold; width: 25%; }
                td { width: 25%; color: #444; }

                /* Cuadros de Valoración */
                .table-valores th { background-color: #e9ecef; color: #333; text-align: center; }
                .table-valores td { text-align: center; }
                .total-row { font-weight: bold; background-color: #f8f9fa; }
                .total-price { color: #198754; font-size: 13px; }

                /* Grilla de Fotos (Cuarto Oscuro) */
                .photo-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; justify-content: space-between; }
                .photo-card { width: 48%; border: 1px solid #ccc; padding: 5px; box-sizing: border-box; page-break-inside: avoid; margin-bottom: 10px;}
                .photo-card img { width: 100%; height: 260px; object-fit: cover; }
                .photo-title { text-align: center; background-color: #f8f9fa; padding: 8px; font-size: 11px; font-weight: bold; color: #1d429a; border-top: 1px solid #ccc; text-transform: uppercase;}
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="header-title">CANDAMIL & ASOCIADOS</h1>
                    <p class="header-subtitle">Abogados Especialistas / Peritos Avaluadores</p>
                </div>
                <div class="folio">
                    FECHA AVALÚO: ${datos.FechaDelAvalio || 'N/A'}<br>
                    CÓDIGO: AVAL-${Date.now().toString().slice(-6)}
                </div>
            </div>

            <div class="section-title">■ INFORMACIÓN GENERAL Y JURÍDICA</div>
            <table>
                <tr><th>Solicitante</th><td colspan="3">${datos.Solicitante || ''}</td></tr>
                <tr><th>No. Documento</th><td>${datos.TipoDeDocumento || ''} - ${datos.NumeroDocumento || ''}</td><th>Entidad</th><td>${datos.Entidad || ''}</td></tr>
                <tr><th>Tipo de Avalúo</th><td>${datos.TipoDeAvaluo || ''}</td><th>Finalidad</th><td>${datos.FinalidadDelAvaluo || ''}</td></tr>
                <tr><th>Propietario</th><td colspan="3">${datos.Propietario || ''}</td></tr>
                <tr><th>Matrícula Inmobiliaria</th><td>${datos.matriculainmNumero1 || ''}</td><th>Cédula Catastral</th><td>${datos.CedulaCatastral || ''}</td></tr>
            </table>

            <div class="section-title">■ UBICACIÓN DEL INMUEBLE</div>
            <table>
                <tr><th>Dirección</th><td colspan="3">${datos.Direccion || ''}</td></tr>
                <tr><th>Departamento</th><td>${datos.Departamento || ''}</td><th>Municipio</th><td>${datos.Municipio || ''}</td></tr>
                <tr><th>Barrio / Sector</th><td>${datos.Barrio || ''} / ${datos.Sector || ''}</td><th>Latitud / Longitud</th><td>${datos.Latitud || ''} , ${datos.Longitud || ''}</td></tr>
            </table>

            <div class="section-title">■ DESCRIPCIÓN GENERAL Y LINDEROS</div>
            <p style="font-size: 11px; text-align: justify; line-height: 1.5; color: #444;">
                ${datos.DescripcionGeneral || 'No se registraron observaciones generales.'}
            </p>

            <div class="section-title">■ RESUMEN DE VALORACIÓN</div>
            <table class="table-valores">
                <tr>
                    <th>ÍTEM</th><th>ÁREA (M²)</th><th>VALOR UNITARIO</th><th>VALOR TOTAL COMERCIAL</th>
                </tr>
                <tr>
                    <td style="text-align: left; font-weight: bold;">Terreno</td>
                    <td>${datos.CVTArea || '0'}</td>
                    <td>$ ${Number(datos.CVTValorUnitario || 0).toLocaleString('es-CO')}</td>
                    <td class="total-price">$ ${(Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)).toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                    <td style="text-align: left; font-weight: bold;">Construcción / Edificación</td>
                    <td>${datos.CVEArea || '0'}</td>
                    <td>$ ${Number(datos.CVEValorUnitario || 0).toLocaleString('es-CO')}</td>
                    <td class="total-price">$ ${(Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0)).toLocaleString('es-CO')}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">GRAN TOTAL AVALÚO COMERCIAL:</td>
                    <td class="total-price" style="font-size: 16px;">
                        $ ${((Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)) + (Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0))).toLocaleString('es-CO')}
                    </td>
                </tr>
            </table>

            <div style="page-break-before: always;"></div>
            
            <div class="header">
                <div>
                    <h1 class="header-title">CANDAMIL & ASOCIADOS</h1>
                    <p class="header-subtitle">Anexos: Registro Fotográfico</p>
                </div>
            </div>

            <div class="section-title">■ INSPECCIÓN VISUAL DEL INMUEBLE</div>
            <div class="photo-grid">
        `;

        // --- INCRUSTAR LAS FOTOS EN EL HTML ---
        // Convertimos las fotos físicas guardadas a Base64 para que Puppeteer las pueda imprimir en el PDF
        archivosFotos.forEach((file, index) => {
            const imagePath = path.resolve(file.path);
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const imgSrc = `data:${file.mimetype};base64,${base64Image}`;
            const tituloImagen = titulosImagenes[index] || 'VISTA DEL PREDIO';

            htmlPlantilla += `
                <div class="photo-card">
                    <img src="${imgSrc}" alt="Foto ${index}" />
                    <div class="photo-title">${tituloImagen}</div>
                </div>
            `;
        });

        htmlPlantilla += `
            </div> <div style="margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; width: 60%; margin-left: auto; margin-right: auto;">
                <p style="font-weight: bold; font-size: 14px; margin-bottom: 0;">Diego Antonio Candamil Rengifo</p>
                <p style="font-size: 11px; color: #666; margin-top: 2px;">Abogado Especialista / Perito Avaluador<br>R.N.A. AVAL-94355787</p>
            </div>
        </body>
        </html>
        `;

        // --- MAGIA DE PUPPETEER: CONVERTIR HTML A PDF ---
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Cargar el HTML en el navegador invisible
        await page.setContent(htmlPlantilla, { waitUntil: 'networkidle0' });
        
        // Configurar el documento PDF
        const nombreArchivoPDF = `Avaluo_Candamil_${Date.now()}.pdf`;
        const rutaPDF = path.join(__dirname, 'uploads', nombreArchivoPDF);
        
        await page.pdf({ 
            path: rutaPDF, 
            format: 'Letter',
            printBackground: true,
            margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
        });

        await browser.close();

        // OPCIONAL AQUÍ: Guardar el JSON `datos` en la base de datos MySQL usando db.query(...)
        // (Por ahora lo omitimos para probar que el PDF se genere correctamente)

        console.log("PDF Generado exitosamente en:", rutaPDF);

        // Responder al frontend
        res.json({ 
            mensaje: "Avalúo y PDF generados con éxito", 
            pdfUrl: `/uploads/${nombreArchivoPDF}` // Le enviamos la ruta para que React lo pueda descargar
        });

    } catch (error) {
        console.error("Error crítico al generar PDF:", error);
        res.status(500).json({ error: "Error interno al procesar el documento." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});