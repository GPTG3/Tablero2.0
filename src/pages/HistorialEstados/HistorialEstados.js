import React, { useState } from 'react';
import './HistorialEstados.css';

const obtenerFechaActual = () => {
  const ahora = new Date();
  return ahora.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const HistorialEstados = () => {
  const [historial, setHistorial] = useState([
    {
      id: 1,
      nombre: 'Estado Inicial',
      descripcion: 'Se inicializó el tablero.',
      estado: 'guardado',
      fecha: obtenerFechaActual(),
    },
    {
      id: 2,
      nombre: 'Modificación de horario',
      descripcion: 'Se ajustó el horario del módulo 2.',
      estado: 'no guardado',
      fecha: obtenerFechaActual(),
    },
    {
      id: 3,
      nombre: 'Asignación nueva sala',
      descripcion: 'Asignación de la sala 104 para el módulo 3.',
      estado: 'guardado',
      fecha: obtenerFechaActual(),
    },
  ]);

  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  const abrirPopup = (estado) => setEstadoSeleccionado(estado);
  const cerrarPopup = () => setEstadoSeleccionado(null);

  const cambiarEstadoGuardado = () => {
    setHistorial(prev =>
      prev.map(e =>
        e.id === estadoSeleccionado.id
          ? {
              ...e,
              estado: e.estado === 'guardado' ? 'no guardado' : 'guardado',
            }
          : e
      )
    );
    cerrarPopup();
  };

  const eliminarEstado = () => {
    setHistorial(prev => prev.filter(e => e.id !== estadoSeleccionado.id));
    cerrarPopup();
  };

  return (
    <div className="history-container">
      <h2 className="text-xl font-bold mb-4 text-center">Historial de Estados</h2>

      {historial.map((estado) => (
        <div key={estado.id} className="history-card" onClick={() => abrirPopup(estado)}>
          <div className="history-title">{estado.nombre}</div>
          <span className={`history-status ${estado.estado === 'guardado' ? 'saved' : 'not-saved'}`}>
            {estado.estado === 'guardado' ? 'Guardado' : 'No guardado'}
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
              <button
                className={estadoSeleccionado.estado === 'guardado' ? 'quitar-guardado' : 'guardar'}
                onClick={cambiarEstadoGuardado}
              >
                {estadoSeleccionado.estado === 'guardado' ? 'Quitar guardado' : 'Guardar'}
              </button>
              <button className="eliminar" onClick={eliminarEstado}>Eliminar</button>
              <button className="cancelar" onClick={cerrarPopup}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialEstados;
