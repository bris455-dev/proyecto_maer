// src/pages/proyectos/ProyectoForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientes } from "../../api/clientesApi.js";
import {
  createProyecto,
  updateProyecto,
  uploadProyectoImages,
  getProyectoById,
  getNextProyectoCodigo,
} from "../../api/proyectos.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getTipificacionesEditables } from "../../utils/tipificaciones.js";
import "../../styles/proyectos.css";
import "../../styles/ProyectoOdontograma.css";
import "../../styles/chat.css";

/* ============================================================
   CONFIGURACIÓN DE CATÁLOGOS Y FORMATOS
   ============================================================ */
const CODIGO_INICIAL = "PD-0000010";
const CODIGO_STORAGE_KEY = "maer_last_project_code";

const tratamientosDisponibles = [
  { id: 1, nombre: "Corona", color: "#3498db", precio: 10 },
  { id: 2, nombre: "Puente", color: "#9b59b6", precio: 10 },
  { id: 3, nombre: "Incrustación", color: "#f39c12", precio: 10 },
  { id: 4, nombre: "Carilla", color: "#e74c3c", precio: 10 },
  { id: 5, nombre: "Encerado", color: "#27ae60", precio: 8 },
];

/* ================================
   NUEVO ORDEN REAL DEL ODONTOGRAMA
   ================================ */
const piezasOdonto = [
  // Arco superior derecho → izquierdo
  ["18", "17", "16", "15", "14", "13", "12", "11"],

  // Arco superior izquierdo → derecho
  ["21", "22", "23", "24", "25", "26", "27", "28"],

  // Arco inferior derecho → izquierdo
  ["48", "47", "46", "45", "44", "43", "42", "41"],

  // Arco inferior izquierdo → derecho
  ["31", "32", "33", "34", "35", "36", "37", "38"]
];

/* ================================
   DETALLES BASE PARA TODAS LAS PIEZAS
   ================================ */
const crearDetalleBase = () =>
  piezasOdonto.flat().map((pieza) => ({
    pieza,
    tratamientoID: null,
    color: "#ecf0f1",
    precio: 0
  }));


const mapDetallesDesdeBackend = (detalles = []) => {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return crearDetalleBase();
  }

  const base = crearDetalleBase();

  return base.map((detalle) => {
    const encontrado = detalles.find((d) => d.pieza === detalle.pieza);
    if (!encontrado) return detalle;

    const tratamiento = tratamientosDisponibles.find(
      (t) =>
        t.id === encontrado.tratamientoID ||
        t.id === encontrado.tratamiento_id
    );

    return {
      pieza: encontrado.pieza,
      tratamientoID: encontrado.tratamientoID || encontrado.tratamiento_id,
      color: tratamiento?.color || "#ecf0f1",
      precio: tratamiento?.precio || encontrado.precio || 0,
    };
  });
};

const generarCodigoLocal = (prefijo = CODIGO_INICIAL) => {
  const ultimo = localStorage.getItem(CODIGO_STORAGE_KEY);
  if (!ultimo) {
    localStorage.setItem(CODIGO_STORAGE_KEY, prefijo);
    return prefijo;
  }

  const [, numero = "0"] = ultimo.split("-");
  const siguiente = (parseInt(numero, 10) || 0) + 1;
  const nuevoCodigo = `PD-${siguiente.toString().padStart(numero.length || 7, "0")}`;
  localStorage.setItem(CODIGO_STORAGE_KEY, nuevoCodigo);
  return nuevoCodigo;
};

const normalizarColeccion = (raw, posiblesClaves = []) => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.data)) return raw.data;
  for (const key of posiblesClaves) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  return [];
};

const getClienteId = (cliente) =>
  cliente?.id ??
  cliente?.clienteID ??
  cliente?.clienteId ??
  cliente?.cliente_id ??
  cliente?.ID ??
  null;

const getEmpleadoId = (empleado) => {
  // Priorizar empleadoID (ID del empleado en la tabla empleado)
  // No usar id del usuario, sino empleadoID
  return (
    empleado?.empleadoID ??
    empleado?.empleadoId ??
    empleado?.empleado_id ??
    empleado?.id ??
    null
  );
};

