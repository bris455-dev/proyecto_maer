import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "./login.css";
import logo from "../assets/logo.jpeg";
import { Link } from "react-router-dom";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mostrarCodigoInput, setMostrarCodigoInput] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para cambio de contraseña
  const [cambioPassword, setCambioPassword] = useState(false);
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const navigate = useNavigate();

  // 🔹 Paso 1: Login
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      alert(errorData.error || "Error al iniciar sesión");
      return;
    }

    const data = await response.json();
    setUsuario(data.user?.nombre || email);

    if (data.first_access) {
      // Primer acceso → mostrar formulario de cambio de contraseña
      setCambioPassword(true);
    } else {
      // Usuario ya cambió contraseña → mostrar MFA
      setMostrarCodigoInput(true);
      alert(`Código de autenticación enviado al correo ${data.user?.email || email}`);
    }
  } catch (error) {
    console.error("Error al conectarse al backend:", error);
    alert("No se pudo conectar con el servidor. Verifica que Laravel esté corriendo.");
  } finally {
    setLoading(false);
  }
};


 // 🔹 Paso 2: Verificación de MFA
const handleVerifyCode = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8080/api/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, codigo }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      alert(errorData.error || "Código incorrecto");

      setMostrarCodigoInput(false);
      setPassword("");
      setCodigo("");
      setUsuario("");
      return;
    }

    const data = await response.json();
    alert(data.message || "Código verificado correctamente");

    // ✅ Marcar usuario como autenticado y redirigir
    setIsAuthenticated(true);
    navigate("/inicio"); // Aquí vas al dashboard o página principal
  } catch (error) {
    console.error("Error al verificar código:", error);
    alert("No se pudo conectar con el servidor.");
    setMostrarCodigoInput(false);
    setPassword("");
    setCodigo("");
    setUsuario("");
  } finally {
    setLoading(false);
  }
};


  // 🔹 Paso 3: Cambio de contraseña inicial
  const handleChangeInitialPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8080/api/set-initial-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email,
          password_nuevo: passwordNuevo,
          password_nuevo_confirmation: passwordConfirm,
        }),
      });

      const data = await response.json().catch(() => ({ error: "Respuesta inesperada del servidor" }));

      if (!response.ok) {
        alert(data.error || "Error al cambiar contraseña");
        return;
      }

      alert(data.message || "Contraseña cambiada exitosamente");
      setCambioPassword(false);
      setMostrarCodigoInput(true);
      alert(`Código de autenticación enviado al correo ${email}`);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
        <h2>Iniciar Sesión</h2>

        {!mostrarCodigoInput && !cambioPassword ? (
          // Formulario de login
          <form onSubmit={handleLogin}>
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

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Cargando..." : "Entrar"}
            </button>
          </form>
        ) : !cambioPassword ? (
          // Formulario MFA
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Ingresa el código enviado a {usuario}</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código de autenticación"
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Verificando..." : "Verificar Código"}
            </button>
          </form>
        ) : (
          // Formulario de cambio de contraseña inicial
          <form onSubmit={handleChangeInitialPassword}>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                placeholder="Ingresa nueva contraseña"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirma nueva contraseña"
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}

        <p className="extra-text">
          Olvidaste tu contraseña{" "}
          <Link to="/forgot-password" className="link-button">
    Recupérala aquí
  </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;