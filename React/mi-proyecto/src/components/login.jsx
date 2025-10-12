import React from "react";
import { useState } from "react";
import "./login.css";
import logo from "../assets/logo.jpeg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch("http://127.0.0.1:8080/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    alert(data.message); // Aquí el mensaje "Código MFA enviado al correo"
    
    // Aquí puedes redirigir a una nueva pantalla para ingresar el código MFA
  } catch (error) {
    console.error("Error:", error);
  }
};
  

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-login">
            Entrar
          </button>
        </form>
        <p className="extra-text">
          ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
