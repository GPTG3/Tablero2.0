import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo2.png";
import styles from "./LandingPage.module.css";

function LandingPage() {
  return (
    <div className={styles["landing-container"]}>
      <header className={styles["landing-header"]}>
        <div className={styles["landing-logo"]}>
          <img src={logo} alt="Tablero 2.0" />
        </div>

        <h1>Bienvenido a Tablero 2.0</h1>

        <p className={styles["landing-description"]}>
          Una solución moderna y eficiente para la gestión de estados y mensajes
          en tiempo real para profesores.
        </p>
      </header>

      <section className={styles["features-section"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["title-icon"]}>⭐</span>
          Características Principales
        </h2>

        <div className={styles["features-grid"]}>
          <div className={styles["feature-card"]}>
            <div className={styles["feature-icon-container"]}>
              <span className={styles["feature-icon"]}>📊</span>
            </div>
            <h3>Gestión Eficiente</h3>
            <p>
              Organiza tus estados y mensajes con precisión y facilidad. Accede
              a un historial completo de todos los mensajes enviados.
            </p>
          </div>

          <div className={styles["feature-card"]}>
            <div className={styles["feature-icon-container"]}>
              <span className={styles["feature-icon"]}>🔄</span>
            </div>
            <h3>Tiempo Real</h3>
            <p>
              Visualiza la información de forma instantánea en el tablero LED
              conectado. Verifica el estado de conexión en todo momento.
            </p>
          </div>

          <div className={styles["feature-card"]}>
            <div className={styles["feature-icon-container"]}>
              <span className={styles["feature-icon"]}>🎨</span>
            </div>
            <h3>Personalización</h3>
            <p>
              Elige el color y formato de tus mensajes. Guarda tus estados
              frecuentes para reutilizarlos cuando los necesites.
            </p>
          </div>

          <div className={styles["feature-card"]}>
            <div className={styles["feature-icon-container"]}>
              <span className={styles["feature-icon"]}>🔒</span>
            </div>
            <h3>Seguridad</h3>
            <p>
              Acceso protegido mediante autenticación JWT. Cada profesor tiene
              acceso únicamente a sus propios mensajes y estados.
            </p>
          </div>
        </div>
      </section>

      <section className={styles["how-it-works"]}>
        <h2 className={styles["section-title"]}>
          <span className={styles["title-icon"]}>🔍</span>
          Cómo Funciona
        </h2>

        <div className={styles["steps-container"]}>
          <div className={styles["step"]}>
            <div className={styles["step-number"]}>1</div>
            <h3>Regístrate</h3>
            <p>
              Crea tu cuenta de profesor con tu correo electrónico
              institucional.
            </p>
          </div>

          <div className={styles["step"]}>
            <div className={styles["step-number"]}>2</div>
            <h3>Crea estados</h3>
            <p>
              Escribe y guarda tus mensajes frecuentes para usar en el futuro.
            </p>
          </div>

          <div className={styles["step"]}>
            <div className={styles["step-number"]}>3</div>
            <h3>Envía al tablero</h3>
            <p>
              Selecciona un mensaje y envíalo al tablero LED con un solo clic.
            </p>
          </div>
        </div>
      </section>

      <section className={styles["cta-section"]}>
        <h2>¿Listo para comenzar?</h2>
        <p>
          Regístrate ahora y comienza a gestionar tus estados de manera
          eficiente.
        </p>
        <Link
          to="/register"
          className={`${styles["landing-button"]} ${styles["cta-button"]}`}
        >
          Crear cuenta gratuita
        </Link>
      </section>
    </div>
  );
}

export default LandingPage;
