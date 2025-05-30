import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "./PanelTablero.css";

const PanelTablero = () => {
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");
  const [opcionesEstado, setOpcionesEstado] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableroConectado, setTableroConectado] = useState(false);
  const [mensajeDesdeESP, setMensajeDesdeESP] = useState("");
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [estadoEnviado, setEstadoEnviado] = useState(false);
  const [ultimaPing, setUltimaPing] = useState(null);
  // Nuevo estado para el color del texto
  const [colorTexto, setColorTexto] = useState("#CC0000"); // Color rojo por defecto (--color-primario)

  const token = localStorage.getItem("token");
  const profesor = token ? jwtDecode(token).mail : null;

  // Conexión WebSocket al backend
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("✅ WebSocket conectado");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      console.log("📩 Mensaje recibido desde ESP32:", event.data);
      setMensajeDesdeESP(event.data);
      setUltimaPing(new Date()); // Actualizar timestamp de última comunicación
      setTableroConectado(true); // El tablero está conectado si recibimos mensajes
      
      // Animación de nuevo mensaje
      const respuestaElement = document.querySelector('.respuesta-esp');
      if (respuestaElement) {
        respuestaElement.classList.add('nuevo-mensaje');
        setTimeout(() => {
          respuestaElement.classList.remove('nuevo-mensaje');
        }, 1000);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ Error WebSocket:", error);
      setTableroConectado(false); // Si hay error, el tablero está desconectado
      mostrarNotificacion("Error de conexión con el dispositivo", "error");
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket desconectado");
      setSocket(null);
      setTableroConectado(false);
    };

    // Verificar periódicamente si el tablero está activo (cada 10 segundos)
    const intervalo = setInterval(() => {
      // Si no hemos recibido un ping en los últimos 15 segundos, consideramos que el tablero está desconectado
      if (ultimaPing && (new Date() - ultimaPing) > 15000) {
        setTableroConectado(false);
      }
      
      // Enviar un ping para verificar si el tablero responde
      if (ws.readyState === WebSocket.OPEN) {
        try {
          console.log("📤 Ping enviado al ESP32");
        } catch (error) {
          console.error("Error al enviar ping:", error);
        }
      }
    }, 10000);

    return () => {
      ws.close();
    };
  }, [ultimaPing]);

  // Obtener estados del profesor
  useEffect(() => {
    const fetchEstados = async () => {
      if (!profesor) return;
      
      setCargando(true);
      try {
        const response = await fetch(
          `http://localhost:3001/estados?profesor=${profesor}`
        );
        if (response.ok) {
          const data = await response.json();
          setOpcionesEstado(data.map((item) => item.estado));
        } else {
          mostrarNotificacion("Error al cargar los estados guardados", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión con el servidor", "error");
      } finally {
        setCargando(false);
      }
    };

    fetchEstados();
  }, [profesor]);

  const manejarCambioMensaje = (e) => setMensaje(e.target.value);
  const manejarCambioEstado = (e) => setEstado(e.target.value);

  // Manejador para el cambio de color
  const manejarCambioColor = (e) => {
    setColorTexto(e.target.value);
  };

  const guardarEstado = async () => {
    if (!mensaje && !estado) {
      mostrarNotificacion("Por favor, completa al menos uno de los campos", "advertencia");
      return;
    }

    setCargando(true);
    try {
      const nuevoEstado = estado || mensaje;
      const response = await fetch("http://localhost:3001/estados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          profesor,
        }),
      });

      if (response.ok) {
        mostrarNotificacion("Estado guardado correctamente", "exito");
        setOpcionesEstado((prev) => [...prev, nuevoEstado]);
        limpiarCampos();
      } else {
        const errorData = await response.json();
        mostrarNotificacion(`Error: ${errorData.error}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  const editarEstado = async (estadoOriginal, nuevoEstado) => {
    setCargando(true);
    try {
      const response = await fetch("http://localhost:3001/estados", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estadoOriginal, nuevoEstado, profesor }),
      });

      if (response.ok) {
        mostrarNotificacion("Estado editado correctamente", "exito");
        setOpcionesEstado((prev) =>
          prev.map((estado) =>
            estado === estadoOriginal ? nuevoEstado : estado
          )
        );
      } else {
        const errorData = await response.json();
        mostrarNotificacion(`Error: ${errorData.error}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  const eliminarEstado = async (estado) => {
    setCargando(true);
    try {
      const response = await fetch("http://localhost:3001/estados", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado, profesor }),
      });

      if (response.ok) {
        mostrarNotificacion("Estado eliminado correctamente", "exito");
        setOpcionesEstado((prev) => prev.filter((opcion) => opcion !== estado));
      } else {
        const errorData = await response.json();
        mostrarNotificacion(`Error: ${errorData.error}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  // Modificamos la función de envío para incluir el color
  const aHistorial = async () => {
    if (!estado) {
      mostrarNotificacion("Selecciona un estado antes de enviar", "advertencia");
      return;
    }

    setCargando(true);
    const fechaActual = new Date()
      .toLocaleString("en-CA", {
        timeZone: "America/Santiago",
        hour12: false,
      })
      .replace(",", "")
      .replace("/", "-")
      .replace("/", "-");

    try {
      const response = await fetch("http://localhost:3001/historial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profesor,
          estado,
          fecha: fechaActual,
        }),
      });

      if (response.ok) {
        mostrarNotificacion("Mensaje enviado correctamente", "exito");
        setEstadoEnviado(true);
        
        // Enviar al ESP32 (agregamos el color como parte del mensaje)
        if (socket && socket.readyState === WebSocket.OPEN) {
          // Formato: COLOR:MENSAJE (ej: "#FF0000:Hola mundo")
          socket.send(`${colorTexto}:${estado}`);
          console.log(`📤 Estado enviado al ESP32: ${colorTexto}:${estado}`);
          
          // Animación para mostrar envío
          const previsualizacionElement = document.querySelector('.previsualizacion');
          if (previsualizacionElement) {
            previsualizacionElement.classList.add('enviando');
            setTimeout(() => {
              previsualizacionElement.classList.remove('enviando');
            }, 1000);
          }
        }
      } else {
        const errorData = await response.json();
        mostrarNotificacion(`Error: ${errorData.error}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  const limpiarCampos = () => {
    setMensaje("");
    setEstado("");
    setEstadoEnviado(false);
  };
  
  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 5000);
  };

  return (
    <div className="contenedor-principal">
      {notificacion && (
        <div className={`notificacion notificacion-${notificacion.tipo}`}>
          <div className="notificacion-icono">
            {notificacion.tipo === "exito" && "✅"}
            {notificacion.tipo === "error" && "❌"}
            {notificacion.tipo === "advertencia" && "⚠️"}
          </div>
          <div className="notificacion-mensaje">{notificacion.mensaje}</div>
          <button onClick={() => setNotificacion(null)} className="notificacion-cerrar">×</button>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="dashboard-titulo">
          <h1 className="titulo-bienvenida">
            <span className="titulo-principal">Panel de Control</span>
            <span className="mensaje-bienvenida">
              <span className="emoji-icon">👋</span> 
              ¡Bienvenido profesor <span className="nombre-profesor">{profesor?.split("@")[0]}</span>!
            </span>
          </h1>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-valor">{opcionesEstado.length}</div>
            <div className="stat-label">Estados Guardados</div>
          </div>
          <div className="stat-card">
            <div className={`stat-indicador ${socket ? "conectado" : "desconectado"}`}>●</div>
            <div className="stat-label">{socket ? "Servidor Conectado" : "Servidor Desconectado"}</div>
          </div>
          <div className="stat-card">
            <div className={`stat-indicador ${tableroConectado ? "conectado" : "desconectado"}`}>●</div>
            <div className="stat-label">{tableroConectado ? "Tablero Conectado" : "Tablero Desconectado"}</div>
          </div>
        </div>
      </div>

      <div className="panel-tablero">
        <div className="panel-header">
          <h2 className="titulo-panel">Centro de Gestión de Estados</h2>
          <div className="fecha-actual">{new Date().toLocaleDateString()}</div>
        </div>
        
        <div className="panel-grid">
          <div className="panel-columna">
            <div className="tarjeta tarjeta-seleccion">
              <div className="tarjeta-header">
                <h3>Seleccionar Estado</h3>
                <span className="tarjeta-badge">{opcionesEstado.length} guardados</span>
              </div>
              
              <div className="campo-formulario">
                <label htmlFor="select-estado">
                  <span className="campo-icono">📋</span>
                  Selecciona un estado guardado:
                </label>
                <div className="campo-selector">
                  <select 
                    id="select-estado" 
                    value={estado} 
                    onChange={manejarCambioEstado}
                    disabled={cargando}
                  >
                    <option value="">-- Seleccione un estado --</option>
                    {opcionesEstado.map((opcion, index) => (
                      <option key={index} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="tarjeta-separador">o</div>
              
              <div className="campo-formulario">
                <label htmlFor="input-mensaje">
                  <span className="campo-icono">✍️</span>
                  Crea un nuevo mensaje:
                </label>
                <textarea
                  id="input-mensaje"
                  value={mensaje}
                  onChange={manejarCambioMensaje}
                  placeholder="Escribe tu mensaje personalizado aquí..."
                  rows="4"
                  disabled={estado !== "" || cargando}
                ></textarea>
                <div className="campo-ayuda">El mensaje se mostrará en el tablero LED</div>
              </div>
              
              <div className="tarjeta-footer">
                <button
                  className="boton boton-guardar"
                  onClick={guardarEstado}
                  disabled={estado !== "" || !mensaje || cargando}
                >
                  <span className="boton-icono">💾</span>
                  Guardar Nuevo Estado
                </button>
                <button className="boton boton-limpiar" onClick={limpiarCampos} disabled={cargando}>
                  <span className="boton-icono">🧹</span>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
          
          <div className="panel-columna">
            <div className="tarjeta tarjeta-visualizacion">
              <div className="tarjeta-header">
                <h3>Previsualización</h3>
                <div className="indicador-estado">
                  {estadoEnviado ? "✅ Enviado" : "🔄 Pendiente"}
                </div>
              </div>
              
              {/* Agregamos el selector de color antes de la previsualización */}
              <div className="color-selector">
                <label htmlFor="color-texto">
                  <span className="campo-icono">🎨</span>
                  Color del texto:
                </label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    id="color-texto"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className="color-picker"
                  />
                  <input 
                    type="text"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className="color-value-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Código de color hexadecimal (ej: #FF0000)"
                  />
                </div>
              </div>
              
              <div className="previsualizacion">
                <div className="previsualizacion-marco">
                  <div className="previsualizacion-led">
                    <div className="texto-contenedor">
                      <p 
                        className="texto-desplazamiento"
                        style={{ color: colorTexto }} // Aplicamos el color seleccionado
                      >
                        {estado || mensaje || "Previsualización del mensaje"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tarjeta-footer">
                <button className="boton boton-enviar" onClick={aHistorial} disabled={!estado || cargando}>
                  <span className="boton-icono">📡</span>
                  Enviar al Tablero
                </button>
              </div>
            </div>
            
            {mensajeDesdeESP && (
              <div className="tarjeta tarjeta-respuesta">
                <div className="tarjeta-header">
                  <h3>Respuesta del Dispositivo</h3>
                  <div className="indicador-tiempo">Reciente</div>
                </div>
                <div className="respuesta-esp">
                  <div className="respuesta-icono">🤖</div>
                  <div className="respuesta-mensaje">{mensajeDesdeESP}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {cargando && (
        <div className="cargador-overlay">
          <div className="cargador-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default PanelTablero;