const getClienteNombre = (cliente) =>
  cliente?.nombre ||
  cliente?.razon_social ||
  cliente?.empresa ||
  "Cliente sin nombre";

const getEmpleadoNombre = (empleado) =>
  empleado?.nombre ||
  `${empleado?.nombres || ""} ${empleado?.apellidos || ""}`.trim() ||
  empleado?.email ||
  "Sin nombre";

export default function ProyectoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [proyecto, setProyecto] = useState({
    numero_proyecto: "",
    nombre: "",
    clienteID: "",
    empleadoID: "",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_entrega: "",
    notas: "",
    nueva_nota: "",
    estado: 1,
    tipificacion: "Pendiente",
  });

  // Estado para imágenes existentes (para mostrar en edición)
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  
  // Estado para el historial de notas y archivos
  const [historial, setHistorial] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [detalles, setDetalles] = useState(crearDetalleBase());
  const [images, setImages] = useState([]);
  const [codigoCargando, setCodigoCargando] = useState(!id);
  const [codigoError, setCodigoError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  /* ============================================================
     Cargar catálogos y, si aplica, el proyecto a editar
     ============================================================ */
  useEffect(() => {
    let isMounted = true;
    let hasFetched = false; // Prevenir múltiples llamadas

    const fetchData = async () => {
      if (hasFetched) return; // Si ya se ejecutó, no hacer nada
      hasFetched = true;
      try {
        const resClientes = await getClientes();
        const listaClientes = normalizarColeccion(resClientes, ["clientes"]);
        if (isMounted) setClientes(listaClientes);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }

      try {
        const token = localStorage.getItem("auth_token");
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const respuesta = await fetch(`${API_BASE}/api/usuarios`, {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
const data = await respuesta.json().catch(() => ({}));

const todosUsuarios = normalizarColeccion(data, ["data", "usuarios"]);

        // Filtrar solo usuarios que tienen empleadoID válido
        // Solo diseñadores (rol 2) y admins (rol 1) que tienen empleadoID asociado
const listaEmpleados = todosUsuarios.filter((u) => {
  const rolId = u.rolID || u.rol?.rolID;
          const empId = getEmpleadoId(u);
          
          // Solo incluir si tiene empleadoID válido (no null, no undefined, no string vacío)
          // y es admin o diseñador
          if (!empId || empId === "" || empId === null || empId === undefined) {
            return false;
          }
          
          // Solo incluir admin (rol 1) o diseñador (rol 2)
  return rolId === 1 || rolId === 2;
});

if (isMounted) setEmpleados(listaEmpleados);

      } catch (err) {
        console.error("Error cargando diseñadores:", err);
      }

      if (id) {
        try {
          const respuesta = await getProyectoById(id);
          if (!isMounted) return;

          // Manejar diferentes formatos de respuesta
          const proyectoData =
            respuesta?.data || respuesta?.proyecto || respuesta || {};

          // Asegurar que todos los valores sean strings o números válidos
          setProyecto({
            numero_proyecto: proyectoData.numero_proyecto || "",
            nombre: proyectoData.nombre || "",
            clienteID: proyectoData.clienteID ? String(proyectoData.clienteID) : "",
            empleadoID: proyectoData.empleadoID ? String(proyectoData.empleadoID) : "",
            fecha_inicio: proyectoData.fecha_inicio
              ? proyectoData.fecha_inicio.split("T")[0]
              : "",
            fecha_fin: proyectoData.fecha_fin
              ? proyectoData.fecha_fin.split("T")[0]
              : "",
            fecha_entrega: proyectoData.fecha_entrega
              ? proyectoData.fecha_entrega.split("T")[0]
              : "",
            notas: proyectoData.notas || "",
            estado: proyectoData.estado ?? 1,
            tipificacion: proyectoData.tipificacion || "Pendiente",
          });

          setDetalles(mapDetallesDesdeBackend(proyectoData.detalles || []));
          
          // No necesitamos cargar imagenesExistentes por separado
          // Los archivos ya están en el historial y se muestran ahí
          setImagenesExistentes([]);
          
          // Cargar historial de notas y archivos
          if (proyectoData.historial && Array.isArray(proyectoData.historial)) {
            setHistorial(proyectoData.historial);
            console.log("📋 ProyectoForm - Historial cargado:", proyectoData.historial.length);
          } else {
            setHistorial([]);
            console.log("📋 ProyectoForm - Historial vacío o no es array");
          }
        } catch (err) {
          console.error("Error cargando proyecto:", err);
          alert("No se pudo cargar el proyecto seleccionado");
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      hasFetched = false;
    };
  }, [id]);

  /* ============================================================
     Consecutivo automático para nuevos proyectos
     ============================================================ */
  useEffect(() => {
    if (id) return;
    let isMounted = true;

    const cargarCodigo = async () => {
      setCodigoCargando(true);
      try {
        const codigo = await getNextProyectoCodigo();
        const valorCodigo =
          (typeof codigo === "string" && codigo) ||
          codigo?.numero_proyecto ||
          codigo?.codigo ||
          "";

        if (valorCodigo) {
        localStorage.setItem(CODIGO_STORAGE_KEY, valorCodigo);
        if (isMounted) {
          setProyecto((prev) => ({ ...prev, numero_proyecto: valorCodigo }));
          setCodigoError(null);
        }
        } else {
          // Si no hay código del servidor, usar fallback local
          const fallback = generarCodigoLocal();
          if (isMounted) {
            setProyecto((prev) => ({ ...prev, numero_proyecto: fallback }));
            setCodigoError(null);
          }
        }
      } catch (err) {
        // Silenciosamente usar código local si falla
        const fallback = generarCodigoLocal();
        if (isMounted) {
          setProyecto((prev) => ({ ...prev, numero_proyecto: fallback }));
          setCodigoError(null);
        }
      } finally {
        if (isMounted) setCodigoCargando(false);
      }
    };

    cargarCodigo();
    return () => {
      isMounted = false;
    };
  }, [id]);


  /* ============================================================
     Handlers
     ============================================================ */
  const handleChange = (e) =>
    setProyecto({ ...proyecto, [e.target.name]: e.target.value });

  const handleTratamientoChange = (pieza, tratamientoID) => {
    const tratamiento = tratamientosDisponibles.find(
      (t) => t.id === Number(tratamientoID)
    );

    setDetalles((prev) =>
      prev.map((d) =>
        d.pieza === pieza
          ? {
              ...d,
              tratamientoID: tratamiento?.id || null,
              color: tratamiento?.color || "#ecf0f1",
              precio: tratamiento?.precio || 0,
            }
          : d
      )
    );
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  /* ============================================================
     SUBMIT FINAL
     ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!proyecto.numero_proyecto) {
      alert("No se pudo asignar un número de proyecto. Intente nuevamente.");
      return;
    }

    const detallesSeleccionados = detalles.filter((d) => d.tratamientoID);
    if (detallesSeleccionados.length === 0) {
      alert("Debes seleccionar al menos una pieza con tratamiento.");
      return;
    }

    setGuardando(true);

    try {
      // Preparar detalles con precio y color (formato que espera el backend)
      const detallesFormateados = detallesSeleccionados.map((d) => {
        const tratamiento = tratamientosDisponibles.find(
          (t) => t.id === d.tratamientoID
        );
        // Asegurar que tratamientoID sea un entero
        const tratamientoID = Number(d.tratamientoID);
        if (isNaN(tratamientoID) || tratamientoID <= 0) {
          throw new Error(`Tratamiento inválido para la pieza ${d.pieza}`);
        }
        return {
          pieza: String(d.pieza),
          tratamientoID: tratamientoID,
          precio: tratamiento?.precio || 10, // Precio según tratamiento
          color: tratamiento?.color || null,
        };
      });

      // Asegurar que empleadoID y clienteID sean enteros válidos o null
      const clienteIDVal = proyecto.clienteID
        ? Number(proyecto.clienteID)
        : null;
      const empleadoIDVal = proyecto.empleadoID
        ? Number(proyecto.empleadoID)
        : null;

      // Validar que los IDs sean números válidos
      if (clienteIDVal !== null && (isNaN(clienteIDVal) || clienteIDVal <= 0)) {
        alert("El cliente seleccionado no es válido");
        return;
      }
      if (
        empleadoIDVal !== null &&
        (isNaN(empleadoIDVal) || empleadoIDVal <= 0)
      ) {
        alert("El diseñador seleccionado no es válido");
        return;
      }

      // Validar que se haya seleccionado cliente y diseñador
      if (!clienteIDVal) {
        alert("Debe seleccionar un cliente");
        return;
      }
      if (!empleadoIDVal) {
        alert("Debe seleccionar un diseñador");
        return;
      }

      // Preparar payload con validaciones
      const payload = {
        nombre: String(proyecto.nombre || "").trim(),
        numero_proyecto: proyecto.numero_proyecto ? String(proyecto.numero_proyecto).trim() : null,
        clienteID: clienteIDVal,
        empleadoID: empleadoIDVal,
        fecha_inicio: proyecto.fecha_inicio || null,
        fecha_fin: proyecto.fecha_fin || null,
        fecha_entrega: proyecto.fecha_entrega || null,
        notas: proyecto.notas ? String(proyecto.notas).trim() : null,
        estado: Number(proyecto.estado) || 1,
        tipificacion: proyecto.tipificacion || "Pendiente",
        detalles: detallesFormateados,
      };
      
      // Si hay nueva nota en edición, agregarla al payload
      if (id && proyecto.nueva_nota && proyecto.nueva_nota.trim()) {
        payload.nueva_nota = proyecto.nueva_nota.trim();
        // Si hay archivos seleccionados, se asociarán a la nueva nota en el backend
        // Los archivos se envían por separado en FormData
      }
      
      // Validar que el nombre no esté vacío
      if (!payload.nombre || payload.nombre.length === 0) {
        alert("El nombre del proyecto es obligatorio");
        return;
      }
      
      // Validar que haya al menos un detalle
      if (!payload.detalles || payload.detalles.length === 0) {
        alert("Debe seleccionar al menos una pieza con tratamiento");
        return;
      }
      
      console.log("Payload a enviar:", JSON.stringify(payload, null, 2));

      let respuesta;

      if (id) {
        // Al editar, enviar archivos junto con la actualización si hay
        console.log("📝 Editando proyecto. Archivos a enviar:", images.length);
        console.log("📝 Payload:", JSON.stringify(payload, null, 2));
        respuesta = await updateProyecto(id, payload, images);
      } else {
        // Al crear, enviar archivos junto con la creación si hay
        console.log("🚀 ProyectoForm - Llamando a createProyecto");
        console.log("🚀 URL que se usará:", `/api/proyectos`);
        console.log("🚀 Payload completo:", JSON.stringify(payload, null, 2));
        console.log("🚀 Archivos:", images.length);
        
        try {
          respuesta = await createProyecto(payload, images);
          console.log("✅ createProyecto completado. Respuesta:", respuesta);
        } catch (error) {
          console.error("❌ Error en createProyecto:", error);
          console.error("❌ Error status:", error.status);
          console.error("❌ Error data:", error.data);
          throw error;
        }
      }

      const proyectoId =
        id ||
        respuesta?.proyectoID ||
        respuesta?.id ||
        respuesta?.data?.proyectoID;
      
      console.log("📋 ProyectoID extraído:", proyectoId);

      // Si estamos creando, las imágenes se envían junto con la creación (ya se maneja en el backend)
      // No necesitamos subirlas por separado porque ya se procesan en el store del backend

      // Limpiar nueva_nota y recargar datos completos después de guardar
      if (id) {
        setProyecto(prev => ({ ...prev, nueva_nota: "" }));
        setImages([]); // Limpiar imágenes seleccionadas
        
        // Recargar el proyecto completo para obtener historial e imágenes actualizados
        try {
          const respuesta = await getProyectoById(id);
          const proyectoData = respuesta?.data || respuesta?.proyecto || respuesta || {};
          
          // Recargar historial
          if (proyectoData.historial && Array.isArray(proyectoData.historial)) {
            setHistorial(proyectoData.historial);
            console.log("✅ Historial recargado:", proyectoData.historial.length, "mensajes");
          } else {
            setHistorial([]);
          }
          
          // No necesitamos cargar imagenesExistentes por separado
          // Los archivos ya están en el historial y se muestran ahí
          setImagenesExistentes([]);
        } catch (err) {
          console.error("Error recargando datos después de actualizar:", err);
        }
      }
      
      if (!id) {
        // Si se creó un nuevo proyecto, recargar los datos para mostrar imágenes e historial
        if (proyectoId) {
          try {
            const respuestaCompleta = await getProyectoById(proyectoId);
            const proyectoDataCompleto = respuestaCompleta?.data || respuestaCompleta?.proyecto || respuestaCompleta || {};
            
            console.log("📋 ProyectoForm - Proyecto creado - Historial:", proyectoDataCompleto.historial?.length || 0);
            console.log("📋 ProyectoForm - Proyecto creado - Imágenes:", proyectoDataCompleto.imagenes?.length || 0);
            
            if (proyectoDataCompleto.historial && Array.isArray(proyectoDataCompleto.historial)) {
              setHistorial(proyectoDataCompleto.historial);
            }
            
            // No necesitamos cargar imagenesExistentes por separado
            // Los archivos ya están en el historial
            setImagenesExistentes([]);
          } catch (err) {
            console.error("Error recargando proyecto después de crear:", err);
          }
        }
      alert("Proyecto guardado correctamente");
      }
      navigate("/proyectos");
    } catch (error) {
      console.error("Error guardando:", error);
      console.error("Error completo:", error.data || error);
      console.error("Error status:", error.status);
      
      let errorMessage = "Error al guardar proyecto";
      const validationErrors = error.data?.errors;
      
      if (validationErrors) {
        const errorList = Object.entries(validationErrors)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${msg}`;
          })
          .join('\n');
        errorMessage = `Error de validación:\n${errorList}`;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar mensaje más detallado
      alert(`Error: ${errorMessage}\n\nPor favor, verifique:\n- Que todos los campos estén completos\n- Que los tratamientos existan en la base de datos\n- Que el cliente y diseñador sean válidos`);
    } finally {
      setGuardando(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="proyecto-form-container">
      <h2>{id ? "Editar Proyecto" : "Nuevo Proyecto"}</h2>

      <div className="proyecto-form-grid">
        {/* ODONTOGRAMA */}
        <div className="odontograma">
          <h3>Odontograma</h3>
          <p className="codigo-ayuda">
            Selecciona la pieza y el tratamiento. El total se calcula automáticamente.
          </p>

          <div className="odontograma-grid">

  {/* ===== FILA SUPERIOR ===== */}
  <div className="fila-odonto">
    {["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"].map((pieza) => {
      const d = detalles.find((x) => x.pieza === pieza);
      return (
        <div key={pieza} className="pieza-container">
          <div
            className="pieza-dental"
            style={{ backgroundColor: d?.color }}
            title={`Pieza ${pieza}`}
          >
            <span>{pieza}</span>
          </div>

          <select className="select-tratamiento"
            value={d?.tratamientoID || ""}
            onChange={(e) => handleTratamientoChange(pieza, e.target.value)}
          >
            <option value="">-- Tratamiento --</option>
            {tratamientosDisponibles.map((t) => (
              <option key={`${pieza}-trat-${t.id}`} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      );
    })}
  </div>

  {/* ===== FILA INFERIOR ===== */}
  <div className="fila-odonto">
    {["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"].map((pieza) => {
      const d = detalles.find((x) => x.pieza === pieza);
      return (
        <div key={pieza} className="pieza-container">
          <div
            className="pieza-dental"
            style={{ backgroundColor: d?.color }}
            title={`Pieza ${pieza}`}
          >
            <span>{pieza}</span>
          </div>

          <select className="select-tratamiento"
            value={d?.tratamientoID || ""}
            onChange={(e) => handleTratamientoChange(pieza, e.target.value)}
          >
            <option value="">-- Tratamiento --</option>
            {tratamientosDisponibles.map((t) => (
              <option key={`${pieza}-trat-${t.id}`} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      );
    })}
  </div>
</div>
</div>

        {/* FORMULARIO GENERAL */}
        <form className="proyecto-form" onSubmit={handleSubmit}>
          <label>
            Número de Proyecto:
            <input
              type="text"
              name="numero_proyecto"
              value={proyecto.numero_proyecto || ""}
              readOnly
            />
            {codigoCargando && (
              <span className="codigo-ayuda">Generando código...</span>
            )}
            {codigoError && <span className="codigo-ayuda">{codigoError}</span>}
          </label>

          <label>
            Nombre / Paciente:
            <input
              type="text"
              name="nombre"
              value={proyecto.nombre || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Cliente:
            <select
              name="clienteID"
              value={proyecto.clienteID || ""}
              onChange={handleChange}
              required
              disabled={!!id}
              title={id ? "El cliente no se puede modificar" : ""}
            >
              <option value="">-- Seleccionar cliente --</option>
              {(Array.isArray(clientes) ? clientes : []).map((c, index) => {
                const optionId = getClienteId(c) ?? `tmp-${index}`;
                return (
                  <option key={`cli-${optionId}`} value={getClienteId(c) || ""}>
                    {getClienteNombre(c)}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
  Diseñador:
  <select
    name="empleadoID"
    value={proyecto.empleadoID || ""}
    onChange={handleChange}
    required
    disabled={!!id}
    title={id ? "El diseñador no se puede modificar" : ""}
  >
    <option value="">-- Seleccionar diseñador --</option>

    {(Array.isArray(empleados) ? empleados : [])
      .filter(e => {
        const empId = getEmpleadoId(e);
        return empId !== null && empId !== undefined && empId !== "";
      })
      // Eliminar duplicados por empleadoID (mantener el primero)
      .filter((e, index, self) => {
        const empId = getEmpleadoId(e);
        return self.findIndex(emp => getEmpleadoId(emp) === empId) === index;
      })
      .map((e, index) => {
        const empId = getEmpleadoId(e);
        const userId = e.id || e.userID || `user-${index}`;
        // Usar combinación de userId y empId para hacer la key única
        return (
          <option key={`emp-${userId}-${empId}-${index}`} value={empId}>
        {getEmpleadoNombre(e)}
      </option>
        );
      })}

  </select>
</label>


          <label>
            Fecha Inicio:
            <input
              type="date"
              name="fecha_inicio"
              value={proyecto.fecha_inicio || ""}
              onChange={handleChange}
              required
              disabled={!!id}
              title={id ? "La fecha de inicio no se puede modificar" : ""}
            />
          </label>

          <label>
            Fecha Límite:
            <input
              type="date"
              name="fecha_fin"
              value={proyecto.fecha_fin || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Fecha de Entrega:
            <input
              type="date"
              name="fecha_entrega"
              value={proyecto.fecha_entrega || ""}
              onChange={handleChange}
              required
            />
          </label>

          {id && (
          <label>
              Tipificación:
              <select
                name="tipificacion"
                value={proyecto.tipificacion || "Pendiente"}
                onChange={handleChange}
              >
                {getTipificacionesEditables(user?.rolID).map((tip) => (
                  <option key={tip.nombre} value={tip.nombre}>
                    {tip.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {id ? (
            <>
              {/* Mostrar historial de notas y archivos */}
              <div className="chat-notas">
                <h3>Historial de Notas y Comentarios</h3>
                <div className="chat-mensajes">
                  {historial.length > 0 ? (
                    historial.map((item, index) => {
                      const fecha = item.created_at 
                        ? new Date(item.created_at).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Sin fecha';
                      
                      let archivos = [];
                      try {
                        if (item.archivos) {
                          if (Array.isArray(item.archivos)) {
                            archivos = item.archivos;
                          } else if (typeof item.archivos === 'string') {
                            try {
                              archivos = JSON.parse(item.archivos);
                            } catch (parseError) {
                              // Si no es JSON válido, intentar como string simple
                              archivos = [item.archivos];
                            }
                          } else if (typeof item.archivos === 'object') {
                            archivos = [item.archivos];
                          }
                        }
                      } catch (e) {
                        console.warn("Error parseando archivos:", e, item.archivos);
                        archivos = [];
                      }
                      
                      return (
                        <div key={item.id || index} className="mensaje-chat">
                          <div className="mensaje-header">
                            <strong>{item.usuario_nombre || 'Usuario'}</strong>
                            <span className="mensaje-fecha">{fecha}</span>
                          </div>
                          {item.nota && (
                            <div className="mensaje-texto">{item.nota}</div>
                          )}
                          {archivos && archivos.length > 0 && (
                            <div className="mensaje-archivos-lista">
                              {archivos.map((archivo, idx) => {
                                if (!archivo) return null;
                                
                                // Manejar diferentes formatos de archivo
                                let archivoRuta = '';
                                let nombreArchivo = '';
                                
                                if (typeof archivo === 'string') {
                                  archivoRuta = archivo;
                                  nombreArchivo = archivo.split("/").pop() || archivo.split("\\").pop() || `archivo-${idx + 1}`;
                                } else if (archivo && typeof archivo === 'object') {
                                  archivoRuta = archivo.ruta || archivo.url || archivo.path || archivo.name || '';
                                  nombreArchivo = archivo.nombre || archivo.name || archivoRuta.split("/").pop() || archivoRuta.split("\\").pop() || `archivo-${idx + 1}`;
                                }
                                
                                if (!archivoRuta) return null;
                                
                                const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
                                const archivoUrl = archivoRuta.startsWith('http') 
                                  ? archivoRuta 
                                  : archivoRuta.startsWith('/storage/')
                                  ? `${API_BASE_URL}${archivoRuta}`
                                  : `${API_BASE_URL}/storage/${archivoRuta.replace(/^\//, '')}`;
                                const esImagen = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nombreArchivo);
                                const esSTL = /\.(stl)$/i.test(nombreArchivo);
                                
                                return (
                                  <div key={idx} className="archivo-fila">
                                    <span className="archivo-icono">
                                      {esImagen ? '🖼️' : esSTL ? '📦' : '📎'}
                                    </span>
                                    <a
                                      href={archivoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={nombreArchivo}
                                      className="archivo-enlace"
                                    >
                                      {nombreArchivo}
                                    </a>
                                    {esImagen && (
                                      <img
                                        src={archivoUrl}
                                        alt={nombreArchivo}
                                        className="archivo-preview"
                                        onClick={() => window.open(archivoUrl, '_blank')}
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="sin-mensajes">No hay notas o comentarios aún</div>
                  )}
                </div>
              </div>

              <div className="chat-notas-edicion">
                <h3>Agregar Nota o Comentario</h3>
                <label>
                  Nueva nota:
                  <textarea
                    name="nueva_nota"
                    value={proyecto.nueva_nota || ""}
                    onChange={handleChange}
                    placeholder="Escribe tu comentario aquí..."
                  ></textarea>
                </label>
                <small>Esta nota se agregará al historial del proyecto con tu nombre</small>
              </div>
            </>
          ) : (
            <label>
              Notas iniciales:
            <textarea
              name="notas"
              value={proyecto.notas || ""}
              onChange={handleChange}
                placeholder="Notas iniciales del proyecto..."
            ></textarea>
          </label>
          )}

          <label>
            Adjuntar archivos (imágenes, STL, documentos, etc.):
            <input type="file" multiple onChange={handleImages} />
            {images.length > 0 && (
              <div className="imagenes-nuevas">
                <p>Archivos seleccionados: {images.length}</p>
                <ul style={{ fontSize: '12px', color: '#666', marginTop: '5px', paddingLeft: '20px' }}>
                  {images.map((file, idx) => (
                    <li key={idx}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </label>

          <button type="submit" className="btn-submit" disabled={guardando}>
            {guardando ? "Guardando..." : id ? "Actualizar Proyecto" : "Crear Proyecto"}
          </button>
          <button  type="button" className="btn-cancelar" onClick={() => navigate("/proyectos")} >
             Cancelar
          </button>

        </form>
      </div>
    </div>
  );
}
