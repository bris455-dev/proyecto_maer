import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import '../../styles/login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔑 usar contexto

  const [email] = useState(localStorage.getItem("resetEmail") || "");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validación contraseña fuerte
  const validarPassword = (clave) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    return regex.test(clave);
  };

  const checkPassword = (clave) => ({
    length: clave.length >= 8,
    uppercase: /[A-Z]/.test(clave),
    lowercase: /[a-z]/.test(clave),
    number: /\d/.test(clave),
    symbol: /[@$!%*#?&]/.test(clave),
  });

  const passwordStatus = checkPassword(password);
  const passwordsMatch = password && confirm && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!token.trim())
      return setError("Debe ingresar el código enviado a su correo.");

    if (!passwordsMatch)
      return setError("Las contraseñas no coinciden.");

    if (!validarPassword(password))
      return setError(
        "La contraseña debe tener 8 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      );

    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8080/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email,
            token: token.trim(),
            password: password,
            password_confirmation: confirm,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return setError(
          data?.message || "Error al restablecer contraseña."
        );
      }

      setMsg(data.message || "Contraseña actualizada correctamente.");

      // limpiar
      localStorage.removeItem("resetEmail");

      // 🔥 Backend retorna token → iniciar sesión automáticamente
      if (data.token) {
        localStorage.setItem("auth_token", data.token);

        // Guardar user completo
        if (data.user) localStorage.setItem("user_data", JSON.stringify(data.user));

        // 🔑 login directo en contexto
        await login(email, password);

        // redirigir a inicio
        navigate("/inicio", { replace: true });
      } else {
        // Si no retorna token, regresar al login
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Error en reset password:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Restablecer contraseña</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Código de recuperación</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {/* Indicadores */}
          <div className="password-requirements">
            <p className={passwordStatus.length ? "valid" : "invalid"}>
              {passwordStatus.length ? "✔️" : "❌"} Mínimo 8 caracteres
            </p>
            <p className={passwordStatus.uppercase ? "valid" : "invalid"}>
              {passwordStatus.uppercase ? "✔️" : "❌"} Una mayúscula
            </p>
            <p className={passwordStatus.lowercase ? "valid" : "invalid"}>
              {passwordStatus.lowercase ? "✔️" : "❌"} Una minúscula
            </p>
            <p className={passwordStatus.number ? "valid" : "invalid"}>
              {passwordStatus.number ? "✔️" : "❌"} Un número
            </p>
            <p className={passwordStatus.symbol ? "valid" : "invalid"}>
              {passwordStatus.symbol ? "✔️" : "❌"} Un símbolo especial
            </p>
            {confirm && (
              <p className={passwordsMatch ? "valid" : "invalid"}>
                {passwordsMatch ? "✔️ Coinciden" : "❌ No coinciden"}
              </p>
            )}
          </div>

          <button
            className="btn-login"
            type="submit"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Cambiar contraseña"}
          </button>
        </form>

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
