import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Importar jwtDecode
import "./PanelTablero.css";

const PanelTablero = () => {
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");
  const [opcionesEstado, setOpcionesEstado] = useState([]); // Nueva variable para las opciones de estado

  // Decodificar el token JWT para obtener el correo del profesor
  const token = localStorage.getItem("token");
  const profesor = token ? jwtDecode(token).mail : null;

  useEffect(() => {
    console.log("Correo del profesor:", profesor);

    // Obtener las opciones de estado desde la base de datos
    const fetchEstados = async () => {
      try {
        const response = await fetch("http://localhost:3001/estados");
        if (response.ok) {
          const data = await response.json();
          setOpcionesEstado(data.map((item) => item.estado)); // Extraer solo los valores de estado
        } else {
          console.error("Error al obtener los estados:", response.statusText);
        }
      } catch (error) {
        console.error("Error al obtener los estados:", error);
      }
    };

    fetchEstados();
  }, [profesor]); // Ejecutar solo una vez al montar el componente

  const manejarCambioMensaje = (e) => setMensaje(e.target.value);
  const manejarCambioEstado = (e) => setEstado(e.target.value);

  const guardarEstado = async () => {
    if (!mensaje && !estado) {
      alert("Por favor, completa al menos uno de los campos");
      return;
    }

    try {
      const nuevoEstado = estado || mensaje; // Determinar el estado a guardar
      const response = await fetch("http://localhost:3001/estados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        alert("Estado guardado correctamente");
        setOpcionesEstado((prevOpciones) => [...prevOpciones, nuevoEstado]); // Agregar el nuevo estado a la lista
        limpiarCampos();
      } else {
        const errorData = await response.json();
        alert(`Error al guardar el estado: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al guardar el estado:", error);
      alert("Ocurrió un error al intentar guardar el estado");
    }
  };

  const aHistorial = async () => {
    if (!estado) {
      alert("Por favor, selecciona un estado antes de guardar en el historial");
      return;
    }

    const fechaActual = new Date().toISOString().replace("T", " ").slice(0, 19);

    try {
      const response = await fetch("http://localhost:3001/historial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profesor, // Correo del profesor obtenido del token
          estado,
          fecha: fechaActual,
        }),
      });

      if (response.ok) {
        alert(`Registro guardado: ${profesor} | ${estado} | ${fechaActual}`);
      } else {
        const errorData = await response.json();
        alert(`Error al guardar en el historial: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al guardar en el historial:", error);
      alert("Ocurrió un error al intentar guardar en el historial");
    }
  };

  const limpiarCampos = () => {
    setMensaje("");
    setEstado("");
  };

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-bienvenida">
        Bienvenido {profesor?.split("@")[0]}!
      </h1>

      <div className="panel-tablero">
        <h2 className="titulo-panel">Panel Tablero 2.0</h2>

        <div className="campo-formulario">
          <label>Estado guardado:</label>
          <select value={estado} onChange={manejarCambioEstado}>
            <option value="">Seleccionar estado</option>
            {opcionesEstado.map((opcion, index) => (
              <option key={index} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-formulario">
          <label>Mensaje personalizado:</label>
          <textarea
            value={mensaje}
            onChange={manejarCambioMensaje}
            placeholder="Escribe tu mensaje aquí..."
            rows="4"
            disabled={estado !== ""} // Bloquear si se selecciona un estado
          ></textarea>
        </div>

        <div className="botones-container">
          <button
            className="boton-guardar"
            onClick={guardarEstado}
            disabled={estado !== ""} // Bloquear si se selecciona un estado
          >
            Guardar estado
          </button>
          <button className="boton-limpiar" onClick={limpiarCampos}>
            Limpiar
          </button>
          <button className="boton-historial" onClick={aHistorial}>
            Enviar
          </button>
        </div>

        <div className="previsualizacion">
          <p className="texto-previsualizacion">
            {estado || mensaje || "Previsualización del mensaje"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanelTablero;
