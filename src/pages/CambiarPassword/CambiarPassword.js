import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import styles from "./CambiarPassword.module.css";
import { BACKEND_URL } from "../../config";

const CambiarPassword = () => {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [mostrarPasswords, setMostrarPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  const token = localStorage.getItem("token");
  const usuario = token ? jwtDecode(token).mail : null;

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 5000);
  };

  const validarFormulario = () => {
    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      mostrarNotificacion("Todos los campos son obligatorios", "error");
      return false;
    }

    if (passwordNueva.length < 6) {
      mostrarNotificacion("La nueva contraseña debe tener al menos 6 caracteres", "error");
      return false;
    }

    if (passwordNueva !== confirmarPassword) {
      mostrarNotificacion("Las contraseñas nuevas no coinciden", "error");
      return false;
    }

    if (passwordActual === passwordNueva) {
      mostrarNotificacion("La nueva contraseña debe ser diferente a la actual", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setCargando(true);

    try {
      const response = await fetch(`${BACKEND_URL}/cambiar-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          passwordActual,
          passwordNueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        mostrarNotificacion("Contraseña actualizada correctamente", "exito");
        // Limpiar formulario
        setPasswordActual("");
        setPasswordNueva("");
        setConfirmarPassword("");
      } else {
        mostrarNotificacion(data.error || "Error al cambiar la contraseña", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  const toggleMostrarPassword = (campo) => {
    setMostrarPasswords(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  return (
    <div className={styles["contenedor-principal"]}>
      {notificacion && (
        <div className={`${styles["notificacion"]} ${styles[`notificacion-${notificacion.tipo}`]}`}>
          <div className={styles["notificacion-icono"]}>
            {notificacion.tipo === "exito" && "✅"}
            {notificacion.tipo === "error" && "❌"}
          </div>
          <div className={styles["notificacion-mensaje"]}>{notificacion.mensaje}</div>
          <button
            onClick={() => setNotificacion(null)}
            className={styles["notificacion-cerrar"]}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles["tarjeta"]}>
        <div className={styles["tarjeta-header"]}>
          <h2>Cambiar Contraseña</h2>
          <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
        </div>

        <div className={styles["usuario-info"]}>
          <span className={styles["campo-icono"]}>👤</span>
          <span>Usuario: <strong>{usuario}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className={styles["formulario"]}>
          <div className={styles["campo-formulario"]}>
            <label htmlFor="password-actual">
              <span className={styles["campo-icono"]}>🔒</span>
              Contraseña Actual
            </label>
            <div className={styles["input-password-container"]}>
              <input
                type={mostrarPasswords.actual ? "text" : "password"}
                id="password-actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
              />
              <button
                type="button"
                className={styles["toggle-password"]}
                onClick={() => toggleMostrarPassword("actual")}
              >
                {mostrarPasswords.actual ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className={styles["campo-formulario"]}>
            <label htmlFor="password-nueva">
              <span className={styles["campo-icono"]}>🔐</span>
              Nueva Contraseña
            </label>
            <div className={styles["input-password-container"]}>
              <input
                type={mostrarPasswords.nueva ? "text" : "password"}
                id="password-nueva"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Ingresa tu nueva contraseña (mín. 6 caracteres)"
                required
              />
              <button
                type="button"
                className={styles["toggle-password"]}
                onClick={() => toggleMostrarPassword("nueva")}
              >
                {mostrarPasswords.nueva ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className={styles["campo-formulario"]}>
            <label htmlFor="confirmar-password">
              <span className={styles["campo-icono"]}>✅</span>
              Confirmar Nueva Contraseña
            </label>
            <div className={styles["input-password-container"]}>
              <input
                type={mostrarPasswords.confirmar ? "text" : "password"}
                id="confirmar-password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                required
              />
              <button
                type="button"
                className={styles["toggle-password"]}
                onClick={() => toggleMostrarPassword("confirmar")}
              >
                {mostrarPasswords.confirmar ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className={styles["formulario-footer"]}>
            <button
              type="submit"
              className={`${styles["boton"]} ${styles["boton-guardar"]}`}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className={styles["spinner"]}></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <span className={styles["boton-icono"]}>🔄</span>
                  Cambiar Contraseña
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPassword;