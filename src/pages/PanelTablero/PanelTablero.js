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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ip, setIp] = useState("");
  const [topic, setTopico] = useState("");
  const [mensajeModal, setMensajeModal] = useState("");
  // Nuevo estado para el color del texto
  const [colorTexto, setColorTexto] = useState("#CC0000"); // Color rojo por defecto (--color-primario)

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

  const enviarAMQTT = async () => {
    if (!ip || !topic || !mensajeModal) {
      mostrarNotificacion("Completa todos los campos del modal", "advertencia");
      return;
    }
    setCargando(true);
    try {
      const response = await fetch(`${BACKEND_URL}/enviar-mqtt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip,
          topic,
          mensaje: mensajeModal,
        }),
      });
      if (response.ok) {
        mostrarNotificacion("Mensaje enviado al otro tablero", "exito");
        setModalAbierto(false);
        setIp("");
        setTopico("");
        setMensajeModal("");
      } else {
        mostrarNotificacion("Error al enviar el mensaje", "error");
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
      mostrarNotificacion(
        "Selecciona un estado antes de enviar",
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

      {modalAbierto && (
      <div className={styles["modal-overlay"]}>
        <div className={styles["modal"]}>
          <h2>Enviar mensaje MQTT</h2>
          <label>
            IP:
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="Ej: 192.168.1.100"
            />
          </label>
          <label>
            Tópico:
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopico(e.target.value)}
              placeholder="Ej: tablero/estado"
            />
          </label>
          <label>
            Mensaje:
            <input
              type="text"
              value={mensajeModal}
              onChange={(e) => setMensajeModal(e.target.value)}
              placeholder="Mensaje a enviar"
            />
          </label>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              className={`${styles["boton"]} ${styles["boton-enviar"]}`}
              onClick={enviarAMQTT}
            >
              Enviar
            </button>
            <button
              className={`${styles["boton"]} ${styles["boton-enviar"]}`}
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
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
                <div className={styles["campo-selector"]}>
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
                  disabled={!estado || cargando}
                >
                  <span className={styles["boton-icono"]}>📡</span>
                  Enviar al Tablero
                </button>
                <button
                  className={`${styles["boton"]} ${styles["boton-enviar"]}`}
                  onClick={() => setModalAbierto(true)}
                >
                  Enviar a otro tablero
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cargando && (
        <div className={styles["cargador-overlay"]}>
          <div className={styles["cargador-spinner"]}></div>
        </div>
      )}
    </div>
  );
};

export default PanelTablero;