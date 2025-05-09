import React, { useState } from 'react';
import './Login.css';
import logo from '../../logo.svg';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Aquí puedes conectar con tu backend
      // Ejemplo simulado:
      setTimeout(() => {
        onLogin({ email });
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bienvenido profesor</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@ejemplo.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          
          <div className="form-footer">
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;