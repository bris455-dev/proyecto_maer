import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/NuevoRol.css";

const NuevoRol = () => {
  const navigate = useNavigate();
  const [nombreRol, setNombreRol] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPermisos = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/api/permisos", {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
          }
        });
        const data = await res.json();
        setPermisos(data.data || []);
      } catch (err) {
        console.error("Error cargando permisos", err);
        setPermisos([]);
        setMensaje({ texto: "Error al cargar los permisos disponibles.", tipo: "error" });
      } finally {
        setLoading(false);
      }
    };
    cargarPermisos();
  }, []);

  const togglePermiso = (id) => {
    setPermisosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const guardarRol = async () => {
    const nombreRolTrimmed = nombreRol.trim();
    
    if (!nombreRolTrimmed) {
      setMensaje({ texto: "El nombre del rol es obligatorio", tipo: "error" });
      return;
    }

    setMensaje({ texto: "", tipo: "" });

    try {
      // Crear el rol
      const res = await fetch("http://localhost:8080/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ nombreRol: nombreRolTrimmed })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creando rol - Respuesta completa:", data);
        console.error("Error creando rol - Errors detallado:", JSON.stringify(data.errors, null, 2));
        
        // Manejar errores de validación (422)
        if (res.status === 422 && data.errors) {
          // Extraer mensajes de error de forma más detallada
          let errorMessages = [];
          if (data.errors.nombreRol) {
            errorMessages.push(...(Array.isArray(data.errors.nombreRol) ? data.errors.nombreRol : [data.errors.nombreRol]));
          }
          if (data.errors.permisos) {
            errorMessages.push(...(Array.isArray(data.errors.permisos) ? data.errors.permisos : [data.errors.permisos]));
          }
          
          // Si no hay mensajes específicos, usar todos los errores
          if (errorMessages.length === 0) {
            errorMessages = Object.values(data.errors).flat();
          }
          
          const errorText = errorMessages.join(', ');
          
          // Mensaje específico para rol duplicado
          if (errorText.includes("has already been taken") || 
              errorText.includes("ya existe") || 
              errorText.includes("unique") ||
              errorText.includes("duplicate")) {
            setMensaje({ texto: "Este nombre de rol ya existe. Por favor, elija otro nombre.", tipo: "error" });
          } else {
            setMensaje({ texto: `Error de validación: ${errorText}`, tipo: "error" });
          }
          return;
        }
        
        // Si el rol ya existe (puede venir en errors o message)
        if (data.errors?.nombreRol || 
            data.message?.includes("has already been taken") || 
            data.message?.includes("ya existe") || 
            data.message?.includes("unique") ||
            data.message?.includes("duplicate")) {
          setMensaje({ texto: "Este nombre de rol ya existe. Por favor, elija otro nombre.", tipo: "error" });
          return;
        }
        
        console.error("Error creando rol:", data);
        setMensaje({ texto: data.message || "No se pudo crear el rol", tipo: "error" });
        return;
      }

      const rolID = data.data?.rolID;

      // Asignar permisos si hay alguno seleccionado
      if (rolID && permisosSeleccionados.length > 0) {
        const resPermisos = await fetch(
          `http://localhost:8080/api/roles/${rolID}/permisos/sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
            },
            body: JSON.stringify({ permisos: permisosSeleccionados })
          }
        );

        const dataPermisos = await resPermisos.json();
        if (!resPermisos.ok) {
          console.error("Error asignando permisos:", dataPermisos);
          setMensaje({ texto: dataPermisos.message || "No se pudieron asignar permisos", tipo: "error" });
          return;
        }
      }

      setMensaje({ texto: "✅ Rol creado correctamente" + (permisosSeleccionados.length > 0 ? " con permisos asignados" : ""), tipo: "success" });
      setNombreRol("");
      setPermisosSeleccionados([]);

      // Redirigir al listado después de 2 segundos
      setTimeout(() => {
        navigate("/seguridad/roles");
      }, 2000);

    } catch (error) {
      console.error("Error guardando rol:", error);
      setMensaje({ texto: "Ocurrió un error guardando el rol", tipo: "error" });
    }
  };



  return (
    <div className="nuevo-rol-container">
      <div className="nuevo-rol-header">
        <h1>Nuevo Rol</h1>
        <button onClick={() => navigate("/seguridad/roles")} className="btn-volver">
          ← Volver al listado
        </button>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <form className="nuevo-rol-form" onSubmit={(e) => { e.preventDefault(); guardarRol(); }}>
        <label>
          Nombre del Rol:
          <input
            type="text"
            value={nombreRol}
            onChange={e => setNombreRol(e.target.value)}
            placeholder="Ejemplo: Administrador, Cliente, etc"
            required
          />
        </label>

        <div className="permisos-section">
          <h3>Permisos Disponibles</h3>
          <div className="permisos-container">
            {loading ? (
              <div className="permisos-loading">Cargando permisos...</div>
            ) : permisos.length === 0 ? (
              <div className="permisos-empty">No hay permisos disponibles</div>
            ) : (
              permisos.map((p, index) => (
                <label key={`${p.id || p.permisoID}-${index}`} className="permiso-item">
                  <span className="permiso-texto">{p.nombreModulo} → {p.nombreSubmodulo}</span>
                  <div className="permiso-checkbox">
                    <input
                      type="checkbox"
                      checked={permisosSeleccionados.includes(p.id || p.permisoID)}
                      onChange={() => togglePermiso(p.id || p.permisoID)}
                    />
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/seguridad/roles")}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-submit"
          >
            Guardar Rol
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoRol;
