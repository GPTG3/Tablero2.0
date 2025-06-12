import React, { useState } from "react";
import logo from "../../assets/images/logo2.png";
import { Link } from "react-router-dom";
import styles from "./Register.module.css"; // Asegúrate de tener un archivo CSS para estilos
import { BACKEND_URL } from "../../config";

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
      const response = await fetch(`${BACKEND_URL}/register`, {
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
        setError(
          data.error || "Error al registrar el usuario. Inténtalo de nuevo."
        );
      }
    } catch (err) {
      setError("Error al conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["register-container"]}>
      <div className={styles["register-card"]}>
        <div className={styles["register-logo"]}>
          <img src={logo} alt="Tablero 2.0" />
        </div>

        <div className={styles["register-header"]}>
          <h1>Crear Cuenta</h1>
          <p>Completa el formulario para registrar un nuevo profesor</p>
        </div>

        {error && (
          <div className={styles["register-error"]}>
            <div className={styles["error-icon"]}>❌</div>
            <div className={styles["error-message"]}>{error}</div>
          </div>
        )}

        {success && (
          <div className={styles["register-success"]}>
            <div className={styles["success-icon"]}>✅</div>
            <div className={styles["success-message"]}>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles["register-form"]}>
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

          <div className={styles["form-group"]}>
            <label htmlFor="confirmPassword">
              <span className={styles["form-icon"]}>🔐</span>
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

          <button
            type="submit"
            className={styles["register-button"]}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles["spinner"]}></span> Registrando...
              </>
            ) : (
              <>
                <span className={styles["button-icon"]}>📝</span> Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div className={styles["register-footer"]}>
          <p>¿Ya tienes cuenta?</p>
          <Link to="/login" className={styles["login-link"]}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
