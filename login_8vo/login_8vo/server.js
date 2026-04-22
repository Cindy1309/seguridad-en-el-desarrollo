const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connection = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = 'esto-es-una-contraseña-segura';

// login
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
      res.json({ token, usuario: u.usuario, rol: u.rol });
    }
  );
});

// Middleware auth 
function auth(req, res, next) {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    console.log('Error: No autorizado - header incorrecto');
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const token = header.split(' ')[1];
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    console.log('Token válido para:', req.user.usuario);
    next();
  } catch (error) {
    console.log('Error de token:', error.message);
    

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles) { //permitir más usuarios
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

app.get('/api/proyectos', auth,requireRole('admin'), (req, res) => {
    const query = 'SELECT * FROM proyectos ORDER BY fecha DESC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        res.json(results);
    });
});

// Crear proyecto 
app.post('/api/proyectos', auth, requireRole('admin'), (req, res) => {
    const { nombre, descripcion, fecha, prioridad } = req.body;
  
    console.log('Recibido:', { nombre, descripcion, fecha, prioridad });
    
    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }
    
    const prioridadesValidas = ['baja', 'media', 'alta'];
    if (!prioridadesValidas.includes(prioridad)) {
        return res.status(400).json({ error: 'Prioridad debe ser: baja, media o alta' });
    }
    
    const query = 'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad) VALUES (?, ?, ?, ?)';
    
    connection.query(query, [nombre, descripcion, fecha, prioridad], (err, result) => {
        if (err) {
            console.error('Error SQL:', err);
            /*if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
                return res.status(400).json({ error: 'Formato de fecha inválido' });
            }
            if (err.code === 'ER_DATA_TOO_LONG') {
                return res.status(400).json({ error: 'Valor de prioridad no válido' });
            }*/
            return res.status(500).json({ error: 'Error al crear proyecto' });
        }
        
        res.json({ 
            mensaje: 'Proyecto creado',
            id: result.insertId
        });
    });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'portada.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});