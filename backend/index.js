const express = require("express");
const cors = require("cors"); // Importar cors
const app = express();
const db = require("./db");
const PORT = 3001;
const jwt = require("jsonwebtoken");
const SECRET_KEY = "tu_clave_secreta";

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Obtener el token del encabezado Authorization

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }

    req.user = user; // Agregar los datos del usuario al objeto req
    next();
  });
};

// Ejemplo de ruta protegida
app.get("/perfil", authenticateToken, (req, res) => {
  res.json({ message: "Acceso autorizado", user: req.user });
});

app.use(cors()); // Habilitar CORS
app.use(express.json());

// Rutas existentes
app.get('/historial', authenticateToken, (req, res) => {
  const { mail } = req.user; // Obtener el correo del usuario desde el token

  const query = 'SELECT * FROM historial WHERE profesor = ? ORDER BY fecha DESC';
  db.all(query, [mail], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post("/historial", (req, res) => {
  const { profesor, estado } = req.body;

  if (!profesor || !estado) {
    return res.status(400).json({ error: "Profesor y estado son requeridos" });
  }

  const query = "INSERT INTO historial (profesor, estado) VALUES (?, ?)";
  db.run(query, [profesor, estado], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID, profesor, estado });
    }
  });
});

app.post("/estados", (req, res) => {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "El campo estado es requerido" });
  }

  // Verificar si el estado ya existe
  const checkQuery = "SELECT COUNT(*) AS count FROM estados WHERE estado = ?";
  db.get(checkQuery, [estado], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count > 0) {
      return res
        .status(400)
        .json({ error: "El estado ya existe en la base de datos" });
    }

    // Insertar el nuevo estado si no existe
    const insertQuery = "INSERT INTO estados (estado) VALUES (?)";
    db.run(insertQuery, [estado], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ estado });
      }
    });
  });
});

app.get("/estados", (req, res) => {
  const query = "SELECT estado FROM estados";

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post("/register", (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  const query = "INSERT INTO usuarios (mail, password) VALUES (?, ?)";
  db.run(query, [mail, password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "El correo ya está registrado" });
      }
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  });
});

app.post("/login", (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res
      .status(400)
      .json({ error: "Correo y contraseña son requeridos" });
  }

  const query = "SELECT * FROM usuarios WHERE mail = ? AND password = ?";
  db.get(query, [mail, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al verificar el usuario" });
    }

    if (row) {
      // Generar el token JWT
      const token = jwt.sign({ id: row.id, mail: row.mail }, SECRET_KEY, {
        expiresIn: "1h",
      });

      res
        .status(200)
        .json({
          message: "Usuario autenticado correctamente",
          user: row,
          token,
        });
    } else {
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
