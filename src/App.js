import { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [user, setUser] = useState(null);

  // Cargar el usuario desde localStorage al iniciar la aplicación
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // Guardar en localStorage
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user"); // Eliminar del localStorage
  };

  return (
    <Router>
      <Navbar user={user} handleLogout={handleLogout} />
      <div className="App">
        <AppRoutes user={user} handleLogin={handleLogin} />
      </div>
      <Footer />
    </Router>
  );
}

export default App;