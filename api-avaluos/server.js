const express = require('express');
const cors = require('cors');
const db = require('./src/config/db'); // Importamos tu nueva conexión a MySQL

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// NUEVO ENDPOINT: Extraer datos para el Dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        // Hacemos la consulta real a tu tabla 'avaluo'
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM avaluo');
        const totalAvaluos = rows[0].total;

        // Enviamos la respuesta en formato JSON puro
        res.json({
            total: totalAvaluos,
            mensaje: "¡Conexión a MySQL exitosa!"
        });

    } catch (error) {
        console.error("Error en BD:", error);
        res.status(500).json({ error: "Ocurrió un error al conectar con la base de datos" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});