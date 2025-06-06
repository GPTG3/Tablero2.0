const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Crear o abrir la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profesor TEXT NOT NULL,
      estado TEXT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla estados
  db.run(`
    CREATE TABLE IF NOT EXISTS estados (
      estado TEXT NOT NULL,
      profesor TEXT NOT NULL
    )
  `);

  // Tabla usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tableros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      ip TEXT NOT NULL,
      topico TEXT NOT NULL,
      formato TEXT,
      profesor TEXT NOT NULL
    )
  `);

});

// Guardar un tablero para un profesor
function guardarTablero({ nombre, ip, topico, formato, profesor }, callback) {
  const query = `
    INSERT INTO tableros (nombre, ip, topico, formato, profesor)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [nombre, ip, topico, formato, profesor], function (err) {
    callback(err, this ? this.lastID : null);
  });
}

// Obtener tableros de un profesor
function obtenerTablerosPorProfesor(profesor, callback) {
  const query = `
    SELECT * FROM tableros WHERE profesor = ?
  `;
  db.all(query, [profesor], (err, rows) => {
    callback(err, rows);
  });
}

// ...existing code...
module.exports = {
  db,
  guardarTablero,
  obtenerTablerosPorProfesor,
};