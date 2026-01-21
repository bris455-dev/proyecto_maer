import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { crearUsuario, obtenerRoles } from "../../api/usuarios.js";
import "../../styles/CrearUsuario.css";

export default function CrearUsuario() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("empleado");
  const [roles, setRoles] = useState([]);
  const [rolID, setRolID] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [email, setEmail] = useState("");
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [empleadoDNI, setEmpleadoDNI] = useState("");
  const [empleadoCargo, setEmpleadoCargo] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDNI_RUC, setClienteDNI_RUC] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clientePais, setClientePais] = useState("");

  // Obtener roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await obtenerRoles();
        setRoles(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error al obtener roles:", error);
        setRoles([]);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { tipo, rolID, email };

    if (tipo === "empleado") {
      payload.nombre = empleadoNombre;
      payload.dni = empleadoDNI;
      payload.cargo = empleadoCargo;
    } else {
      payload.nombre_cliente = clienteNombre;
      payload.dni_ruc = clienteDNI_RUC;
      payload.direccion = clienteDireccion;
      payload.pais = clientePais;
    }

    try {
      const result = await crearUsuario(payload);

      setMensaje(
        `✅ Usuario registrado correctamente.\n🔑 Contraseña temporal: ${result.password_temporal || "(consultar sistema)"}`
      );

      // Limpiar formulario
      setEmail(""); setRolID(""); setTipo("empleado");
      setEmpleadoNombre(""); setEmpleadoDNI(""); setEmpleadoCargo("");
      setClienteNombre(""); setClienteDNI_RUC(""); setClienteDireccion(""); setClientePais("");

      // Redirigir al listado después de 2 segundos
      setTimeout(() => {
        navigate("/seguridad/usuarios");
      }, 2000);

    } catch (error) {
      console.error("Error creando usuario:", error);
      console.error("Error data:", error.data);
      console.error("Error errors:", error.errors);
      
      // Extraer mensaje de error más específico
      let errorMessage = "❌ Ocurrió un error al crear el usuario.";
      
      // Prioridad 1: Si hay errores de validación en error.errors
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat();
        if (errorMessages.length > 0) {
          const firstError = errorMessages[0];
          // Mensaje específico para email duplicado
          if (firstError.includes("email has already been taken") || 
              firstError.includes("email ya existe") ||
              firstError.includes("duplicate") ||
              firstError.includes("unique")) {
            errorMessage = "❌ El email ingresado ya está registrado. Por favor, use otro email.";
          } else {
            errorMessage = `❌ ${firstError}`;
          }
        }
      }
      // Prioridad 2: Si hay mensaje en error.message
      else if (error.message) {
        // Si el error es sobre email duplicado
        if (error.message.includes("email has already been taken") || 
            error.message.includes("email ya existe") ||
            error.message.includes("duplicate") ||
            error.message.includes("unique")) {
          errorMessage = "❌ El email ingresado ya está registrado. Por favor, use otro email.";
        } else if (error.message.includes("validation") || error.message.includes("validación")) {
          errorMessage = `❌ Error de validación: ${error.message}`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      // Prioridad 3: Si hay data.errors en la respuesta
      else if (error.data?.errors) {
        const errorMessages = Object.values(error.data.errors).flat();
        if (errorMessages.length > 0) {
          errorMessage = `❌ ${errorMessages[0]}`;
        }
      }
      
      setMensaje(errorMessage);
    }
  };

  return (
    <div className="crear-usuario-container">
      <div className="crear-usuario-header">
        <h2>Crear Usuario</h2>
        <button onClick={() => navigate("/seguridad/usuarios")} className="btn-volver">
          ← Volver al listado
        </button>
      </div>

      {mensaje && (
        <div className={`mensaje ${mensaje.includes("✅") ? "success" : "error"}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crear-usuario-form">
        
        <label>Tipo de usuario:</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="empleado">Empleado</option>
          <option value="cliente">Cliente</option>
        </select>

        <label>Email:</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label>Rol:</label>
        <select value={rolID} onChange={(e)=>setRolID(e.target.value)} required>
          <option value="">Seleccione un rol</option>
          {roles.map((rol)=>(
            <option key={rol.rolID} value={rol.rolID}>{rol.nombreRol}</option>
          ))}
        </select>


        {tipo === "empleado" && (
          <>
            <label>Nombre del empleado:</label>
            <input type="text" value={empleadoNombre} onChange={(e)=>setEmpleadoNombre(e.target.value)} required />

            <label>DNI:</label>
            <input type="text" value={empleadoDNI} onChange={(e)=>setEmpleadoDNI(e.target.value)} required />

            <label>Cargo:</label>
            <input type="text" value={empleadoCargo} onChange={(e)=>setEmpleadoCargo(e.target.value)} required />
          </>
        )}

        {tipo === "cliente" && (
          <>
            <label>Nombre del cliente:</label>
            <input type="text" value={clienteNombre} onChange={(e)=>setClienteNombre(e.target.value)} required />

            <label>DNI/RUC:</label>
            <input type="text" value={clienteDNI_RUC} onChange={(e)=>setClienteDNI_RUC(e.target.value)} required />

            <label>Dirección:</label>
            <input type="text" value={clienteDireccion} onChange={(e)=>setClienteDireccion(e.target.value)} required />

            <label>País:</label>
            <input type="text" value={clientePais} onChange={(e)=>setClientePais(e.target.value)} required />
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-submit">Crear Usuario</button>
          <button
            type="button"
            onClick={() => navigate("/seguridad/usuarios")}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
