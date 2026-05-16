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
    { name: 'fotosAnexos', maxCount: 20 }
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
        const b64Membrete = getBase64Image('membrete.jpg'); 
        
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

        const htmlPlantilla = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 0; size: letter; }
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; line-height: 1.4; margin: 0; padding: 0; }
                
                .fondo-membrete { position: fixed; top: 0; left: 0; width: 215.9mm; height: 279.4mm; z-index: -1000; object-fit: fill; }

                table.page-layout { width: 100%; border-collapse: collapse; border: none; }
                table.page-layout > thead > tr > td { height: 4.3cm; border: none; padding: 0; }
                table.page-layout > tfoot > tr > td { height: 3cm; border: none; padding: 0; }
                table.page-layout > tbody > tr > td { padding: 0 2cm; border: none; }

                .caja-radicado { border: 2px solid #1a2b4c; padding: 5px 12px; text-align: center; border-radius: 6px; width: 110px; float: right; margin-bottom: 15px; background: white; font-weight: bold; }
                .titulo-documento { text-align: center; color: #1a2b4c; font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; clear: both; letter-spacing: 0.5px;}
                
                .section-title { background-color: #1a2b4c; color: white; padding: 4px 8px; font-weight: bold; margin-top: 15px; margin-bottom: 8px; font-size: 10px; text-transform: uppercase; page-break-after: avoid; }
                
                table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; background: rgba(255,255,255,0.96); }
                table.data-table th, table.data-table td { border: 1px solid #dee2e6; padding: 5px 6px; text-align: left; font-size: 9.5px; }
                table.data-table th { background-color: #f4f6f9; color: #1a2b4c; width: 23%; font-weight: bold; }
                table.data-table td { width: 27%; color: #444; }
                
                .text-area-cell { background: #fafafa; padding: 6px; font-style: italic; color: #555; }
                .foto-box { background:#f4f6f9; padding:5px; border:1px solid #ccc; font-weight:bold; color:#1a2b4c; font-size:10px; margin-bottom:5px; text-align: center; }
            </style>
        </head>
        <body>
            
            <img src="${b64Membrete}" class="fondo-membrete" />

            <table class="page-layout">
                <thead><tr><td></td></tr></thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="caja-radicado">
                                <span style="font-size: 8px; color: #1a2b4c;">RADICADO</span><br>
                                <b style="color:#dc3545; font-size:13px;">#${id}</b><br>
                                <span style="font-size: 8px;">${datos.fechaRegistro ? new Date(datos.fechaRegistro).toLocaleDateString() : ''}</span>
                            </div>

                            <div class="titulo-documento">INFORME TÉCNICO DE AVALÚO<sup>${datos.TipoDeAvaluo || 'COMERCIAL'}</sup></div>

                            <div class="section-title">1. INFORMACIÓN GENERAL Y DEL SOLICITANTE</div>
                            <table class="data-table">
                                <tr><th>Solicitante</th><td colspan="3"><b>${datos.Solicitante || ''}</b></td></tr>
                                <tr><th>Identificación</th><td>${datos.NumeroDocumento || ''}</td><th>Entidad Solicitante</th><td>${datos.Entidad || ''}</td></tr>
                                <tr><th>Fecha de Visita</th><td>${datos.FechaDeVisita || ''}</td><th>Fecha del Avalúo</th><td>${datos.FechaDelAvalio || ''}</td></tr>
                                <tr><th>Finalidad del Avalúo</th><td>${datos.FinalidadDelAvaluo || ''}</td><th>Objeto del Avalúo</th><td>${datos.ObjetoDelAvaluo || ''}</td></tr>
                            </table>

                            <div class="section-title">2. UBICACIÓN, ENTORNO Y URBANISMO</div>
                            <table class="data-table">
                                <tr><th>Dirección del Predio</th><td colspan="3">${datos.Direccion || ''}</td></tr>
                                <tr><th>Departamento / Mpio</th><td>${datos.Departamento || ''} / ${datos.Municipio || ''}</td><th>Barrio / Sector</th><td>${datos.Barrio || ''} / ${datos.Sector || ''}</td></tr>
                                <tr><th>Estrato Socioeconómico</th><td>${datos.Estrato || ''}</td><th>Código DANE / VIS</th><td>${datos.CodigoDane || ''} / ${datos.ViviendaInteresSocial || ''}</td></tr>
                                <tr><th>Coordenadas Geográficas</th><td colspan="3">Latitud: ${datos.Latitud || ''} &nbsp;|&nbsp; Longitud: ${datos.Longitud || ''}</td></tr>
                                <tr><th colspan="4" style="text-align:center; background-color:#e9ecef;">Infraestructura de Servicios Públicos en el Sector</th></tr>
                                <tr><th>Vías de Acceso</th><td>${datos.ViasDeAcceso || ''}</td><th>Andenes / Sardineles</th><td>${datos.Andenes || ''} / ${datos.Sardineles || ''}</td></tr>
                                <tr><th>Red de Acueducto</th><td>${datos.Acueducto || ''}</td><th>Red de Alcantarillado</th><td>${datos.Alcantarillado || ''}</td></tr>
                                <tr><th>Energía / Gas Natural</th><td>${datos.EnergiaElectrica || ''} / ${datos.GasNatural || ''}</td><th>Telefonía / Pavimento</th><td>${datos.Telefonia || ''} / ${datos.Pavimentadas || ''}</td></tr>
                                <tr><th>Uso Predominante Sector</th><td>${datos.UsoActualPredominante || ''}</td><th>Legalidad Sector</th><td>${datos.Legalidad || ''}</td></tr>
                                <tr><th>Transporte Público</th><td>${datos.Transporte || ''}</td><th>Perspectiva Valorización</th><td>${datos.PerspectivasDeValorizacion || ''}</td></tr>
                                <tr><th>Observaciones Sector</th><td colspan="3" class="text-area-cell">${datos.SectorObservaciones || 'Ninguna.'}</td></tr>
                            </table>

                            <div class="section-title">3. ASPECTOS JURÍDICOS Y TITULACIÓN</div>
                            <table class="data-table">
                                <tr><th>Propietario Inscrito</th><td colspan="3">${datos.Propietario || ''}</td></tr>
                                <tr><th>Matrícula Inmobiliaria 1</th><td>${datos.matriculainmNumero1 || ''}</td><th>Matrícula Inmobiliaria 2</th><td>${datos.matriculainmNumero2 || ''}</td></tr>
                                <tr><th>Cédula Catastral / CHIP</th><td>${datos.CedulaCatastral || ''} / ${datos.Chip || ''}</td><th>Tipo de Propiedad</th><td>${datos.TipoDePropiedad || ''}</td></tr>
                                <tr><th>Título de Adquisición</th><td colspan="3">Escritura Pública No. ${datos.NumeroDeEscritura || ''} de la Notaría ${datos.NumeroDeNotaria || ''} (${datos.AspMunicipio || ''})</td></tr>
                                <tr><th>Fecha del Título</th><td>${datos.AspJFecha || ''}</td><th>Licencia de Construcción</th><td>${datos.LicenciaDeConstruccion || ''}</td></tr>
                                <tr><th>Coef. de Copropiedad</th><td>${datos.CoeficienteDeCopropiedad || ''}</td><th>Tipo de Bien</th><td>${datos.TipoDeBien || ''}</td></tr>
                                <tr><th>Descripción Jurídica</th><td colspan="3" class="text-area-cell">${datos.DescripcionGeneral || 'No registra observaciones adicionales.'}</td></tr>
                            </table>

                            <div class="section-title">4. CARACTERÍSTICAS FÍSICAS, ÁREAS Y NORMATIVIDAD</div>
                            <table class="data-table">
                                <tr><th>Área Terreno (Formulario)</th><td>${datos.AreaLote || '0'} M²</td><th>Forma Geométrica</th><td>${datos.Forma || ''}</td></tr>
                                <tr><th>Topografía del Lote</th><td>${datos.Topografia || ''}</td><th>Frente x Fondo (Mts)</th><td>${datos.Frente || '0'} x ${datos.Fondo || '0'} (Relación: ${datos.RelacionFrenteFondo || 'N/A'})</td></tr>
                                <tr><th>Decreto / Norma POT</th><td>${datos.DecretoAcuerdo || ''}</td><th>Uso Principal Permitido</th><td>${datos.UsoPrincipal || ''}</td></tr>
                                <tr><th>Altura Permitida</th><td>${datos.AlturaPermitida || ''}</td><th>Antejardín / Aislamiento</th><td>${datos.Antejardin || ''} / L: ${datos.AislamientoLateral || ''} P: ${datos.AislamientoPosterior || ''}</td></tr>
                                <tr><th>Índice Ocupación / Const.</th><td>${datos.IndiceDeOcupacion || ''} / ${datos.IndiceDeConstruccion || ''}</td><th>Área Valorada Final</th><td>${datos.AreaValorada || ''} M²</td></tr>
                                <tr><th>Área Medida Inspección</th><td>${datos.AreaMedidaEnLaInspeccion || ''} M²</td><th>Área Registrada Títulos</th><td>${datos.AreaRegistradaEnTitulo || ''} M²</td></tr>
                                <tr><th>Área Catastral / Licencia</th><td>${datos.AreaCatastral || ''} / ${datos.AreaLicenciaDeConstruccion || ''} M²</td><th>Área susceptible Legalizar</th><td>${datos.AreaSusceptibleDeLegalizacion || ''} M²</td></tr>
                                <tr><th>Observaciones de Áreas</th><td colspan="3" class="text-area-cell">${datos.AreaValoradaObservaciones || 'Sin novedades.'}</td></tr>
                            </table>

                            <div class="section-title">5. ELEMENTOS ESTRUCTURALES Y ESPECIFICACIONES CONSTRUCTIVAS</div>
                            <table class="data-table">
                                <tr><th>Estado de Construcción</th><td>${datos.EstadoDeLaConstruccion || ''}</td><th>Avance de Obra (%)</th><td>${datos.AvanceEnConstruccion || ''} %</td></tr>
                                <tr><th>Estado de Conservación</th><td>${datos.EstadoDeConservacion || ''}</td><th>Número de Pisos / Sótanos</th><td>Pisos: ${datos.NoDePisosDelInmueble || '0'} | Sótanos: ${datos.NumeroDeSotanos || '0'}</td></tr>
                                <tr><th>Año de Construcción / Edad</th><td>${datos.YearDeConstruccion || ''} / ${datos.Edad || '0'} Años</td><th>Vida Útil / Remanente</th><td>Útil: ${datos.VidaUtil || ''} | Remanente: ${datos.VidaRemanente || ''}</td></tr>
                                <tr><th>Sistema Estructural</th><td>${datos.Estructura || ''}</td><th>Material Estructura</th><td>${datos.MaterialDeEstructura || ''}</td></tr>
                                <tr><th>Estado General Estructura</th><td>${datos.EstructuraEstado || ''}</td><th>Ajuste Sismorresistente</th><td>${datos.AjusteSismorresistente || ''}</td></tr>
                                <tr><th>Estructura Reforzada</th><td>${datos.EstructuraReforzada || ''}</td><th>Daños o Fisuras Previas</th><td>${datos.DanosPrevios || ''}</td></tr>
                                <tr><th>Tipo de Cubierta</th><td>${datos.Cubierta || ''}</td><th>Fachada / Metros Fachada</th><td>${datos.Fachada || ''} (${datos.TipoDeFachadaEnMetros || '0'} Mts)</td></tr>
                                <tr><th>Iluminación / Ventilación</th><td>${datos.Iluminacion || ''} / ${datos.Ventilacion || ''}</td><th>Irregularidad Planta / Altura</th><td>P: ${datos.IrregularidadPlanta || ''} | A: ${datos.IrregularidadAltura || ''}</td></tr>
                                <tr><th>Material de Construcción</th><td colspan="3">${datos.MaterialDeConstruccion || ''}</td></tr>
                                <tr><th>Comentarios de Estructura</th><td colspan="3" class="text-area-cell">${datos.ComentariosDeLaEstructura || 'Estructura estable en condiciones normales.'}</td></tr>
                            </table>

                            <div class="section-title">6. DETALLE DE ACABADOS Y DEPENDENCIAS DEL INMUEBLE</div>
                            <table class="data-table">
                                <tr style="background-color:#f4f6f9; text-align:center; font-weight:bold; color:#1a2b4c;"><td>ELEMENTO</td><td>CALIDAD</td><td>ESTADO</td><td>ELEMENTO</td><td>CALIDAD</td><td>ESTADO</td></tr>
                                <tr><th>Muros</th><td>${datos.MurosCalidad || ''}</td><td>${datos.MurosEstado || ''}</td><th>Pisos</th><td>${datos.PisosCalidad || ''}</td><td>${datos.PisosEstado || ''}</td></tr>
                                <tr><th>Techos</th><td>${datos.TechosCalidad || ''}</td><td>${datos.TechosEstado || ''}</td><th>Cocina</th><td>${datos.CocinaCalidad || ''}</td><td>${datos.CocinaEstado || ''}</td></tr>
                                <tr><th>Carpintería Metálica</th><td>${datos.CarpinteriaMetalicaCalidad || ''}</td><td>${datos.CarpinteriaMetalicaEstado || ''}</td><th>Carpintería Madera</th><td>${datos.CarpinteriaEnMaderaCalidad || ''}</td><td>${datos.CarpinteriaEnMaderaEstado || ''}</td></tr>
                                <tr><th>Baños</th><td>${datos.BanosCalidad || ''}</td><td>${datos.BanosEstado || ''}</td><td colspan="3" style="background:#f4f6f9;"></td></tr>
                                <tr><th colspan="6" style="text-align:center; background-color:#e9ecef;">Distribución Interna de Dependencias</th></tr>
                                <tr>
                                    <td colspan="6" style="padding:8px; line-height:1.6;">
                                        <b>Servicios Conectados:</b> Acueducto: ${datos.PredioAcueducto || 'NO'} | Energía: ${datos.PredioEnergiaElectrica || 'NO'} | Alcantarillado: ${datos.PredioAlcantarillado || 'NO'} | Gas Natural: ${datos.PredioGasNatural || 'NO'} | Telefonía: ${datos.PredioTelefonia || 'NO'}<br>
                                        <b>Dependencias:</b> Alcobas: ${datos.PredioAlcobas || '0'} | Baños Privados: ${datos.PredioBanoPrivado || '0'} | Baños Sociales: ${datos.PredioBanoSocial || '0'} | Cocinas: ${datos.PredioCocina || '0'} | Salas: ${datos.PredioSala || '0'} | Comedor: ${datos.PredioComedor || '0'} | Zona de Ropas: ${datos.PredioZonaDeRopas || '0'} | Estudio: ${datos.PredioEstudio || '0'} | Balcón: ${datos.PredioBalcon || '0'} | Terraza: ${datos.PredioTerraza || '0'} | Jardín: ${datos.PredioJardin || '0'} | Closets: ${datos.PredioCloset || '0'}<br>
                                        <b>Áreas de Servicio y Garajes:</b> Cupos de Parqueo: ${datos.PredioTotalCuposDeParqueo || '0'} | Bodega: ${datos.PredioBodega || 'NO'} | Depósito: ${datos.PredioDeposito || 'NO'} | Oficina: ${datos.PredioOficina || 'NO'} | Local Comercial: ${datos.PredioLocal || 'NO'}
                                    </td>
                                </tr>
                            </table>

                            <div class="section-title">7. DOTACIÓN COMUNAL Y ADMINISTRACIÓN</div>
                            <table class="data-table">
                                <tr><th>Cuota de Administración</th><td>${datos.DCValorAdmon || 'No aplica'}</td><th>Vigilancia Privada</th><td>${datos.DCVigilanciaPrivada || 'NO'}</td></tr>
                                <tr><th>Número de Ascensores</th><td>${datos.DCAscensores || '0'}</td><th>Otros Elementos</th><td>${datos.DCOtros || 'Ninguno'}</td></tr>
                            </table>

                            <div class="section-title">8. ANÁLISIS DE MERCADO E INVESTIGACIÓN DE OFERTAS</div>
                            <table class="data-table">
                                <tr><th>Tiempo Comercialización</th><td>${datos.TiempoEsperadoDeComercializacion || ''}</td><th>Comportamiento Oferta/Demanda</th><td>${datos.ComportamientoOfertayDemanda || ''}</td></tr>
                                <tr><th>Actualidad Edificadora</th><td colspan="3">${datos.ActualidadEdificadora || ''}</td></tr>
                            </table>

                            <div class="section-title">9. LIQUIDACIÓN DE VALORES Y CERTIFICACIÓN FINAL</div>
                            <table class="data-table" style="margin-bottom:25px;">
                                <tr style="text-align: center; background-color: #e9ecef; font-weight:bold; color:#1a2b4c;"><th>ÍTEM DE CÁLCULO</th><th>ÁREA VALORADA (M²)</th><th>VALOR UNITARIO COMERCIAL</th><th>VALOR TOTAL LIQUIDADO</th></tr>
                                <tr>
                                    <th>Valor del Terreno</th><td style="text-align:center;">${datos.CVTArea || '0'} M²</td>
                                    <td style="text-align:center;">$ ${Number(datos.CVTValorUnitario || 0).toLocaleString('es-CO')}</td>
                                    <td style="text-align:center; color: #198754; font-weight: bold;">$ ${(Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)).toLocaleString('es-CO')}</td>
                                </tr>
                                <tr>
                                    <th>Valor de la Construcción</th><td style="text-align:center;">${datos.CVEArea || '0'} M²</td>
                                    <td style="text-align:center;">$ ${Number(datos.CVEValorUnitario || 0).toLocaleString('es-CO')}</td>
                                    <td style="text-align:center; color: #198754; font-weight: bold;">$ ${(Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0)).toLocaleString('es-CO')}</td>
                                </tr>
                                <tr style="background-color: #f4f6f9;">
                                    <th colspan="3" style="text-align: right; font-size:11px; color:#1a2b4c;">VALOR COMERCIAL TOTAL DEL INMUEBLE (GRAN TOTAL):</th>
                                    <td style="text-align:center; color: #198754; font-weight: bold; font-size: 13px; border:2px solid #1a2b4c;">$ ${((Number(datos.CVTArea || 0) * Number(datos.CVTValorUnitario || 0)) + (Number(datos.CVEArea || 0) * Number(datos.CVEValorUnitario || 0))).toLocaleString('es-CO')}</td>
                                </tr>
                                <tr><th>Diagnóstico y Conclusiones</th><td colspan="3" class="text-area-cell">${datos.DVRDiagnostico || 'Inmueble tasado bajo las normas metodológicas de la lonja de propiedad raíz aplicables para Colombia.'}</td></tr>
                            </table>

                            <div style="page-break-before: always;"></div>
                            
                            <div class="section-title" style="margin-top:0;">10. REGISTRO FOTOGRÁFICO DE PORTADA</div>
                            <table style="width: 100%; border:none; margin-top:10px; background: transparent;">
                                <tr>
                                    <td style="border:none; width:50%; padding:10px; vertical-align: top;">
                                        <div class="foto-box">FACHADA GENERAL DEL INMUEBLE</div>
                                        ${b64Fachada ? `<img src="${b64Fachada}" style="width:100%; height:240px; object-fit:contain; border:1px solid #ccc; background: white; padding:4px;"/>` : '<div style="height:240px; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:gray; background: white;">Fotografía no cargada</div>'}
                                    </td>
                                    <td style="border:none; width:50%; padding:10px; vertical-align: top;">
                                        <div class="foto-box">GEOLOCALIZACIÓN SATELITAL (GOOGLE MAPS)</div>
                                        ${b64Mapa ? `<img src="${b64Mapa}" style="width:100%; height:240px; object-fit:contain; border:1px solid #ccc; background: white; padding:4px;"/>` : '<div style="height:240px; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:gray; background: white;">Captura de mapa no cargada</div>'}
                                    </td>
                                </tr>
                            </table>

                            <div class="section-title">11. ANEXOS FOTOGRÁFICOS COMPLEMENTARIOS (INTERIORES)</div>
                            <div style="width: 100%; display: flex; flex-wrap: wrap; justify-content: space-between; background:transparent;">
                                ${anexosHTML || '<p style="text-align:center; color:gray; width:100%; margin-top:20px; background: white; padding:15px; border:1px solid #ccc;">No se adjuntaron registros fotográficos adicionales para recintos internos.</p>'}
                            </div>
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
        res.sendFile(rutaPDF);

    } catch (error) {
        console.error(error);
        res.status(500).send(`<div style="font-family: Arial; padding: 50px; text-align: center;"><h2 style="color: red;">❌ Error al generar el PDF</h2><p>${error.message}</p></div>`);
    }
});

const PORT = 3000;
app.listen(PORT, () => { console.log(`Servidor Backend corriendo en http://localhost:${PORT}`); });