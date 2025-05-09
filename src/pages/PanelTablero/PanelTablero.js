import React, { useState } from 'react';
import './PanelTablero.css';

const PanelTablero = ({ profesor }) => {
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState('');

  const manejarCambioMensaje = (e) => setMensaje(e.target.value);
  const manejarCambioEstado = (e) => setEstado(e.target.value);

  const generarVistaPrevia = () => {
    if (!mensaje && !estado) {
      alert('Por favor, completa al menos uno de los campos');
      return;
    }
    const vista = mensaje ? mensaje : estado;
    setVistaPrevia(vista);
  };

  const guardarEstado = () => {
    if (!mensaje && !estado) {
      alert('Por favor, completa al menos uno de los campos');
      return;
    }
    // Aquí iría la lógica para guardar el estado
    alert('Estado guardado correctamente');
  };

  const limpiarCampos = () => {
    setMensaje('');
    setEstado('');
    setVistaPrevia('');
  };

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-bienvenida">Bienvenido @{profesor}!</h1>
      
      <div className="panel-tablero">
        <h2 className="titulo-panel">Panel Tablero 2.0</h2>
        
        <div className="campo-formulario">
          <label>Estado guardado:</label>
          <select 
            value={estado} 
            onChange={manejarCambioEstado}
          >
            <option value="">Seleccionar estado</option>
            <option value="Disponible">Disponible</option>
            <option value="Ocupado">Ocupado</option>
            <option value="En clase">En clase</option>
            <option value="En reunión">En reunión</option>
          </select>
        </div>
        
        <div className="campo-formulario">
          <label>Mensaje personalizado:</label>
          <textarea
            value={mensaje}
            onChange={manejarCambioMensaje}
            placeholder="Escribe tu mensaje aquí..."
            rows="4"
          ></textarea>
        </div>
        
        <div className="botones-container">
          <button className="boton-enviar" onClick={generarVistaPrevia}>Enviar</button>
          <button className="boton-guardar" onClick={guardarEstado}>Guardar estado</button>
          <button className="boton-limpiar" onClick={limpiarCampos}>Limpiar</button>
        </div>
        
        <div className="previsualizacion">
          <p className="texto-previsualizacion">
            {vistaPrevia ? vistaPrevia : 'Previsualización del mensaje'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanelTablero;