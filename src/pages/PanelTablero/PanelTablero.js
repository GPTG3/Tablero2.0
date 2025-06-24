import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import styles from "./PanelTablero.module.css"; // Asegúrate de tener un archivo CSS para estilos
import { useWebSocket } from "../../context/WebSocketContext";
import { BACKEND_URL } from "../../config";

const PanelTablero = () => {
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");
  const [opcionesEstado, setOpcionesEstado] = useState([]);
  const [tableroConectado, setTableroConectado] = useState(false);
  const [mensajeDesdeESP, setMensajeDesdeESP] = useState("");
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [estadoEnviado, setEstadoEnviado] = useState(false);
  const [ultimaPing, setUltimaPing] = useState(null);
  // Nuevo estado para el color del texto
  const [colorTexto, setColorTexto] = useState("#CC0000"); // Color rojo por defecto (--color-primario)
  const [modalAbierto, setModalAbierto] = useState(false); // Estado para controlar la apertura del modal
  const [estadoEditando, setEstadoEditando] = useState(""); // Estado para almacenar el estado que se está editando
  const [estadoOriginal, setEstadoOriginal] = useState("");
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [estadoAEliminar, setEstadoAEliminar] = useState("");
  const [mensajeProgramado, setMensajeProgramado] = useState("");
  const [horaProgramada, setHoraProgramada] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [mensajesProgramados, setMensajesProgramados] = useState([]);
  const [editandoMensaje, setEditandoMensaje] = useState(null); // {mensaje, hora, color}
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#CC0000");

  const token = localStorage.getItem("token");
  const profesor = token ? jwtDecode(token).mail : null;
  const socket = useWebSocket();

  // Conexión WebSocket al backend
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      console.log("📩 Mensaje recibido desde ESP32:", event.data);
      setMensajeDesdeESP(event.data);
      setUltimaPing(new Date());
      setTableroConectado(true);

      // Animación de nuevo mensaje
      const respuestaElement = document.querySelector(".respuesta-esp");
      if (respuestaElement) {
        respuestaElement.classList.add("nuevo-mensaje");
        setTimeout(() => {
          respuestaElement.classList.remove("nuevo-mensaje");
        }, 1000);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ Error WebSocket:", error);
      setTableroConectado(false);
      mostrarNotificacion("Error de conexión con el dispositivo", "error");
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket desconectado");
      setTableroConectado(false);
    };

    // Verificar periódicamente si el tablero está activo (cada 10 segundos)
    const intervalo = setInterval(() => {
      if (ultimaPing && new Date() - ultimaPing > 15000) {
        setTableroConectado(false);
      }
      if (socket.readyState === WebSocket.OPEN) {
        try {
          console.log("📤 Ping enviado al ESP32");
        } catch (error) {
          console.error("Error al enviar ping:", error);
        }
      }
    }, 10000);

    return () => {
      clearInterval(intervalo);
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
    };
  }, [socket, ultimaPing]);

  // Obtener estados del profesor
  useEffect(() => {
    const fetchEstados = async () => {
      if (!profesor) return;

      setCargando(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/estados?profesor=${profesor}`
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

  // Obtener mensajes programados al montar y cuando se programe uno nuevo
  useEffect(() => {
    if (!profesor) return;
    const fetchMensajesProgramados = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/programar-mensaje?profesor=${profesor}`
        );
        if (res.ok) {
          const data = await res.json();
          setMensajesProgramados(Array.isArray(data) ? data : []);
        }
      } catch {
        setMensajesProgramados([]);
      }
    };
    fetchMensajesProgramados();
  }, [profesor, cargando]); // recarga cuando cargando cambia (tras programar/eliminar)

  const manejarCambioMensaje = (e) => setMensaje(e.target.value);
  const manejarCambioEstado = (e) => setEstado(e.target.value);

  // Manejador para el cambio de color
  const manejarCambioColor = (e) => {
    setColorTexto(e.target.value);
  };

  const guardarEstado = async () => {
    if (!mensaje && !estado) {
      mostrarNotificacion(
        "Por favor, completa al menos uno de los campos",
        "advertencia"
      );
      return;
    }

    setCargando(true);
    try {
      const nuevoEstado = estado || mensaje;
      const response = await fetch(`${BACKEND_URL}/estados`, {
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
      const response = await fetch(`${BACKEND_URL}/estados`, {
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
      const response = await fetch(`${BACKEND_URL}/estados`, {
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
    const mensajeAEnviar = estado || mensaje;
    if (!mensajeAEnviar) {
      mostrarNotificacion(
        "Escribe un mensaje o selecciona un estado antes de enviar",
        "advertencia"
      );
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
      const response = await fetch(`${BACKEND_URL}/historial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profesor,
          estado: mensajeAEnviar,
          fecha: fechaActual,
        }),
      });

      if (response.ok) {
        mostrarNotificacion("Mensaje enviado correctamente", "exito");
        setEstadoEnviado(true);

        // Enviar al ESP32 (agregamos el color como parte del mensaje)
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(`${colorTexto}:${mensajeAEnviar}`);
          console.log(`📤 Estado enviado al ESP32: ${colorTexto}:${mensajeAEnviar}`);

          const previsualizacionElement =
            document.querySelector(".previsualizacion");
          if (previsualizacionElement) {
            previsualizacionElement.classList.add("enviando");
            setTimeout(() => {
              previsualizacionElement.classList.remove("enviando");
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

  // Función para abrir el modal de edición
  const abrirModalEdicion = (estado) => {
    setEstadoOriginal(estado); // <-- Guarda el original
    setEstadoEditando(estado);
    setModalAbierto(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setEstadoEditando("");
  };

  // Función para abrir el modal de eliminación
  const abrirModalEliminar = (estado) => {
    setEstadoAEliminar(estado);
    setModalEliminarAbierto(true);
  };

  // Función para cerrar el modal de eliminación
  const cerrarModalEliminar = () => {
    setModalEliminarAbierto(false);
    setEstadoAEliminar("");
  };

  // Desactivar scroll cuando un modal está abierto
  useEffect(() => {
    if (modalAbierto || modalEliminarAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Limpieza al desmontar
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto, modalEliminarAbierto]);

  // Eliminar mensaje programado
  const eliminarMensajeProgramado = async (mensaje, hora) => {
    setCargando(true);
    try {
      const res = await fetch(`${BACKEND_URL}/programar-mensaje`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesor, mensaje, hora }),
      });
      if (res.ok) {
        setMensajesProgramados((prev) =>
          prev.filter((m) => !(m.mensaje === mensaje && m.hora === hora))
        );
        mostrarNotificacion("Mensaje programado eliminado", "exito");
      } else {
        mostrarNotificacion("No se pudo eliminar", "error");
      }
    } catch {
      mostrarNotificacion("Error de conexión", "error");
    } finally {
      setCargando(false);
    }
  };

  // Al hacer clic en "Editar"
  const abrirEdicionMensaje = (m) => {
    setEditandoMensaje(m);
    setNuevoMensaje(m.mensaje);
    setNuevoColor(m.color);
  };

  // Guardar cambios
  const guardarEdicionMensaje = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${BACKEND_URL}/programar-mensaje`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profesor,
          mensajeOriginal: editandoMensaje.mensaje,
          horaOriginal: editandoMensaje.hora,
          mensajeNuevo: nuevoMensaje,
          colorNuevo: nuevoColor,
        }),
      });
      if (res.ok) {
        mostrarNotificacion("Mensaje programado editado", "exito");
        setEditandoMensaje(null);
        setMensajesProgramados((prev) =>
          prev.map((m) =>
            m.mensaje === editandoMensaje.mensaje && m.hora === editandoMensaje.hora
              ? { ...m, mensaje: nuevoMensaje, color: nuevoColor }
              : m
          )
        );
      } else {
        const error = await res.json();
        mostrarNotificacion(error.error, "error");
      }
    } catch {
      mostrarNotificacion("Error de conexión", "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles["contenedor-principal"]}>
      {notificacion && (
        <div
          className={`${styles["notificacion"]} ${
            styles[`notificacion-${notificacion.tipo}`]
          }`}
        >
          <div className={styles["notificacion-icono"]}>
            {notificacion.tipo === "exito" && "✅"}
            {notificacion.tipo === "error" && "❌"}
            {notificacion.tipo === "advertencia" && "⚠️"}
          </div>
          <div className={styles["notificacion-mensaje"]}>
            {notificacion.mensaje}
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className={styles["notificacion-cerrar"]}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles["dashboard-header"]}>
        <div className={styles["dashboard-titulo"]}>
          <h1 className={styles["titulo-bienvenida"]}>
            <span className={styles["titulo-principal"]}>Panel de Control</span>
            <span className={styles["mensaje-bienvenida"]}>
              <span className={styles["emoji-icon"]}>👋</span>
              ¡Bienvenido profesor{" "}
              <span className={styles["nombre-profesor"]}>
                {profesor?.split("@")[0]}
              </span>
              !
            </span>
          </h1>
        </div>

        <div className={styles["dashboard-stats"]}>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-valor"]}>{opcionesEstado.length}</div>
            <div className={styles["stat-label"]}>Estados Guardados</div>
          </div>
          <div className={styles["stat-card"]}>
            <div
              className={`${styles["stat-indicador"]} ${
                socket ? styles["conectado"] : styles["desconectado"]
              }`}
            >
              ●
            </div>
            <div className={styles["stat-label"]}>
              {socket ? "Servidor Conectado" : "Servidor Desconectado"}
            </div>
          </div>
          <div className={styles["stat-card"]}>
            <div
              className={`${styles["stat-indicador"]} ${
                tableroConectado ? styles["conectado"] : styles["desconectado"]
              }`}
            >
              ●
            </div>
            <div className={styles["stat-label"]}>
              {tableroConectado ? "Tablero Conectado" : "Tablero Desconectado"}
            </div>
          </div>
        </div>
      </div>

      <div className={styles["panel-tablero"]}>
        <div className={styles["panel-header"]}>
          <h2 className={styles["titulo-panel"]}>
            Centro de Gestión de Estados
          </h2>
          <div className={styles["fecha-actual"]}>
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className={styles["panel-grid"]}>
          <div className={styles["panel-columna"]}>
            <div
              className={`${styles["tarjeta"]} ${styles["tarjeta-seleccion"]}`}
            >
              <div className={styles["tarjeta-header"]}>
                <h3>Seleccionar Estado</h3>
                <span className={styles["tarjeta-badge"]}>
                  {opcionesEstado.length} guardados
                </span>
              </div>

              <div className={styles["campo-formulario"]}>
                <label htmlFor="select-estado">
                  <span className={styles["campo-icono"]}>📋</span>
                  Selecciona un estado guardado:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                  <button
                    className={`${styles["boton"]} ${styles["boton-editar"]}`}
                    onClick={() => {
                      if (!estado) return;
                      abrirModalEdicion(estado);
                    }}
                    disabled={!estado || cargando}
                    title="Editar estado seleccionado"
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles["boton"]} ${styles["boton-eliminar"]}`}
                    onClick={() => {
                      if (!estado) return;
                      abrirModalEliminar(estado);
                    }}
                    disabled={!estado || cargando}
                    title="Eliminar estado seleccionado"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className={styles["tarjeta-separador"]}>o</div>

              <div className={styles["campo-formulario"]}>
                <label htmlFor="input-mensaje">
                  <span className={styles["campo-icono"]}>✍️</span>
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
                <div className={styles["campo-ayuda"]}>
                  El mensaje se mostrará en el tablero LED
                </div>
              </div>

              <div className={styles["tarjeta-footer"]}>
                <button
                  className={`${styles["boton"]} ${styles["boton-guardar"]}`}
                  onClick={guardarEstado}
                  disabled={estado !== "" || !mensaje || cargando}
                >
                  <span className={styles["boton-icono"]}>💾</span>
                  Guardar Nuevo Estado
                </button>
                <button
                  className={`${styles["boton"]} ${styles["boton-limpiar"]}`}
                  onClick={limpiarCampos}
                  disabled={cargando}
                >
                  <span className={styles["boton-icono"]}>🧹</span>
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <div className={styles["panel-columna"]}>
            <div
              className={`${styles["tarjeta"]} ${styles["tarjeta-visualizacion"]}`}
            >
              <div className={styles["tarjeta-header"]}>
                <h3>Previsualización</h3>
                <div className={styles["indicador-estado"]}>
                  {estadoEnviado ? "✅ Enviado" : "🔄 Pendiente"}
                </div>
              </div>

              <div className={styles["color-selector"]}>
                <label htmlFor="color-texto">
                  <span className={styles["campo-icono"]}>🎨</span>
                  Color del texto:
                </label>
                <div className={styles["color-picker-container"]}>
                  <input
                    type="color"
                    id="color-texto"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className={styles["color-picker"]}
                  />
                  <input
                    type="text"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className={styles["color-value-input"]}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Código de color hexadecimal (ej: #FF0000)"
                  />
                </div>
              </div>

              <div className={styles["previsualizacion"]}>
                <div className={styles["previsualizacion-marco"]}>
                  <div className={styles["previsualizacion-led"]}>
                    <div className={styles["texto-contenedor"]}>
                      <p
                        className={styles["texto-desplazamiento"]}
                        style={{ color: colorTexto }}
                      >
                        {estado || mensaje || "Previsualización del mensaje"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["tarjeta-footer"]}>
                <button
                  className={`${styles["boton"]} ${styles["boton-enviar"]}`}
                  onClick={aHistorial}
                  disabled={!(estado || mensaje) || cargando}
                >
                  <span className={styles["boton-icono"]}>📡</span>
                  Enviar al Tablero
                </button>
              </div>
            </div>
          </div>

          <div className={styles["panel-columna"]}>
            <div className={styles["tarjeta"]}>
              <div className={styles["tarjeta-header"]}>
                <h3>
                  <span className={styles["campo-icono"]}>⏰</span>
                  Programar mensaje
                </h3>
                <span className={styles["tarjeta-badge"]}>Automático</span>
              </div>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="mensaje-programado">
                  <span className={styles["campo-icono"]}>💬</span>
                  Mensaje:
                </label>
                <textarea
                  id="mensaje-programado"
                  value={mensajeProgramado}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) setMensajeProgramado(e.target.value);
                  }}
                  placeholder="Escribe el mensaje que se enviará automáticamente..."
                  className={styles["input"]}
                  rows={3}
                  maxLength={100}
                  required
                />
                <div className={styles["campo-ayuda"]}>
                  {mensajeProgramado.length}/100 caracteres
                </div>
              </div>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="fecha-programada">
                  <span className={styles["campo-icono"]}>📅</span>
                  Día de envío:
                </label>
                <input
                  id="fecha-programada"
                  type="date"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className={styles["input"]}
                  required
                />
                <div className={styles["campo-ayuda"]}>
                  Selecciona el día en que se enviará el mensaje.
                </div>
              </div>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="hora-programada">
                  <span className={styles["campo-icono"]}>🕒</span>
                  Hora de envío:
                </label>
                <div className={styles["input-hora-wrapper"]}>
                  <input
                    id="hora-programada"
                    type="time"
                    value={horaProgramada}
                    onChange={(e) => setHoraProgramada(e.target.value)}
                    className={styles["input"]}
                    required
                  />
                  <span className={styles["input-hora-icono"]}>⏰</span>
                </div>
                <div className={styles["campo-ayuda"]}>
                  Selecciona la hora exacta en la que se enviará el mensaje.
                </div>
              </div>
              <div className={styles["campo-formulario"]}>
                <label>
                  <span className={styles["campo-icono"]}>🎨</span>
                  Color del texto:
                </label>
                <div className={styles["color-picker-container"]}>
                  <input
                    type="color"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className={styles["color-picker"]}
                  />
                  <input
                    type="text"
                    value={colorTexto}
                    onChange={manejarCambioColor}
                    className={styles["color-value-input"]}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Código de color hexadecimal (ej: #FF0000)"
                  />
                </div>
              </div>
              <div className={styles["tarjeta-footer"]}>
                <button
                  className={`${styles["boton"]} ${styles["boton-guardar"]}`}
                  onClick={async () => {
                    if (!mensajeProgramado || !horaProgramada) {
                      mostrarNotificacion("Completa ambos campos", "advertencia");
                      return;
                    }
                    setCargando(true);
                    try {
                      const res = await fetch(`${BACKEND_URL}/programar-mensaje`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          profesor,
                          mensaje: mensajeProgramado,
                          fecha: fechaProgramada,
                          hora: horaProgramada,
                          color: colorTexto,
                        }),
                      });
                      if (res.ok) {
                        mostrarNotificacion("Mensaje programado correctamente", "exito");
                        setMensajeProgramado("");
                        setHoraProgramada("");
                      } else {
                        const error = await res.json();
                        mostrarNotificacion(error.error, "error");
                      }
                    } catch {
                      mostrarNotificacion("Error de conexión", "error");
                    } finally {
                      setCargando(false);
                    }
                  }}
                  disabled={cargando}
                >
                  <span className={styles["boton-icono"]}>⏳</span>
                  Programar mensaje
                </button>
              </div>
            </div>
          </div>

          <div className={styles["panel-columna"]}>
            <div className={styles["tarjeta"]}>
              <div className={styles["tarjeta-header"]}>
                <h3>
                  <span className={styles["campo-icono"]}>📅</span>
                  Mensajes Programados
                </h3>
              </div>
              {mensajesProgramados.length === 0 ? (
                <div style={{ padding: "1rem", color: "#888" }}>
                  No hay mensajes programados.
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {mensajesProgramados.map((m, idx) => (
                    <li key={idx} style={{ borderBottom: "1px solid #eee", padding: "0.5rem 0" }}>
                      <div>
                        <strong>{m.mensaje}</strong>
                        <div style={{ fontSize: "0.95em", color: "#666" }}>
                          {m.fecha} {m.hora} <span style={{ color: m.color }}>{m.color}</span>
                        </div>
                      </div>
                      <div className={styles["botones-programado"]}>
                        <button
                          className={`${styles["boton"]} ${styles["boton-editar"]}`}
                          onClick={() => abrirEdicionMensaje(m)}
                          disabled={cargando}
                        >
                          Editar
                        </button>
                        <button
                          className={`${styles["boton"]} ${styles["boton-eliminar"]}`}
                          onClick={() => eliminarMensajeProgramado(m.mensaje, m.hora)}
                          disabled={cargando}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {cargando && (
        <div className={styles["cargador-overlay"]}>
          <div className={styles["cargador-spinner"]}></div>
        </div>
      )}

      {/* Modal para edición de estados */}
      {modalAbierto && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>Editar Estado</span>
              <button
                className={styles["modal-close"]}
                onClick={cerrarModal}
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className={styles["modal-contenido"]}>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="input-estado-edit">
                  <span className={styles["campo-icono"]}>✍️</span>
                  Edita tu estado:
                </label>
                <textarea
                  id="input-estado-edit"
                  value={estadoEditando}
                  onChange={(e) => setEstadoEditando(e.target.value)}
                  placeholder="Escribe tu nuevo estado aquí..."
                  rows="4"
                ></textarea>
                <div className={styles["campo-ayuda"]}>
                  El estado se actualizará en el tablero LED
                </div>
              </div>

              <div className={styles["modal-footer"]}>
                <button
                  className={`${styles["boton"]} ${styles["boton-guardar"]}`}
                  onClick={async () => {
                    if (!estadoEditando) {
                      mostrarNotificacion(
                        "El estado no puede estar vacío",
                        "advertencia"
                      );
                      return;
                    }

                    setCargando(true);
                    try {
                      // Lógica para guardar el estado editado
                      const response = await fetch(`${BACKEND_URL}/estados`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          estadoOriginal,
                          nuevoEstado: estadoEditando,
                          profesor,
                        }),
                      });

                      if (response.ok) {
                        mostrarNotificacion("Estado actualizado", "exito");
                        setOpcionesEstado((prev) =>
                          prev.map((estado) =>
                            estado === estadoOriginal ? estadoEditando : estado
                          )
                        );
                        cerrarModal();
                      } else {
                        const errorData = await response.json();
                        mostrarNotificacion(`Error: ${errorData.error}`, "error");
                      }
                    } catch (error) {
                      mostrarNotificacion("Error de conexión", "error");
                    } finally {
                      setCargando(false);
                    }
                  }}
                  disabled={cargando}
                >
                  <span className={styles["boton-icono"]}>✅</span>
                  Guardar Cambios
                </button>
                <button
                  className={`${styles["boton"]} ${styles["boton-cancelar"]}`}
                  onClick={cerrarModal}
                  disabled={cargando}
                >
                  <span className={styles["boton-icono"]}>❌</span>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para eliminación de estados */}
      {modalEliminarAbierto && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>Eliminar Estado</span>
              <button
                className={styles["modal-close"]}
                onClick={cerrarModalEliminar}
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className={styles["modal-contenido"]}>
              <p>
                ¿Estás seguro de que deseas eliminar el estado{" "}
                <strong>{estadoAEliminar}</strong>? Esta acción no se puede
                deshacer.
              </p>
            </div>

            <div className={styles["modal-footer"]}>
              <button
                className={`${styles["boton"]} ${styles["boton-eliminar"]}`}
                onClick={async () => {
                  eliminarEstado(estadoAEliminar);
                  cerrarModalEliminar();
                }}
                disabled={cargando}
              >
                <span className={styles["boton-icono"]}>🗑️</span>
                Eliminar Estado
              </button>
              <button
                className={`${styles["boton"]} ${styles["boton-cancelar"]}`}
                onClick={cerrarModalEliminar}
                disabled={cargando}
              >
                <span className={styles["boton-icono"]}>❌</span>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para edición de mensajes programados */}
      {editandoMensaje && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>Editar Mensaje Programado</span>
              <button
                className={styles["modal-close"]}
                onClick={() => setEditandoMensaje(null)}
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className={styles["modal-contenido"]}>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="nuevo-mensaje">
                  <span className={styles["campo-icono"]}>💬</span>
                  Nuevo Mensaje:
                </label>
                <textarea
                  id="nuevo-mensaje"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe el nuevo mensaje..."
                  rows="3"
                  className={styles["input"]}
                  required
                />
              </div>
              <div className={styles["campo-formulario"]}>
                <label htmlFor="nuevo-color">
                  <span className={styles["campo-icono"]}>🎨</span>
                  Nuevo Color:
                </label>
                <div className={styles["color-picker-container"]}>
                  <input
                    type="color"
                    id="nuevo-color"
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className={styles["color-picker"]}
                  />
                  <input
                    type="text"
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className={styles["color-value-input"]}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Código de color hexadecimal (ej: #FF0000)"
                  />
                </div>
              </div>

              <div className={styles["modal-footer"]}>
                <button
                  className={`${styles["boton"]} ${styles["boton-guardar"]}`}
                  onClick={guardarEdicionMensaje}
                  disabled={cargando}
                >
                  Guardar Cambios
                </button>
                <button
                  className={`${styles["boton"]} ${styles["boton-cancelar"]}`}
                  onClick={() => setEditandoMensaje(null)}
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelTablero;