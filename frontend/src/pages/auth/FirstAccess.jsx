import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import "../../styles/login.css";

function FirstAccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔑 usar contexto
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validarPassword = (clave) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(clave);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (password !== confirm) {
      setError("❌ Las contraseñas no coinciden.");
      return;
    }

    if (!validarPassword(password)) {
      setError(
        "❌ La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8080/api/auth/set-initial-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password_nuevo: password, password_nuevo_confirmation: confirm }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al cambiar la contraseña.");
      } else {
        setMsg("✅ Contraseña cambiada correctamente.");

        if (data.token) localStorage.setItem("auth_token", data.token);
        if (data.user) localStorage.setItem("user_data", JSON.stringify(data.user));

        // 🔑 login directo en contexto
        await login(email, password);

        navigate("/inicio", { replace: true });
      }
    } catch (err) {
      setError("❌ No se pudo conectar con el servidor.");
      console.error("FirstAccess error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Primer acceso: Cambiar contraseña</h2>
        <p>Usuario: <b>{email}</b></p>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          {error && <p className="extra-text error-text">{error}</p>}
          {msg && <p className="extra-text" style={{ color: "green" }}>{msg}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Procesando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FirstAccess;
