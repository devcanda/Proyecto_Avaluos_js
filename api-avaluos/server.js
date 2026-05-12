const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Datos para las tarjetas (KPIs)
app.get('/api/dashboard', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];

        const [atrasados] = await db.query(
            'SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega < ? AND estado = "Activo"', 
            [hoy]
        );

        const [enProceso] = await db.query(
            'SELECT COUNT(*) AS total FROM avaluoenntity WHERE fecha_limite_entrega >= ? AND estado = "Activo"', 
            [hoy]
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

// 2. Datos para la tabla de registros
app.get('/api/avaluos', async (req, res) => {
    try {
        // Traemos los últimos 10 registros reales
        const [filas] = await db.query(`
            SELECT 
                id, 
                fechaRegistro, 
                fecha_limite_entrega, 
                estado 
            FROM avaluoenntity 
            ORDER BY id DESC 
            LIMIT 10
        `);
        res.json(filas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en listado" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});