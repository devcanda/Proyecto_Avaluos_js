const mysql = require('mysql2');

// Creamos un "pool" de conexiones (mucho más rápido y seguro que la conexión simple de PHP)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Usuario por defecto de XAMPP/WAMP
    password: '', // Contraseña por defecto (suele estar vacía)
    database: 'candamil_avaluo' // El nombre real de tu base de datos
});

// Exportamos la conexión preparada para usar "promesas" (async/await)
module.exports = pool.promise();