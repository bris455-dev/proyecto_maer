import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProyectoById } from "../../api/proyectos.js";
import { getClientes } from "../../api/clientesApi.js";
import { getClienteNombre, getEmpleadoNombre } from "../../utils/ProyectoHelpers";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/proyectos.css";
import "../../styles/ProyectoDetalle.css";
import "../../styles/chat.css";

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
  const { user } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visorActivo, setVisorActivo] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // Verificar roles
  const esAdmin = user?.rolID === 1;
  const puedeVerFacturacion = esAdmin;

  useEffect(() => {
    let isMounted = true;
    let hasFetched = false; // Prevenir múltiples llamadas

    const fetchData = async () => {
      if (hasFetched) return; // Si ya se ejecutó, no hacer nada
      hasFetched = true;
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
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const respuesta = await fetch(`${API_BASE}/api/usuarios`, {
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
        
        // Asegurar que historial sea un array
        if (!Array.isArray(proyectoData.historial)) {
          proyectoData.historial = [];
        }
        
        // Asegurar que imagenes sea un array
        if (!Array.isArray(proyectoData.imagenes)) {
          proyectoData.imagenes = [];
        }
        
        // Debug: verificar historial e imágenes
        console.log("📋 ProyectoDetalle - Historial recibido:", proyectoData.historial);
        console.log("📋 ProyectoDetalle - Imágenes recibidas:", proyectoData.imagenes);
        console.log("📋 ProyectoDetalle - Total historial:", proyectoData.historial?.length || 0);
        console.log("📋 ProyectoDetalle - Total imágenes:", proyectoData.imagenes?.length || 0);
        console.log("📋 ProyectoDetalle - Rutas de imágenes:", proyectoData.imagenes);
        
        // Verificar si hay imágenes en el historial también
        if (proyectoData.historial && Array.isArray(proyectoData.historial)) {
          const imagenesEnHistorial = proyectoData.historial
            .filter(item => item.archivos && (Array.isArray(item.archivos) || typeof item.archivos === 'string'))
            .flatMap(item => {
              const archivos = Array.isArray(item.archivos) ? item.archivos : (typeof item.archivos === 'string' ? JSON.parse(item.archivos) : []);
              return archivos.map(a => typeof a === 'string' ? a : (a.ruta || a.url || a.path || ''));
            })
            .filter(r => r);
          console.log("📋 ProyectoDetalle - Imágenes en historial:", imagenesEnHistorial);
        }
        
        // Asegurar que notas e images se muestren correctamente
        if (proyectoData.notas === null || proyectoData.notas === undefined) {
          proyectoData.notas = '';
        }
        if (!Array.isArray(proyectoData.images)) {
          proyectoData.images = [];
        }
        
        console.log("📋 ProyectoDetalle - Notas del proyecto:", proyectoData.notas);
        console.log("📋 ProyectoDetalle - Images del proyecto:", proyectoData.images);
        
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
    return () => { 
      isMounted = false;
      hasFetched = false;
    };
  }, [id, navigate]);

  if (loading) return <p>Cargando proyecto...</p>;
  if (!proyecto) return <p>Proyecto no encontrado</p>;

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const getArchivoUrl = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith("http")) return ruta;
    // Si la ruta ya incluye /storage/, usar directamente
    if (ruta.startsWith("/storage/")) return `${API_BASE_URL}${ruta}`;
    // Si empieza con /, agregar al API_BASE_URL
    if (ruta.startsWith("/")) return `${API_BASE_URL}${ruta}`;
    // Si es una ruta relativa (ej: proyectos/8/archivo.jpg), construir la URL completa
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
          {puedeVerFacturacion && (
            <button className="btn-facturacion" onClick={() => navigate(`/proyectos/facturado/${id}`)}>Ver Facturación</button>
          )}
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
            { label: "Tipificación", value: proyecto.tipificacion || "Pendiente" },
          ].map((dato, idx) => (
            <label key={idx}>
              {dato.label}:
              <input type="text" value={dato.value} readOnly />
            </label>
          ))}

          <div className="chat-notas">
            <h3>Historial de Notas y Comentarios</h3>
            <div className="chat-mensajes">
              {proyecto.historial && Array.isArray(proyecto.historial) && proyecto.historial.length > 0 ? (
                proyecto.historial.map((mensaje, idx) => {
                const fecha = mensaje.created_at 
                  ? new Date(mensaje.created_at).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Sin fecha';
                let archivos = [];
                try {
                  if (mensaje.archivos) {
                    if (typeof mensaje.archivos === 'string') {
                      try {
                        archivos = JSON.parse(mensaje.archivos);
                      } catch (parseError) {
                        // Si no es JSON válido, intentar como string simple
                        archivos = [mensaje.archivos];
                      }
                    } else if (Array.isArray(mensaje.archivos)) {
                      archivos = mensaje.archivos;
                    } else if (typeof mensaje.archivos === 'object') {
                      archivos = [mensaje.archivos];
                    }
                  }
                } catch (e) {
                  console.warn("Error parseando archivos:", e, mensaje.archivos);
                  archivos = [];
                }
                
                return (
                  <div key={`msg-${mensaje.id || idx}`} className="mensaje-chat">
                    <div className="mensaje-header">
                      <strong>{mensaje.usuario_nombre || 'Usuario'}</strong>
                      <span className="mensaje-fecha">{fecha}</span>
                    </div>
                    {mensaje.nota && (
                      <div className="mensaje-texto">{mensaje.nota}</div>
                    )}
                    {archivos && archivos.length > 0 && (
                      <div className="mensaje-archivos">
                        {archivos.map((archivo, aIdx) => {
                          if (!archivo) return null;
                          
                          // Manejar diferentes formatos de archivo
                          let archivoRuta = '';
                          let nombreArchivo = '';
                          
                          if (typeof archivo === 'string') {
                            archivoRuta = archivo;
                            nombreArchivo = archivo.split("/").pop() || archivo.split("\\").pop() || `archivo-${aIdx + 1}`;
                          } else if (archivo && typeof archivo === 'object') {
                            archivoRuta = archivo.ruta || archivo.url || archivo.path || archivo.name || '';
                            nombreArchivo = archivo.nombre || archivo.name || archivoRuta.split("/").pop() || archivoRuta.split("\\").pop() || `archivo-${aIdx + 1}`;
                          }
                          
                          if (!archivoRuta) return null;
                          
                          const archivoUrl = getArchivoUrl(archivoRuta);
                          const esImagen = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nombreArchivo);
                          const esSTL = /\.(stl)$/i.test(nombreArchivo);
                          
                          return (
                            <div key={`arch-${aIdx}-${mensaje.id || idx}`} className="archivo-item">
                              {esImagen ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                  <img 
                                    src={archivoUrl} 
                                    alt={nombreArchivo}
                                    className="imagen-miniatura"
                                    onClick={() => abrirVisor(archivoUrl)}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <a 
                                    href={archivoUrl} 
                                    download={nombreArchivo}
                                    style={{ fontSize: '12px', color: '#3498db', textDecoration: 'none', padding: '4px 8px', backgroundColor: '#e3f2fd', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}
                                  >
                                    📥 Descargar
                                  </a>
                                  <a 
                                    href={archivoUrl} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '12px', color: '#27ae60', textDecoration: 'none', padding: '4px 8px', backgroundColor: '#d4edda', borderRadius: '4px', display: 'inline-block', marginTop: '4px', marginLeft: '4px' }}
                                  >
                                    🔗 Ver enlace
                                  </a>
                                </div>
                              ) : (
                                <a 
                                  href={archivoUrl} 
                                  download={nombreArchivo}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    backgroundColor: esSTL ? '#9b59b6' : '#e3f2fd',
                                    color: esSTL ? '#fff' : '#3498db',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = esSTL ? '#8e44ad' : '#bbdefb'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = esSTL ? '#9b59b6' : '#e3f2fd'}
                                >
                                  {esSTL ? '📦' : '📎'} {nombreArchivo}
                                </a>
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
