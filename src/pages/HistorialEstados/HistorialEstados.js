import React, { useState, useEffect } from "react";
import "./HistorialEstados.css";

const HistorialEstados = () => {
  const [historial, setHistorial] = useState([]);
  const [estadosGuardados, setEstadosGuardados] = useState([]); // Estados guardados en la base de datos
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  // Obtener el historial de estados
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const token = localStorage.getItem("token"); // Obtener el token del almacenamiento local
        if (!token) {
          console.error("No se encontró un token de autenticación");
          return;
        }

        const response = await fetch("http://localhost:3001/historial", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Enviar el token en el encabezado
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHistorial(data);
        } else {
          console.error("Error al obtener el historial:", response.statusText);
        }
      } catch (error) {
        console.error("Error al obtener el historial:", error);
      }
    };

    fetchHistorial();
  }, []);

  // Obtener los estados guardados en la base de datos
  useEffect(() => {
    const fetchEstadosGuardados = async () => {
      try {
        const token = localStorage.getItem("token"); // Obtener el token del almacenamiento local
        if (!token) {
          console.error("No se encontró un token de autenticación");
          return;
        }

        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decodificar el token JWT
        const profesor = decodedToken.mail; // Obtener el correo del profesor

        const response = await fetch(
          `http://localhost:3001/estados?profesor=${profesor}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (Array.isArray(data)) {
          setEstadosGuardados(data.map((item) => item.estado)); // Extraer solo los valores de estado
        } else {
          console.error("La respuesta no es un arreglo:", data);
          setEstadosGuardados([]); // Manejar el caso donde no sea un arreglo
        }
      } catch (error) {
        console.error("Error al obtener los estados guardados:", error);
      }
    };

    fetchEstadosGuardados();
  }, []);

  const abrirPopup = (estado) => setEstadoSeleccionado(estado);
  const cerrarPopup = () => setEstadoSeleccionado(null);

  const guardarEstadoEnBaseDeDatos = async () => {
    if (!estadoSeleccionado) return;

    try {
      const response = await fetch("http://localhost:3001/estados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: estadoSeleccionado.estado }),
      });

      if (response.ok) {
        alert("Estado guardado correctamente en la base de datos");
        setEstadosGuardados((prev) => [...prev, estadoSeleccionado.estado]); // Actualizar la lista de estados guardados
        cerrarPopup();
      } else {
        const errorData = await response.json();
        alert(`Error al guardar el estado: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al guardar el estado en la base de datos:", error);
      alert("Ocurrió un error al intentar guardar el estado");
    }
  };

  const eliminarEstado = () => {
    setHistorial((prev) => prev.filter((e) => e.id !== estadoSeleccionado.id));
    cerrarPopup();
  };

  return (
    <div className="history-container">
      <h2 className="text-xl font-bold mb-4 text-center">
        Historial de Estados
      </h2>

      {historial.map((estado) => (
        <div
          key={estado.id}
          className="history-card"
          onClick={() => abrirPopup(estado)}
        >
          <div className="history-title">{estado.nombre}</div>
          <span
            className={`history-status ${
              estadosGuardados.includes(estado.estado) ? "saved" : "not-saved"
            }`}
          >
            {estadosGuardados.includes(estado.estado)
              ? "Guardado"
              : "No guardado"}
          </span>
          <div className="history-datetime">{estado.fecha}</div>
        </div>
      ))}

      {estadoSeleccionado && (
        <div className="popup-fondo">
          <div className="popup">
            <h3>{estadoSeleccionado.nombre}</h3>
            <p>{estadoSeleccionado.descripcion}</p>
            <p className="popup-info">
              <strong>Estado:</strong> {estadoSeleccionado.estado} <br />
              <strong>Fecha:</strong> {estadoSeleccionado.fecha}
            </p>
            <div className="popup-botones">
              {!estadosGuardados.includes(estadoSeleccionado.estado) && (
                <button
                  className="guardar"
                  onClick={guardarEstadoEnBaseDeDatos}
                >
                  Guardar
                </button>
              )}
              <button className="eliminar" onClick={eliminarEstado}>
                Eliminar
              </button>
              <button className="cancelar" onClick={cerrarPopup}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialEstados;
