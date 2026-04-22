const express = require('express');
const cors = require('cors');
const connection = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // sirve index.html y app.js desde la raíz

// GET – Obtener proyectos CON NOMBRE DEL RESPONSABLE
app.get('/api/proyectos', (req, res) => {
    const query = `
        SELECT p.*, 
               r.nombre AS responsable_nombre, 
               r.puesto AS responsable_puesto
        FROM proyectos p 
        LEFT JOIN responsables r ON p.responsable_id = r.id
        ORDER BY p.fecha DESC`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        res.json(results);
    });
});

// POST – Crear proyecto
app.post('/api/proyectos', (req, res) => {
    const { nombre, descripcion, fecha, prioridad, responsable_id } = req.body;

    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const query =
        'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad, responsable_id) VALUES (?, ?, ?, ?, ?)';

    connection.query(query, [nombre, descripcion || '', fecha, prioridad, responsable_id], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al crear proyecto' });
        }

        res.status(201).json({
            mensaje: 'Proyecto creado',
            id: result.insertId
        });
    });
});

// PUT – Editar proyecto
app.put('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha, prioridad, responsable_id } = req.body;

    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const query =
        'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha = ?, prioridad = ?, responsable_id = ? WHERE id = ?';

    connection.query(
        query,
        [nombre, descripcion || '', fecha, prioridad, responsable_id, id],
        (err, result) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: 'Error al editar proyecto' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }

            res.json({ mensaje: 'Proyecto actualizado' });
        }
    );
});

// DELETE – Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM proyectos WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al eliminar proyecto' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ mensaje: 'Proyecto eliminado' });
    });
});

app.get('/api/responsables', (req, res) => {
    const query = 'SELECT * FROM responsables';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener responsables' });
        }
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
});
