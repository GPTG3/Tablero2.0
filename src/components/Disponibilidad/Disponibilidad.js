import React, { useState, useEffect } from 'react';
import './Disponibilidad.css';

function Disponibilidad() {
  const [estado, setEstado] = useState('');
  const [historial, setHistorial] = useState([]);

  const profesor = 'Profesor Ejemplo'; // Cambiar por el nombre del profesor autenticado

  const actualizarEstado = async () => {
    if (!estado) return;

    try {
      const response = await fetch('http://localhost:3001/historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profesor, estado }),
      });

      if (response.ok) {
        obtenerHistorial();
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  };

  const obtenerHistorial = async () => {
    try {
      const response = await fetch('http://localhost:3001/historial');
      const data = await response.json();
      setHistorial(data);
    } catch (error) {
      console.error('Error al obtener el historial:', error);
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  return (
    <div className="disponibilidad-container">
      <h1>Configurar Disponibilidad</h1>
      <div className="estado-selector">
        <button onClick={() => setEstado('Libre')}>Libre</button>
        <button onClick={() => setEstado('Ocupado')}>Ocupado</button>
        <button onClick={() => setEstado('Ausente')}>Ausente</button>
      </div>
      <button onClick={actualizarEstado} className="guardar-estado">
        Guardar Estado
      </button>

      <h2>Historial</h2>
      <ul className="historial-lista">
        {historial.map((item) => (
          <li key={item.id}>
            {item.fecha} - {item.profesor}: {item.estado}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Disponibilidad;