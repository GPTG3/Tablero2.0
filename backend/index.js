const express = require('express');
const cors = require('cors'); // Importar cors
const app = express();
const db = require('./db');
const PORT = 3001;

app.use(cors()); // Habilitar CORS
app.use(express.json());

// Rutas existentes
app.get('/historial', (req, res) => {
  db.all('SELECT * FROM historial ORDER BY fecha DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/historial', (req, res) => {
  const { profesor, estado } = req.body;

  if (!profesor || !estado) {
    return res.status(400).json({ error: 'Profesor y estado son requeridos' });
  }

  const query = 'INSERT INTO historial (profesor, estado) VALUES (?, ?)';
  db.run(query, [profesor, estado], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID, profesor, estado });
    }
  });
});

app.post('/estados', (req, res) => {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'El campo estado es requerido' });
  }

  // Verificar si el estado ya existe
  const checkQuery = 'SELECT COUNT(*) AS count FROM estados WHERE estado = ?';
  db.get(checkQuery, [estado], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'El estado ya existe en la base de datos' });
    }

    // Insertar el nuevo estado si no existe
    const insertQuery = 'INSERT INTO estados (estado) VALUES (?)';
    db.run(insertQuery, [estado], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ estado });
      }
    });
  });
});

app.get('/estados', (req, res) => {
  const query = 'SELECT estado FROM estados';

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});