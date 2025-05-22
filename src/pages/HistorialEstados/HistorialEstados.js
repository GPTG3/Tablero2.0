import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "./HistorialEstados.css";

const HistorialEstados = () => {
  const [historial, setHistorial] = useState([]);
  const [estadosGuardados, setEstadosGuardados] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState(null);
  const [filtro, setFiltro] = useState('');

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
        const response = await fetch("http://localhost:3001/historial", {
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
          `http://localhost:3001/estados?profesor=${profesor}`,
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
      const response = await fetch("http://localhost:3001/estados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          estado: estadoSeleccionado.estado,
          profesor 
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
  const historialFiltrado = historial.filter(
    estado => estado.estado.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return fechaStr;
    }
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
            <span className="titulo-principal">Historial de Estados</span>
            <span className="mensaje-bienvenida">
              <span className="emoji-icon">📋</span> 
              Registro completo de estados enviados al tablero
            </span>
          </h1>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-valor">{historial.length}</div>
            <div className="stat-label">Estados Enviados</div>
          </div>
          <div className="stat-card">
            <div className="stat-valor">{estadosGuardados.length}</div>
            <div className="stat-label">Estados Guardados</div>
          </div>
        </div>
      </div>

      <div className="panel-tablero">
        <div className="panel-header">
          <h2 className="titulo-panel">Registro Histórico de Estados</h2>
          <div className="campo-busqueda">
            <input
              type="text"
              placeholder="Filtrar estados..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input-busqueda"
            />
          </div>
        </div>
        
        <div className="historial-grid">
          {cargando ? (
            <div className="cargando-contenedor">
              <div className="cargador-spinner"></div>
              <p>Cargando historial...</p>
            </div>
          ) : historialFiltrado.length > 0 ? (
            historialFiltrado.map((estado) => (
              <div
                key={estado.id}
                className="tarjeta tarjeta-historial"
                onClick={() => abrirPopup(estado)}
              >
                <div className="tarjeta-header">
                  <h3>Estado #{estado.id}</h3>
                  <div className={`tarjeta-badge ${estadosGuardados.includes(estado.estado) ? 'guardado' : ''}`}>
                    {estadosGuardados.includes(estado.estado) ? 'Guardado' : 'No guardado'}
                  </div>
                </div>
                
                <div className="estado-contenido">
                  <p className="estado-texto">{estado.estado}</p>
                </div>
                
                <div className="tarjeta-footer">
                  <div className="fecha-info">
                    <span className="fecha-icono">📅</span>
                    {formatearFecha(estado.fecha)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mensaje-vacio">
              <div className="mensaje-vacio-icono">📭</div>
              <p>No se encontraron estados en el historial</p>
              {filtro && <button className="boton boton-limpiar" onClick={() => setFiltro('')}>Limpiar filtro</button>}
            </div>
          )}
        </div>
      </div>

      {estadoSeleccionado && (
        <div className="popup-fondo">
          <div className="popup">
            <div className="popup-header">
              <h3>Detalles del Estado</h3>
              <button className="popup-cerrar" onClick={cerrarPopup}>×</button>
            </div>
            
            <div className="popup-contenido">
              <div className="popup-detalle">
                <span className="detalle-etiqueta">Estado:</span>
                <p className="detalle-texto">{estadoSeleccionado.estado}</p>
              </div>
              
              <div className="popup-detalle">
                <span className="detalle-etiqueta">Fecha:</span>
                <p className="detalle-texto">{formatearFecha(estadoSeleccionado.fecha)}</p>
              </div>
              
              <div className="popup-detalle">
                <span className="detalle-etiqueta">Profesor:</span>
                <p className="detalle-texto">{estadoSeleccionado.profesor}</p>
              </div>
              
              <div className="popup-detalle">
                <span className="detalle-etiqueta">Estado guardado:</span>
                <p className="detalle-indicador">
                  {estadosGuardados.includes(estadoSeleccionado.estado) 
                    ? <span className="indicador-si">✓ Sí</span> 
                    : <span className="indicador-no">✗ No</span>}
                </p>
              </div>
            </div>
            
            <div className="popup-botones">
              {!estadosGuardados.includes(estadoSeleccionado.estado) && (
                <button
                  className="boton boton-guardar"
                  onClick={guardarEstadoEnBaseDeDatos}
                >
                  <span className="boton-icono">💾</span>
                  Guardar Estado
                </button>
              )}
              <button className="boton boton-limpiar" onClick={eliminarEstado}>
                <span className="boton-icono">🗑️</span>
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