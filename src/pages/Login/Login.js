import React, { useState } from "react";
import "./Login.css";
import logo from "../../logo.svg";
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

    // USUARIO HARDOCODEADO: a@a:a

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
      setError(
        "No se encontró un token de autenticación. Por favor, inicia sesión."
      );
      return;
    } else {
      console.log("Token de autenticación:", token);
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
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
            <Link to="/register" className="forgot-password">
              Crear cuenta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
