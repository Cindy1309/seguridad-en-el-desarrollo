require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const connection = require('./db');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = process.env.JWT_SECRET;

// Ruta para obtener info del usuario actual
app.get('/api/userinfo', auth, (req, res) => {
    res.json({
        usuario: req.user.usuario,
        rol: req.user.rol
    });
});

// Login MODIFICADO con cookies
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    console.log('Login:', usuario);

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    connection.query(
        'SELECT id, usuario, password, rol FROM usuarios WHERE usuario = ?',
        [usuario],
        (err, rows) => {
            if (err) {
                console.error('Error BD:', err);
                return res.status(500).json({ error: 'Error en BD' });
            }

            if (rows.length === 0 || password !== rows[0].password) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const u = rows[0];
            const token = jwt.sign(
                { id: u.id, usuario: u.usuario, rol: u.rol },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            // Enviar token en cookie segura
            res.cookie('token', token, {
                httpOnly: true,
                secure: false, // Cambiar a true en producción con HTTPS
                sameSite: 'strict',
                maxAge: 2 * 60 * 60 * 1000 // 2 horas
            });

            res.json({ 
                usuario: u.usuario, 
                rol: u.rol,
                mensaje: 'Login exitoso'
            });
        }
    );
});

// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada' });
});

// Middleware auth MODIFICADO para cookies
function auth(req, res, next) {
    // Primero cookie, luego header (retrocompatibilidad)
    let token = req.cookies.token;
    
    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            token = header.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Token inválido' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'No autenticado' });
        if (req.user.rol !== role) return res.status(403).json({ error: 'No autorizado' });
        next();
    };
}

// GET Responsables
app.get('/api/responsables', auth, (req, res) => {
    const query = 'SELECT * FROM responsables';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener responsables' });
        }
        res.json(results);
    });
});

// Configuración de Multer
const upload = multer({ dest: 'uploads/' });

// consultar Proyectos
app.get('/api/proyectos', auth, (req, res) => {
    const query = `
        SELECT p.*, 
               r.nombre AS responsable_nombre, 
               r.puesto AS responsable_puesto
        FROM proyectos p 
        LEFT JOIN responsables r ON p.responsable_id = r.id
        ORDER BY 
        CASE p.prioridad 
            WHEN 'alta' THEN 1 
            WHEN 'media' THEN 2 
            WHEN 'baja' THEN 3 
        END ASC,
        p.fecha DESC
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        results = results.map(p => ({ ...p }));
        res.json(results);
    });
});

app.get('/api/proyectos/:id', auth, (req, res) => {
    const id = req.params.id;

    connection.query('SELECT * FROM proyectos WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyecto' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        const proyecto = results[0];
        proyecto.imagenes = proyecto.imagen_urls ? JSON.parse(proyecto.imagen_urls) : [];

        res.json(proyecto);
    });
});

app.post('/api/proyectos', auth, requireRole('admin'), upload.array('imagenes'), (req, res) => {
    const { nombre, descripcion, fecha, prioridad, responsable_id } = req.body;
    const files = req.files || [];

    console.log('POST /api/proyectos:', { nombre, descripcion, fecha, prioridad });

    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const imagenes = files.map(f => '/uploads/' + f.filename);
    const imagenesJSON = JSON.stringify(imagenes);

    connection.query(
        'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad, responsable_id, imagen_urls) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, descripcion || '', fecha, prioridad, responsable_id || null, imagenesJSON],
        (err, result) => {
            if (err) {
                console.error('Error SQL:', err);
                return res.status(500).json({ error: 'Error al crear proyecto: ' + err.message });
            }
            res.status(201).json({ mensaje: 'Proyecto creado', id: result.insertId });
        }
    );
});

app.put('/api/proyectos/:id', auth, requireRole('admin'), upload.array('imagenes'), (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha, prioridad, imagenes_existentes, responsable_id } = req.body;
    const files = req.files || [];

    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    let imagenes = [];
    if (imagenes_existentes) {
        try {
            imagenes = JSON.parse(imagenes_existentes);
        } catch (e) {
            imagenes = [];
        }
    }

    files.forEach(f => imagenes.push('/uploads/' + f.filename));
    const imagenesJSON = JSON.stringify(imagenes);

    connection.query(
        'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha = ?, prioridad = ?, responsable_id = ?, imagen_urls = ? WHERE id = ?',
        [nombre, descripcion || '', fecha, prioridad, responsable_id || null, imagenesJSON, id],
        (err, result) => {
            if (err) {
                console.error('Error SQL:', err);
                return res.status(500).json({ error: 'Error al actualizar: ' + err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            res.json({ mensaje: 'Proyecto actualizado' });
        }
    );
});

app.delete('/api/proyectos/:id', auth, requireRole('admin'), (req, res) => {
    const { id } = req.params;

    connection.query('DELETE FROM proyectos WHERE id=?', [id], (err, result) => {
        if (err) {
            console.error('Error SQL:', err);
            return res.status(500).json({ error: 'Error al eliminar' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json({ mensaje: 'Proyecto eliminado' });
    });
});

// Rutas frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});

app.get('/usuarios', (req, res) => {

  connection.query('SELECT id, usuario, rol FROM usuarios', (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).send('Error al consultar usuarios');
    }

    const rows = results.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.rol}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Usuarios</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>

      <div class="container mt-4">
        <h2>Usuarios</h2>

        <table class="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
             
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <a href="/gestion.html" class="btn btn-secondary">Volver</a>
      </div>

      </body>
      </html>
    `);
  });

});