const express = require("express");
const cors = require("cors"); // Importar cors
const app = express();
const { db, guardarTablero, obtenerTablerosPorProfesor, guardarProgramacion, obtenerProgramacionesPendientes, marcarProgramacionEnviada } = require("./db");
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
const mqttClient = mqtt.connect("mqtt://34.176.212.36"); // AQUI CAMBIAR IP

mqttClient.on("connect", () => {
  console.log("Conectado a MQTT broker");
  mqttClient.subscribe("matriz/texto"); // escucha al ESP32

  // Enviar ping cada 10 segundos al ESP32
  setInterval(() => {
    mqttClient.publish("matriz/texto", JSON.stringify({ type: "ping" }));
    console.log("📤 Ping enviado al ESP32 desde backend");
  }, 10000);
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
server.listen(PORT, '0.0.0.0',() => {
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

// Obtener todos los tableros
app.get("/tableros", (req, res) => {
  const { profesor } = req.query;
  if (!profesor) {
    return res.status(400).json({ error: "Profesor requerido" });
  }
  obtenerTablerosPorProfesor(profesor, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Guardar un nuevo tablero
app.post("/tableros", (req, res) => {
  const { nombre, ip, topico, formato, profesor } = req.body;
  if (!nombre || !ip || !topico || !profesor) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  guardarTablero({ nombre, ip, topico, formato, profesor }, (err, id) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id });
    }
  });
});

app.post("/enviar-mqtt", (req, res) => {
  const { ip, topic, mensaje } = req.body;

  if (!ip || !topic || !mensaje) {
    return res.status(400).json({ error: "Faltan datos: ip, topic o mensaje" });
  }

  const brokerUrl = `mqtt://${ip}`;
  const cliente = mqtt.connect(brokerUrl);

  let responded = false;

  cliente.on("connect", () => {
    console.log(`Conectado a broker en ${ip}`);
    cliente.publish(topic, mensaje, (err) => {
      if (!responded) {
        if (err) {
          res.status(500).json({ error: "Error al publicar mensaje" });
        } else {
          res.status(200).json({ message: "Mensaje enviado correctamente" });
        }
        responded = true;
        cliente.end();
      }
    });
  });

  cliente.on("error", (err) => {
    if (!responded) {
      console.error("Error MQTT:", err.message);
      res.status(500).json({ error: "Error al conectar con el broker" });
      responded = true;
      cliente.end();
    }
  });
});

app.delete("/tableros/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tableros WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar el tablero" });
    } else {
      res.json({ message: "Tablero eliminado" });
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

// Ruta para cambiar contraseña
app.put("/cambiar-password", authenticateToken, (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  const { mail } = req.user; // Obtenemos el email del token

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ 
      error: "Contraseña actual y nueva contraseña son requeridas" 
    });
  }

  if (passwordNueva.length < 6) {
    return res.status(400).json({ 
      error: "La nueva contraseña debe tener al menos 6 caracteres" 
    });
  }

  // verificar que la contraseña actual sea correcta
  const queryVerificar = "SELECT * FROM usuarios WHERE mail = ? AND password = ?";
  db.get(queryVerificar, [mail, passwordActual], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al verificar la contraseña actual" });
    }

    if (!row) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    // si la contraseña actual es correcta, actualizamos a la nueva
    const queryActualizar = "UPDATE usuarios SET password = ? WHERE mail = ?";
    db.run(queryActualizar, [passwordNueva, mail], function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar la contraseña" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({ message: "Contraseña actualizada correctamente" });
    });
  });
});

app.post("/programar-mensaje", (req, res) => {
  const { profesor, mensaje, fecha, hora, color } = req.body;
  if (!profesor || !mensaje || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  guardarProgramacion({ profesor, mensaje, fecha, hora, color }, (err, id) => {
    if (err) {
      return res.status(500).json({ error: "Error al guardar la programación" });
    }
    res.status(201).json({ message: "Mensaje programado", id });
  });
});

// Ruta para obtener los mensajes programados
app.get("/programar-mensaje", (req, res) => {
  const { profesor } = req.query;
  if (!profesor) {
    return res.status(400).json({ error: "El profesor es requerido" });
  }
  db.all(
    "SELECT mensaje, fecha, hora, color FROM programaciones WHERE profesor = ? AND enviado = 0 ORDER BY fecha, hora",
    [profesor],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener programaciones" });
      }
      res.json(rows);
    }
  );
});

// Ruta para eliminar una programación
app.delete("/programar-mensaje", (req, res) => {
  const { profesor, mensaje, hora } = req.body;
  if (!profesor || !mensaje || !hora) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  db.run(
    "DELETE FROM programaciones WHERE profesor = ? AND mensaje = ? AND hora = ? AND enviado = 0",
    [profesor, mensaje, hora],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al eliminar la programación" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Programación no encontrada" });
      }
      res.json({ message: "Programación eliminada" });
    }
  );
});

// Editar mensaje programado
app.put("/programar-mensaje", (req, res) => {
  const { profesor, mensajeOriginal, horaOriginal, mensajeNuevo, colorNuevo } = req.body;
  if (!profesor || !mensajeOriginal || !horaOriginal || !mensajeNuevo || !colorNuevo) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  db.run(
    "UPDATE programaciones SET mensaje = ?, color = ? WHERE profesor = ? AND mensaje = ? AND hora = ? AND enviado = 0",
    [mensajeNuevo, colorNuevo, profesor, mensajeOriginal, horaOriginal],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al editar la programación" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Programación no encontrada" });
      }
      res.json({ message: "Programación editada" });
    }
  );
});
// Intervalo para enviar mensajes programados
setInterval(() => {
  const ahora = new Date();
  const fechaActual = ahora.toLocaleDateString("en-CA", { timeZone: "America/Santiago" }); // yyyy-mm-dd
  const horaActual = ahora.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago"
  });

  obtenerProgramacionesPendientes((err, programaciones) => {
    if (err) {
      console.error("Error al obtener programaciones:", err);
      return;
    }
    programaciones.forEach((prog) => {
      const progHora = prog.hora.padStart(5, "0");
      // Solo envía si la fecha y la hora coinciden
      if (!prog.enviado && prog.fecha === fechaActual && progHora <= horaActual) {
        mqttClient.publish("matriz/texto", `${prog.color || "#CC0000"}:${prog.mensaje}`);
        marcarProgramacionEnviada(prog.id, (err) => {
          if (err) {
            console.error("Error al marcar como enviada:", err);
          }
        });
        console.log(`Mensaje programado enviado: ${prog.mensaje} a las ${prog.fecha} ${prog.hora}`);
      }
    });
  });
}, 10000); // Revisa cada 10 segundos

module.exports = app;