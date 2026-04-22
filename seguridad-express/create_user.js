const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createUser() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'farmacia'
    });

    const password = 'cindyconinfluenza'; // Cambia esto por la contraseña que tu quieres
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
        'INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)',
        ['cindy', hashedPassword, 'consulta']
    );

    //admin-admin123
    //pau-pau123

    console.log('Usuario creado con contraseña hasheada');
    process.exit();
}

createUser();