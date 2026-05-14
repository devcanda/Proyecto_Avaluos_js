const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

// 1. ENDPOINT: Dashboard (Tarjetas KPI)
app.get('/api/dashboard', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];

        const [atrasados] = await db.query(
            'SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega < ? AND estado = "Activo"', [hoy]
        );
        const [enProceso] = await db.query(
            'SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega >= ? AND estado = "Activo"', [hoy]
        );
        const [pendientes] = await db.query(
            'SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega IS NULL AND estado = "Activo"'
        );

        res.json({
            atrasados: atrasados[0].total,
            enProceso: enProceso[0].total,
            pendientes: pendientes[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en indicadores" });
    }
});

// 2. ENDPOINT: Listado de Avalúos para la tabla
app.get('/api/avaluos', async (req, res) => {
    try {
        const [filas] = await db.query(`
            SELECT 
                id, 
                fechaRegistro, 
                fecha_limite_entrega, 
                estado,
                Solicitante AS solicitante,
                NumeroDocumento AS documento,
                TipoDeAvaluo AS tipo_avaluo,
                FechaDeVisita AS fecha_visita,
                DATE_FORMAT(FechaDeVisita, '%Y-%m-%d') AS fecha_vis_formato
            FROM avaluoenntity 
            ORDER BY id DESC
        `);
        res.json(filas);
    } catch (error) {
        console.error("Error consultando la tabla de avalúos:", error);
        res.status(500).json({ error: "Error al obtener el listado de avalúos" });
    }
});

// 3. NUEVO ENDPOINT: Guardar Fecha Límite (Fase 1)
app.put('/api/avaluos/:id/tiempo', async (req, res) => {
    try {
        const { id } = req.params; // Sacamos el ID de la URL
        const { fecha_limite } = req.body; // Sacamos la fecha que envió React

        // Ejecutamos la actualización en tu tabla con doble 'n'
        const [resultado] = await db.query(
            'UPDATE avaluoenntity SET fecha_limite_entrega = ? WHERE id = ?',
            [fecha_limite ? fecha_limite : null, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el avalúo." });
        }

        res.json({ mensaje: "Fecha límite asignada correctamente." });
    } catch (error) {
        console.error("Error al actualizar tiempo:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// 4. NUEVO ENDPOINT: Marcar como Finalizado
app.put('/api/avaluos/:id/finalizar', async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(
            'UPDATE avaluoenntity SET estado = "Finalizado" WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el avalúo." });
        }

        res.json({ mensaje: "Avalúo marcado como Finalizado." });
    } catch (error) {
        console.error("Error al finalizar:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// 5. NUEVO ENDPOINT: Reactivar Avalúo (Volver a Activo)
app.put('/api/avaluos/:id/reactivar', async (req, res) => {
    try {
        const { id } = req.params;
        // Lo devolvemos al estado 'Activo'
        const [resultado] = await db.query(
            'UPDATE avaluoenntity SET estado = "Activo" WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el avalúo." });
        }

        res.json({ mensaje: "Avalúo reactivado correctamente." });
    } catch (error) {
        console.error("Error al reactivar:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// 6. NUEVO ENDPOINT: Crear un Nuevo Avalúo (Guardar en MySQL)
app.post('/api/avaluos', async (req, res) => {
    try {
        const datos = req.body;
        // Obtenemos la fecha actual para el registro
        const hoy = new Date().toISOString().split('T')[0];

        // Ejecutamos la inserción mapeando los datos de React a tus columnas de MySQL
        const [resultado] = await db.query(`
            INSERT INTO avaluoenntity (
                Solicitante, TipoDeDocumento, NumeroDocumento, Entidad, 
                Departamento, Municipio, Direccion, Barrio, Sector, Estrato, 
                TipoDeBien, TipoDeAvaluo, FinalidadDelAvaluo, ObjetoDelAvaluo, 
                Propietario, NumeroDeEscritura, AspJFecha, NumeroDeNotaria, 
                matriculainmNumero1, CedulaCatastral,
                AreaLote, Frente, Fondo, Topografia, 
                Acueducto, EnergiaElectrica, Alcantarillado, GasNatural,
                ViasDeAcceso, Transporte, Inseguridad, Ruido, 
                Latitud, Longitud,
                EstadoDeLaConstruccion, Edad, VidaUtil, EstadoDeConservacion,
                Estructura, MaterialDeEstructura, Remodelado,
                PredioAlcobas, PredioBanoPrivado, PredioBanoSocial, PredioCocina, PredioSala, PredioTotalCuposDeParqueo,
                CVTArea, CVTValorUnitario, CVEArea, CVEValorUnitario,
                DescripcionGeneral,
                fechaRegistro, estado
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, 'Activo'
            )
        `, [
            datos.Solicitante, datos.TipoDeDocumento || 1, datos.NumeroDocumento, datos.Entidad,
            datos.Departamento, datos.Municipio, datos.Direccion, datos.Barrio, datos.Sector, datos.Estrato,
            datos.TipoDeBien, datos.TipoDeAvaluo, datos.FinalidadDelAvaluo, datos.ObjetoDelAvaluo,
            datos.Propietario, datos.NumeroDeEscritura, datos.AspJFecha || null, datos.NumeroDeNotaria,
            datos.matriculainmNumero1, datos.CedulaCatastral,
            datos.AreaLote, datos.Frente, datos.Fondo, datos.Topografia,
            datos.Acueducto, datos.EnergiaElectrica, datos.Alcantarillado, datos.GasNatural,
            datos.ViasDeAcceso, datos.Transporte, datos.Inseguridad, datos.Ruido,
            datos.Latitud, datos.Longitud,
            datos.EstadoDeLaConstruccion, datos.Edad, datos.VidaUtil, datos.EstadoDeConservacion,
            datos.Estructura, datos.MaterialDeEstructura, datos.Remodelado,
            datos.PredioAlcobas, datos.PredioBanoPrivado, datos.PredioBanoSocial, datos.PredioCocina, datos.PredioSala, datos.PredioTotalCuposDeParqueo,
            datos.CVTArea, datos.CVTValorUnitario, datos.CVEArea, datos.CVEValorUnitario,
            datos.DescripcionGeneral,
            hoy // fechaRegistro
        ]);

        res.json({ mensaje: "Avalúo guardado exitosamente", id: resultado.insertId });
    } catch (error) {
        console.error("Error al guardar el avalúo:", error);
        res.status(500).json({ error: "Error interno al guardar en la base de datos." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});