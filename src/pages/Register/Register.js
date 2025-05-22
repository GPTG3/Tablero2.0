import React, { useState } from "react";
import "./Register.css";
import logo from "../../assets/images/logo2.png";
import { Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mail: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Usuario registrado exitosamente");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Error al registrar el usuario. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-logo">
          <img src={logo} alt="Tablero 2.0" />
        </div>

        <div className="register-header">
          <h1>Crear Cuenta</h1>
          <p>Completa el formulario para registrar un nuevo profesor</p>
        </div>

        {error && (
          <div className="register-error">
            <div className="error-icon">❌</div>
            <div className="error-message">{error}</div>
          </div>
        )}

        {success && (
          <div className="register-success">
            <div className="success-icon">✅</div>
            <div className="success-message">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
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

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <span className="form-icon">🔐</span>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Registrando...
              </>
            ) : (
              <>
                <span className="button-icon">📝</span> Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>¿Ya tienes cuenta?</p>
          <Link to="/login" className="login-link">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;