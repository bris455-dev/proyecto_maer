import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Error al enviar el código");
      } else {
        setMsg(data.message || "Código enviado correctamente");
        localStorage.setItem("resetEmail", email);
        // Redirigir a la página para ingresar el código
        setTimeout(() => navigate("/reset-password"), 2000);
      }
    } catch (err) {
  setError(err.message || "No se pudo conectar con el servidor.");
}
     finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo"
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
