import React, { useState } from "react";
import "./Login.css";
import logo from "../../assets/images/logo2.png"; // Cambiado para usar el logo correcto
import { Link } from "react-router-dom";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mail: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // Guarda el token en localStorage
        onLogin(data.user); // Llama a la función onLogin con los datos del usuario
      } else {
        setError(data.error || "Error al iniciar sesión. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No se encontró un token de autenticación.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Tablero 2.0" />
        </div>

        <div className="login-header">
          <h1>Inicio Sesión</h1>
          <p>Introduce tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="login-error">
            <div className="error-icon">❌</div>
            <div className="error-message">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <span className="form-icon">✉️</span> 
              Correo Electrónico
            </label>
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
            <label htmlFor="password">
              <span className="form-icon">🔒</span> 
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Iniciando...
              </>
            ) : (
              <>
                <span className="button-icon">🔑</span> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes cuenta?</p>
          <Link to="/register" className="register-link">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
