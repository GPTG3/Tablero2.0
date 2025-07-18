import React, { useState } from "react";
import logo from "../../assets/images/logo2.png"; // Cambiado para usar el logo correcto
import { Link } from "react-router-dom";
import styles from "./Login.module.css"; // Asegúrate de tener un archivo CSS para estilos
import { BACKEND_URL } from "../../config";

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
      const response = await fetch(`${BACKEND_URL}/login`, {
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
    <div className={styles["login-container"]}>
      <div className={styles["login-card"]}>
        <div className={styles["login-logo"]}>
          <img src={logo} alt="Tablero 2.0" />
        </div>

        <div className={styles["login-header"]}>
          <h1>Inicio Sesión</h1>
          <p>Introduce tus credenciales para continuar</p>
        </div>

        {error && (
          <div className={styles["login-error"]}>
            <div className={styles["error-icon"]}>❌</div>
            <div className={styles["error-message"]}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles["login-form"]}>
          <div className={styles["form-group"]}>
            <label htmlFor="email">
              <span className={styles["form-icon"]}>✉️</span>
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

          <div className={styles["form-group"]}>
            <label htmlFor="password">
              <span className={styles["form-icon"]}>🔒</span>
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

          <button
            type="submit"
            className={styles["login-button"]}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles["spinner"]}></span> Iniciando...
              </>
            ) : (
              <>
                <span className={styles["button-icon"]}>🔑</span> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className={styles["login-footer"]}>
          <p>¿No tienes cuenta?</p>
          <Link to="/register" className={styles["register-link"]}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
