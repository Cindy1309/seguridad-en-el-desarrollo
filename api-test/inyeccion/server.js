const express = require("express");
const mysql = require("mysql2");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "seguridad"
});

app.put("/actualizar-rol", (req, res) => {
  const { nombre, rol } = req.body;

  // VULNERABLE A INYECCIÓN SQL
  const sql = `
    UPDATE usuarios
    SET rol = '${rol}'
    WHERE nombre = '${nombre}'
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Rol actualizado" });
  });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
