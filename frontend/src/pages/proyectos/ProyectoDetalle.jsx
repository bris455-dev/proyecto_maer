import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProyectoById } from "../../api/proyectos.js";
import { getClientes } from "../../api/clientesApi.js";
import { getClienteNombre, getEmpleadoNombre } from "../../utils/proyectoHelpers";
import "../../styles/proyectos.css";
import "../../styles/ProyectoDetalle.css";

const tratamientosDisponibles = [
  { id: 1, nombre: "Corona", color: "#3498db", precio: 10 },
  { id: 2, nombre: "Puente", color: "#9b59b6", precio: 10 },
  { id: 3, nombre: "Incrustación", color: "#f39c12", precio: 10 },
  { id: 4, nombre: "Carilla", color: "#e74c3c", precio: 10 },
  { id: 5, nombre: "Encerado", color: "#27ae60", precio: 8 },
];

const filaSuperior = ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"];
const filaInferior = ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"];

const mapDetallesDesdeBackend = (detalles = []) => {
  const piezas = [...filaSuperior, ...filaInferior];
  return piezas.map((pieza) => {
    const encontrado = detalles.find((d) => d.pieza === pieza);
    const tratamiento = tratamientosDisponibles.find(
      (t) => t.id === (encontrado?.tratamientoID || encontrado?.tratamiento_id)
    );
    return {
      pieza,
      tratamientoID: encontrado?.tratamientoID || encontrado?.tratamiento_id || null,
      color: tratamiento?.color || "#ecf0f1",
      nombreTratamiento: tratamiento?.nombre || "",
    };
  });
};

function OdontogramaLectura({ detalles }) {
  const renderFila = (fila) => (
    <div className="fila-odonto" style={{ justifyContent: "center" }}>
      {fila.map((pieza) => {
        const detalle = detalles.find((d) => d.pieza === pieza);
        return (
          <div key={pieza} className="pieza-container">
            <div
              className="pieza-dental"
              style={{ backgroundColor: detalle?.color }}
              title={`Pieza ${pieza}`}
            >
              <span>{pieza}</span>
            </div>
            <div className="nombre-tratamiento">{detalle?.nombreTratamiento}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="odontograma-grid">
      {renderFila(filaSuperior)}
      {renderFila(filaInferior)}
    </div>
  );
}

const formatFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  try { return new Date(fecha).toLocaleDateString("es-PE"); } 
  catch { return fecha; }
};

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proyecto, setProyecto] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visorActivo, setVisorActivo] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const resClientes = await getClientes();
        const listaClientes = Array.isArray(resClientes?.data)
          ? resClientes.data
          : resClientes?.clientes || [];
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
        const todosUsuarios = Array.isArray(data?.data) ? data.data : data?.usuarios || [];
        const listaEmpleados = todosUsuarios.filter((u) => {
          const rolId = u.rolID || u.rol?.rolID;
          return rolId === 1 || rolId === 2;
        });
        if (isMounted) setEmpleados(listaEmpleados);
      } catch (err) {
        console.error("Error cargando diseñadores:", err);
      }

      try {
        const respuesta = await getProyectoById(id);
        if (!isMounted) return;
        const proyectoData = respuesta?.data || respuesta?.proyecto || respuesta || {};
        setProyecto(proyectoData);
        setDetalles(mapDetallesDesdeBackend(proyectoData?.detalles || []));
      } catch (err) {
        console.error("Error cargando proyecto:", err);
        alert("No se pudo cargar el proyecto.");
        navigate("/proyectos", { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [id, navigate]);

  if (loading) return <p>Cargando proyecto...</p>;
  if (!proyecto) return <p>Proyecto no encontrado</p>;

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const getArchivoUrl = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith("http")) return ruta;
    if (ruta.startsWith("/")) return `${API_BASE_URL}${ruta}`;
    return `${API_BASE_URL}/storage/${ruta}`;
  };

  const imagenes = proyecto.imagenes || [];

  const abrirVisor = (archivo) => {
    setArchivoSeleccionado(archivo);
    setVisorActivo(true);
  };

  const cerrarVisor = () => {
    setVisorActivo(false);
    setArchivoSeleccionado(null);
  };

  return (
    <div className="proyecto-form-container">
      <div className="detalle-header">
        <h2>Detalle del Proyecto</h2>
        <div className="proyecto-detalle-acciones">
          <button className="btn-editar" onClick={() => navigate(`/proyectos/editar/${id}`)}>Editar</button>
          <button className="btn-facturacion" onClick={() => navigate(`/proyectos/facturado/${id}`)}>Ver Facturación</button>
        </div>
      </div>

      <div className="proyecto-form-grid">
        <div className="odontograma">
          <h3>Odontograma</h3>
          <OdontogramaLectura detalles={detalles} />
        </div>

        <div className="proyecto-form">
          {[ 
            { label: "Número de Proyecto", value: proyecto.numero_proyecto || proyecto.codigo || "Sin asignar" },
            { label: "Nombre / Paciente", value: proyecto.nombre || proyecto.paciente || "Sin asignar" },
            { label: "Cliente", value: getClienteNombre(
                proyecto.cliente || 
                clientes.find(c => Number(c.id || c.clienteID) === Number(proyecto.clienteID)) || 
                { nombre: proyecto.cliente_nombre }
              ) 
            },
            { label: "Diseñador", value: getEmpleadoNombre(
                proyecto.empleado || 
                empleados.find(e => Number(e.empleadoID || e.id) === Number(proyecto.empleadoID)) || 
                { nombre: proyecto.diseñador_nombre }
              ) 
            },
            { label: "Fecha Inicio", value: formatFecha(proyecto.fecha_inicio) },
            { label: "Fecha Límite", value: formatFecha(proyecto.fecha_entrega || proyecto.fecha_fin) },
            { label: "Estado", value: proyecto.estado === 1 ? "Activo" : proyecto.estado === 0 ? "Completado" : "Desconocido" },
          ].map((dato, idx) => (
            <label key={idx}>
              {dato.label}:
              <input type="text" value={dato.value} readOnly />
            </label>
          ))}

          <label>
            Notas u observaciones:
            <textarea value={proyecto.notas || ""} readOnly />
          </label>

          {imagenes.length > 0 && (
            <div className="imagenes-existentes">
              <h3>Archivos Adjuntos</h3>
              <div className="imagenes-grid">
                {imagenes.map((ruta, idx) => {
                  const archivoUrl = getArchivoUrl(ruta);
                  const nombreArchivo = ruta.split("/").pop() || `archivo-${idx + 1}`;
                  const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(nombreArchivo);

                  return (
                    <div key={idx} className="imagen-item">
                      <div className="imagen-placeholder">{nombreArchivo}</div>
                      <div className="imagen-acciones">
                        <button onClick={() => abrirVisor(archivoUrl)} disabled={!esImagen}>Ver</button>
                        <a href={archivoUrl} download={nombreArchivo}>
                          <button>Descargar</button>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {visorActivo && archivoSeleccionado && (
        <div className="visor-modal" onClick={cerrarVisor}>
          <div className="visor-content" onClick={(e) => e.stopPropagation()}>
            <button className="visor-cerrar" onClick={cerrarVisor}>X</button>
            <img src={archivoSeleccionado} alt="Vista previa" />
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button className="btn-cancelar" onClick={() => navigate("/proyectos")}>Volver</button>
      </div>
    </div>
  );
}
