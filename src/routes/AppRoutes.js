import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import PanelTablero from "../pages/PanelTablero/PanelTablero";
import HistorialEstados from "../pages/HistorialEstados/HistorialEstados";
import LandingPage from "../pages/LandingPage/LandingPage";

function AppRoutes({ user, handleLogin }) {
  return (
    <Routes>
      {/* Ruta para la Landing Page */}
      <Route
        path="/"
        element={!user ? <LandingPage /> : <Navigate to="/panel" />}
      />

      {/* Ruta para login */}
      <Route
        path="/login"
        element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/panel" />}
      />

      {/* Ruta para el panel */}
      <Route
        path="/panel"
        element={user ? <PanelTablero profesor={user.email} /> : <Navigate to="/login" />}
      />

      {/* Ruta para historial */}
      <Route
        path="/historial"
        element={user ? <HistorialEstados /> : <Navigate to="/login" />}
      />

      {/* Ruta por defecto */}
      <Route
        path="*"
        element={<Navigate to={user ? "/panel" : "/"} />}
      />
    </Routes>
  );
}

export default AppRoutes;