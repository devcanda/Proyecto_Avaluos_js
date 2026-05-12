const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // El usuario por defecto de XAMPP
    password: '', // Sin contraseña por defecto
    database: 'candamil_avaluo' // El nombre de tu BD local
});

module.exports = pool.promise();