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
import "../../styles/proyectos.css";
import "../../styles/ProyectoOdontograma.css";

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

  const [proyecto, setProyecto] = useState({
    numero_proyecto: "",
    nombre: "",
    clienteID: "",
    empleadoID: "",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_entrega: "",
    notas: "",
    estado: 1,
  });

  // Estado para imágenes existentes (para mostrar en edición)
  const [imagenesExistentes, setImagenesExistentes] = useState([]);

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

    const fetchData = async () => {
      try {
        const resClientes = await getClientes();
        const listaClientes = normalizarColeccion(resClientes, ["clientes"]);
        if (isMounted) setClientes(listaClientes);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }

      try {
        const token = localStorage.getItem("auth_token");
const respuesta = await fetch("/api/usuarios", {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
const data = await respuesta.json().catch(() => ({}));

const todosUsuarios = normalizarColeccion(data, ["data", "usuarios"]);

// Filtrar solo rol 1 (admin) y rol 2 (diseñador)
const listaEmpleados = todosUsuarios.filter((u) => {
  const rolId = u.rolID || u.rol?.rolID;
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
          });

          setDetalles(mapDetallesDesdeBackend(proyectoData.detalles || []));
          
          // Cargar imágenes existentes
          if (proyectoData.imagenes && Array.isArray(proyectoData.imagenes)) {
            setImagenesExistentes(proyectoData.imagenes);
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

        if (!valorCodigo) {
          throw new Error("Sin código del servidor");
        }

        localStorage.setItem(CODIGO_STORAGE_KEY, valorCodigo);
        if (isMounted) {
          setProyecto((prev) => ({ ...prev, numero_proyecto: valorCodigo }));
          setCodigoError(null);
        }
      } catch {
        // Silenciosamente usar código local si falla
        const fallback = generarCodigoLocal();
        if (isMounted) {
          setProyecto((prev) => ({ ...prev, numero_proyecto: fallback }));
          setCodigoError(null); // No mostrar error, es normal que no exista el endpoint
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
        return {
          pieza: d.pieza,
          tratamientoID: d.tratamientoID,
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

      const payload = {
        ...proyecto,
        clienteID: clienteIDVal,
        empleadoID: empleadoIDVal,
        detalles: detallesFormateados,
        // No enviar total_estimado, el backend lo calcula
      };

      let respuesta;

      if (id) {
        respuesta = await updateProyecto(id, payload);
      } else {
        respuesta = await createProyecto(payload);
      }

      const proyectoId =
        id ||
        respuesta?.proyectoID ||
        respuesta?.id ||
        respuesta?.data?.proyectoID;

      if (images.length > 0 && proyectoId) {
        const formData = new FormData();
        images.forEach((file) => formData.append("images[]", file));
        await uploadProyectoImages(proyectoId, formData);
      }

      alert("Proyecto guardado correctamente");
      navigate("/proyectos");
    } catch (error) {
      console.error("Error guardando:", error);
      alert(error.message || "Error al guardar proyecto");
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
              <option key={t.id} value={t.id}>{t.nombre}</option>
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
              <option key={t.id} value={t.id}>{t.nombre}</option>
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

    {(Array.isArray(empleados) ? empleados : []).map((e, index) => (
      <option key={`emp-${index}`} value={getEmpleadoId(e) || ""}>
        {getEmpleadoNombre(e)}
      </option>
    ))}

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

          <label>
            Notas u observaciones:
            <textarea
              name="notas"
              value={proyecto.notas || ""}
              onChange={handleChange}
            ></textarea>
          </label>

          <label>
            Adjuntar imágenes:
            <input type="file" multiple onChange={handleImages} accept="image/*" />
            {images.length > 0 && (
              <div className="imagenes-nuevas">
                <p>Nuevas imágenes seleccionadas: {images.length}</p>
              </div>
            )}
          </label>

          {/* Mostrar imágenes existentes en modo edición */}
          {id && imagenesExistentes.length > 0 && (
            <div className="imagenes-existentes">
              <label>Imágenes actuales:</label>
              <div className="imagenes-grid-mini">
                {imagenesExistentes.map((ruta, index) => {
                  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
                  const imageUrl = ruta.startsWith("http")
                    ? ruta
                    : ruta.startsWith("/")
                    ? `${API_BASE_URL}${ruta}`
                    : `${API_BASE_URL}/storage/${ruta}`;
                  const nombreArchivo = ruta.split("/").pop() || `imagen-${index + 1}`;
                  return (
                    <div key={index} className="imagen-existente-item">
                      <span className="imagen-nombre">{nombreArchivo}</span>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ver-mini"
                      >
                        Ver
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
