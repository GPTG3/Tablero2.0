import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import styles from "./HistorialEstados.module.css";
import { BACKEND_URL } from "../../config";

const HistorialEstados = () => {
  const [historial, setHistorial] = useState([]);
  const [estadosGuardados, setEstadosGuardados] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState(null);
  const [filtro, setFiltro] = useState("");

  // Obtener el token y decodificar
  const token = localStorage.getItem("token");
  const profesor = token ? jwtDecode(token).mail : null;

  // Obtener el historial de estados
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        if (!token) {
          mostrarNotificacion("No hay sesión activa", "error");
          return;
        }

        setCargando(true);
        const response = await fetch(`${BACKEND_URL}/historial`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHistorial(data);
        } else {
          mostrarNotificacion("Error al cargar el historial", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión con el servidor", "error");
      } finally {
        setCargando(false);
      }
    };

    fetchHistorial();
  }, [token]);

  // Obtener los estados guardados en la base de datos
  useEffect(() => {
    const fetchEstadosGuardados = async () => {
      if (!profesor) return;

      try {
        const response = await fetch(
          `${BACKEND_URL}/estados?profesor=${profesor}`,
          { method: "GET" }
        );

        const data = await response.json();

        if (Array.isArray(data)) {
          setEstadosGuardados(data.map((item) => item.estado));
        } else {
          setEstadosGuardados([]);
        }
      } catch (error) {
        console.error("Error al obtener los estados guardados:", error);
      }
    };

    fetchEstadosGuardados();
  }, [profesor]);

  const abrirPopup = (estado) => setEstadoSeleccionado(estado);
  const cerrarPopup = () => setEstadoSeleccionado(null);

  const guardarEstadoEnBaseDeDatos = async () => {
    if (!estadoSeleccionado) return;

    try {
      const response = await fetch(`${BACKEND_URL}/estados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: estadoSeleccionado.estado,
          profesor,
        }),
      });

      if (response.ok) {
        mostrarNotificacion("Estado guardado correctamente", "exito");
        setEstadosGuardados((prev) => [...prev, estadoSeleccionado.estado]);
        cerrarPopup();
      } else {
        const errorData = await response.json();
        mostrarNotificacion(`Error: ${errorData.error}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    }
  };

  const eliminarEstado = async () => {
    // Aquí se implementaría la lógica real de eliminación
    // Por ahora solo filtramos localmente
    setHistorial((prev) => prev.filter((e) => e.id !== estadoSeleccionado.id));
    mostrarNotificacion("Estado eliminado del historial", "exito");
    cerrarPopup();
  };

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 5000);
  };

  // Filtrar el historial según el texto de búsqueda
  const historialFiltrado = historial.filter((estado) =>
    estado.estado.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return fechaStr;
    }
  };

  return (
    <div className={styles["contenedor-principal"]}>
      {notificacion && (
        <div
          className={`${styles.notificacion} ${
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
            <span className={styles["titulo-principal"]}>
              Historial de Estados
            </span>
            <span className={styles["mensaje-bienvenida"]}>
              <span className={styles["emoji-icon"]}>📋</span>
              Registro completo de estados enviados al tablero
            </span>
          </h1>
        </div>

        <div className={styles["dashboard-stats"]}>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-valor"]}>{historial.length}</div>
            <div className={styles["stat-label"]}>Estados Enviados</div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-valor"]}>
              {estadosGuardados.length}
            </div>
            <div className={styles["stat-label"]}>Estados Guardados</div>
          </div>
        </div>
      </div>

      <div className={styles["panel-tablero"]}>
        <div className={styles["panel-header"]}>
          <h2 className={styles["titulo-panel"]}>
            Registro Histórico de Estados
          </h2>
          <div className={styles["campo-busqueda"]}>
            <input
              type="text"
              placeholder="Filtrar estados..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={styles["input-busqueda"]}
            />
          </div>
        </div>

        <div className={styles["historial-grid"]}>
          {cargando ? (
            <div className={styles["cargando-contenedor"]}>
              <div className={styles["cargador-spinner"]}></div>
              <p>Cargando historial...</p>
            </div>
          ) : historialFiltrado.length > 0 ? (
            historialFiltrado.map((estado) => (
              <div
                key={estado.id}
                className={`${styles.tarjeta} ${styles["tarjeta-historial"]}`}
                onClick={() => abrirPopup(estado)}
              >
                <div className={styles["tarjeta-header"]}>
                  <h3>Estado #{estado.id}</h3>
                  <div
                    className={`${styles["tarjeta-badge"]} ${
                      estadosGuardados.includes(estado.estado)
                        ? styles.guardado
                        : ""
                    }`}
                  >
                    {estadosGuardados.includes(estado.estado)
                      ? "Guardado"
                      : "No guardado"}
                  </div>
                </div>

                <div className={styles["estado-contenido"]}>
                  <p className={styles["estado-texto"]}>{estado.estado}</p>
                </div>

                <div className={styles["tarjeta-footer"]}>
                  <div className={styles["fecha-info"]}>
                    <span className={styles["fecha-icono"]}>📅</span>
                    {formatearFecha(estado.fecha)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles["mensaje-vacio"]}>
              <div className={styles["mensaje-vacio-icono"]}>📭</div>
              <p>No se encontraron estados en el historial</p>
              {filtro && (
                <button
                  className={styles["boton boton-limpiar"]}
                  onClick={() => setFiltro("")}
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {estadoSeleccionado && (
        <div className={styles["popup-fondo"]}>
          <div className={styles["popup"]}>
            <div className={styles["popup-header"]}>
              <h3>Detalles del Estado</h3>
              <button className={styles["popup-cerrar"]} onClick={cerrarPopup}>
                ×
              </button>
            </div>

            <div className={styles["popup-contenido"]}>
              <div className={styles["popup-detalle"]}>
                <span className={styles["detalle-etiqueta"]}>Estado:</span>
                <p className={styles["detalle-texto"]}>
                  {estadoSeleccionado.estado}
                </p>
              </div>

              <div className={styles["popup-detalle"]}>
                <span className={styles["detalle-etiqueta"]}>Fecha:</span>
                <p className={styles["detalle-texto"]}>
                  {formatearFecha(estadoSeleccionado.fecha)}
                </p>
              </div>

              <div className={styles["popup-detalle"]}>
                <span className={styles["detalle-etiqueta"]}>Profesor:</span>
                <p className={styles["detalle-texto"]}>
                  {estadoSeleccionado.profesor}
                </p>
              </div>

              <div className={styles["popup-detalle"]}>
                <span className={styles["detalle-etiqueta"]}>
                  Estado guardado:
                </span>
                <p className={styles["detalle-indicador"]}>
                  {estadosGuardados.includes(estadoSeleccionado.estado) ? (
                    <span className={styles["indicador-si"]}>✓ Sí</span>
                  ) : (
                    <span className={styles["indicador-no"]}>✗ No</span>
                  )}
                </p>
              </div>
            </div>

            <div className={styles["popup-botones"]}>
              {!estadosGuardados.includes(estadoSeleccionado.estado) && (
                <button
                  className={`${styles.boton} ${styles["boton-guardar"]}`}
                  onClick={guardarEstadoEnBaseDeDatos}
                >
                  <span className={styles["boton-icono"]}>💾</span>
                  Guardar Estado
                </button>
              )}
              <button
                className={`${styles.boton} ${styles["boton-limpiar"]}`}
                onClick={eliminarEstado}
              >
                <span className={styles["boton-icono"]}>🗑️</span>
                Eliminar
              </button>
              <button className="boton boton-cancelar" onClick={cerrarPopup}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialEstados;
