import { useState } from "react";
import "./App.css";
import Login from "./components/Login/Login";
import logo from "./logo.svg";

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
        <img src={logo} className="App-logo" alt="logo" />
        <p>¡Bienvenido, {user.email}!</p>
        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </header>
    </div>
  );
}

export default App;
