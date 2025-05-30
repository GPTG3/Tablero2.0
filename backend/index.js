const express = require("express");
const cors = require("cors"); // Importar cors
const app = express();
const db = require("./db");
const PORT = 3001;
const jwt = require("jsonwebtoken");
const SECRET_KEY = "tu_clave_secreta";
const http = require("http");
const mqtt = require("mqtt");
const WebSocket = require("ws");

// --- Crear servidor HTTP para WebSocket ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- MQTT Configuración ---
const mqttClient = mqtt.connect("mqtt://34.176.60.77"); // AQUI CAMBIAR IP

mqttClient.on("connect", () => {
  console.log("Conectado a MQTT broker");
  mqttClient.subscribe("matriz/texto"); // escucha al ESP32
});

// MQTT: cuando se recibe un mensaje desde el ESP32
mqttClient.on("message", (topic, message) => {
  console.log(`📩 Mensaje recibido [${topic}]: ${message.toString()}`);
  // reenviar a todos los clientes WebSocket conectados
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message.toString());
    }
  });
});

// WebSocket: cuando se recibe mensaje del frontend
wss.on("connection", (ws) => {
  console.log("🔌 Cliente WebSocket conectado");

  ws.on("message", (message) => {
    console.log("➡️ Mensaje desde frontend:", message);
    mqttClient.publish("matriz/texto", message); // reenviar al ESP32
  });

  ws.on("close", () => {
    console.log("🔌 Cliente WebSocket desconectado");
  });
});

// Iniciar servidor HTTP (WebSocket + Express)
server.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
});

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
app.get("/historial", authenticateToken, (req, res) => {
  const { mail } = req.user; // Obtener el correo del usuario desde el token

  const query =
    "SELECT * FROM historial WHERE profesor = ? ORDER BY fecha DESC";
  db.all(query, [mail], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post("/historial", (req, res) => {
  const { profesor, estado, fecha } = req.body;

  if (!profesor || !estado || !fecha) {
    return res
      .status(400)
      .json({ error: "Profesor, estado y fecha son requeridos" });
  }

  const query =
    "INSERT INTO historial (profesor, estado, fecha) VALUES (?, ?, ?)";
  db.run(query, [profesor, estado, fecha], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ message: "Registro guardado correctamente" });
    }
  });
});

app.post("/estados", (req, res) => {
  const { estado, profesor } = req.body;

  if (!estado || !profesor) {
    return res.status(400).json({ error: "Estado y profesor son requeridos" });
  }

  const query = "INSERT INTO estados (estado, profesor) VALUES (?, ?)";
  db.run(query, [estado, profesor], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ message: "Estado guardado correctamente" });
    }
  });
});

app.get("/estados", (req, res) => {
  const { profesor } = req.query;

  if (!profesor) {
    return res.status(400).json({ error: "El correo del profesor es requerido" });
  }

  const query = "SELECT estado FROM estados WHERE profesor = ?";
  db.all(query, [profesor], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows); // Asegúrate de que se devuelva un arreglo
    }
  });
});

// Ruta para editar un estado
app.put("/estados", (req, res) => {
  const { estadoOriginal, nuevoEstado, profesor } = req.body;

  if (!estadoOriginal || !nuevoEstado || !profesor) {
    return res.status(400).json({ error: "Estado original, nuevo estado y profesor son requeridos" });
  }

  const query = "UPDATE estados SET estado = ? WHERE estado = ? AND profesor = ?";
  db.run(query, [nuevoEstado, estadoOriginal, profesor], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Estado no encontrado o no pertenece al profesor" });
    } else {
      res.status(200).json({ message: "Estado actualizado correctamente" });
    }
  });
});

// Ruta para eliminar un estado
app.delete("/estados", (req, res) => {
  const { estado, profesor } = req.body;

  if (!estado || !profesor) {
    return res.status(400).json({ error: "Estado y profesor son requeridos" });
  }

  const query = "DELETE FROM estados WHERE estado = ? AND profesor = ?";
  db.run(query, [estado, profesor], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Estado no encontrado o no pertenece al profesor" });
    } else {
      res.status(200).json({ message: "Estado eliminado correctamente" });
    }
  });
});

app.post("/register", (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res
      .status(400)
      .json({ error: "Correo y contraseña son requeridos" });
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

      res.status(200).json({
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
