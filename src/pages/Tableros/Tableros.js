import React, { useState, useEffect } from "react";
import styles from "./Tableros.module.css";

const Tableros = () => {
  const [tableros, setTableros] = useState([]);
  const [nuevoTablero, setNuevoTablero] = useState({
    nombre: "",
    ip: "",
    topico: "",
    formato: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [tableroSeleccionado, setTableroSeleccionado] = useState(null);
  const [jsonCampos, setJsonCampos] = useState([{ clave: "", valor: "" }]);

  // Obtener el usuario autenticado
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const profesor = user.mail;

  // Cargar tableros al iniciar
  useEffect(() => {
    if (!profesor) return;
    fetch(`http://localhost:3001/tableros?profesor=${profesor}`)
      .then((res) => res.json())
      .then((data) => setTableros(Array.isArray(data) ? data : []))
      .catch(() => setTableros([]));
  }, [profesor]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setNuevoTablero({ ...nuevoTablero, [e.target.name]: e.target.value });
  };

  // Guardar un nuevo tablero
  const handleGuardarTablero = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3001/tableros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nuevoTablero, profesor }),
    });
    if (res.ok) {
      fetch(`http://localhost:3001/tableros?profesor=${profesor}`)
        .then((res) => res.json())
        .then((data) => setTableros(Array.isArray(data) ? data : []));
      setNuevoTablero({ nombre: "", ip: "", topico: "", formato: "" });
    }
  };

  // Seleccionar un tablero
  const handleSeleccionarTablero = (tablero) => {
    setTableroSeleccionado(tablero);
  };

  const handleEliminarTablero = async (id) => {
    const res = await fetch(`http://localhost:3001/tableros/${id}`, {
        method: "DELETE",
    });
    if (res.ok) {
        setTableros(tableros.filter((t) => t.id !== id));
        if (tableroSeleccionado && tableroSeleccionado.id === id) {
        setTableroSeleccionado(null);
        }
    }
    };

  const handleJsonCampoChange = (idx, field, value) => {
    const nuevosCampos = [...jsonCampos];
    nuevosCampos[idx][field] = value;
    setJsonCampos(nuevosCampos);
  };

  const agregarCampoJson = () => {
    setJsonCampos([...jsonCampos, { clave: "", valor: "" }]);
  };

  const eliminarCampoJson = (idx) => {
    setJsonCampos(jsonCampos.filter((_, i) => i !== idx));
  };

  // Enviar mensaje al tablero seleccionado
  const handleEnviarMensaje = async () => {
    if (!tableroSeleccionado) return;

    if (tableroSeleccionado.formato === "String") {
      if (!mensaje.trim() || mensaje.length === 0) {
        alert("El mensaje no puede estar vacío o solo contener espacios.");
        return;
      }
      await fetch("http://localhost:3001/enviar-mqtt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: tableroSeleccionado.ip,
          topic: tableroSeleccionado.topico,
          mensaje,
        }),
      });
      setMensaje("");
    } else if (tableroSeleccionado.formato === "JSON") {
      // Validar que no haya claves vacías y que haya al menos un campo
      if (
        jsonCampos.length === 0 ||
        jsonCampos.some((campo) => !campo.clave.trim())
      ) {
        alert("Todos los campos JSON deben tener una clave.");
        return;
      }
      // Construir el objeto JSON
      const mensajeJson = {};
      jsonCampos.forEach((campo) => {
        mensajeJson[campo.clave] = campo.valor;
      });
      await fetch("http://localhost:3001/enviar-mqtt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: tableroSeleccionado.ip,
          topic: tableroSeleccionado.topico,
          mensaje: JSON.stringify(mensajeJson),
        }),
      });
      setJsonCampos([{ clave: "", valor: "" }]);
    }
  };

  return (
    <div className={styles["tableros-container"]}>
      <h1>Tableros</h1>

      {/* Formulario para guardar configuración */}
      <form onSubmit={handleGuardarTablero} className={styles.form}>
        <h2>Agregar nuevo tablero</h2>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={nuevoTablero.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ip"
          placeholder="IP"
          value={nuevoTablero.ip}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="topico"
          placeholder="Tópico"
          value={nuevoTablero.topico}
          onChange={handleChange}
          required
        />
        <select
          className={styles["formato-select"]}
          name="formato"
          value={nuevoTablero.formato}
          onChange={handleChange}
          required
        >
          <option value="" disabled hidden>Selecciona el formato</option>
          <option value="String">String</option>
          <option value="JSON">JSON</option>
        </select>
        <button type="submit">Guardar tablero</button>
      </form>

      {/* Lista de tableros guardados */}
      <div className={styles.lista}>
        <h2>Tableros guardados</h2>
        {tableros.length === 0 && <p>No hay tableros guardados.</p>}
        <ul>
            {tableros.map((tablero, idx) => (
                <li key={tablero.id || idx}>
                <button onClick={() => handleSeleccionarTablero(tablero)}>
                    {tablero.nombre} ({tablero.ip})
                </button>
                <button
                  className={styles.eliminar}
                  onClick={() => handleEliminarTablero(tablero.id)}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Eliminar
                </button>
                </li>
            ))}
        </ul>
      </div>

      {/* Enviar mensaje al tablero seleccionado */}
      {tableroSeleccionado && (
        <div className={styles.enviar}>
          <h2>Enviar mensaje a: {tableroSeleccionado.nombre}</h2>
          {tableroSeleccionado.formato === "String" ? (
            <>
              <input
                type="text"
                placeholder="Mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </>
          ) : (
            <>
              {jsonCampos.map((campo, idx) => (
                <div key={idx} className={styles["campo-json-row"]}>
                  <input
                    type="text"
                    placeholder="Clave"
                    value={campo.clave}
                    onChange={(e) => handleJsonCampoChange(idx, "clave", e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Valor"
                    value={campo.valor}
                    onChange={(e) => handleJsonCampoChange(idx, "valor", e.target.value)}
                    required
                  />
                  {jsonCampos.length > 1 && (
                    <button
                      type="button"
                      className={styles["campo-json-eliminar"]}
                      onClick={() => eliminarCampoJson(idx)}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
              {jsonCampos.length > 0 && (
                <hr className={styles["json-divider"]} />
              )}
              <button type="button" onClick={agregarCampoJson}>
                Agregar campo
              </button>
            </>
          )}
          <button onClick={handleEnviarMensaje}>Enviar</button>
        </div>
      )}
    </div>
  );
};

export default Tableros;