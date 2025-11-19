import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth.js";
import { useAuth } from "../../hooks/useAuth.js";
import "../../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔑 usar contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(email, password);

      if (!res || !res.status) throw new Error("Respuesta inválida del servidor.");

      if (res.user) localStorage.setItem("user_data", JSON.stringify(res.user));

      switch (res.status) {
        case "first_login":
          navigate("/first-access", { state: { email } });
          break;
        case "mfa_required":
          navigate("/mfa", { state: { email } });
          break;
        case "success":
          // 🔑 Usar el hook login para actualizar estado global
          await login(email, password);
          navigate("/inicio", { replace: true });
          break;
        default:
          throw new Error(res.message || "Error en el inicio de sesión.");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <p className="extra-text error-text">{error}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>
        <p className="extra-text">
          ¿Olvidaste tu contraseña?{" "}
          <span
            className="link-text"
            onClick={() => navigate("/forgot-password")}
          >
            Recupérala aquí
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
