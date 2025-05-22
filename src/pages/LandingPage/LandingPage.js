import React from 'react';
import './LandingPage.css';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Bienvenido a Tablero 2.0</h1>
        <p>Gestiona tus estados y horarios de manera eficiente.</p>
        <Link to="/login" className="landing-button">
          Iniciar Sesión
        </Link>
      </header>

      <section className="features-section">
        <div className="feature-card">
          <div className="icon-container">
            <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" d="M3 10h4l3 8 4-16 3 8h4" />
            </svg>
          </div>
          <h3>Gestión Eficiente</h3>
          <p>Organiza tus turnos y actividades con precisión y facilidad.</p>
        </div>
        <div className="feature-card">
          <div className="icon-container">
            <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Visualización Clara</h3>
          <p>Paneles dinámicos que muestran tu información en tiempo real.</p>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;
