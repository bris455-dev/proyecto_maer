import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import "../../styles/login.css";

function MFA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFA } = useAuth(); // 🔑 usar contexto

  const email = location.state?.email; // Email enviado desde login

  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError("No se encontró el correo del usuario para MFA");
      setLoading(false);
      return;
    }

    try {
      const res = await verifyMFA(email, mfaCode); // enviar email + mfa_code

      if (res.status === "success") {
        // Redirigir al inicio
        navigate("/inicio", { replace: true });
      } else {
        throw new Error(res.message || "Código MFA inválido o expirado.");
      }
    } catch (err) {
      setError(err.message || "Error al verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Verificación MFA</h2>
        <p>Se ha enviado un código de verificación a: <strong>{email}</strong></p>
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label>Código de verificación</label>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              placeholder="Ejemplo: 123456"
            />
          </div>
          {error && <p className="extra-text error-text">{error}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Verificando..." : "Verificar código"}
          </button>
        </form>
        <p className="extra-text">
          <span className="link-text" onClick={() => navigate("/")}>
            Volver al login
          </span>
        </p>
      </div>
    </div>
  );
}

export default MFA;
