import { useState } from "react";
import "./App.css";
import Login from "./components/Login/Login";
import Disponibilidad from "./components/Disponibilidad/Disponibilidad";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bienvenido, {user.email}</h1>
        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
        <Disponibilidad />
      </header>
    </div>
  );
}

export default App;