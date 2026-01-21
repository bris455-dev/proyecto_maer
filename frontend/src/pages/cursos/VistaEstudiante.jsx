import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCursoById, verificarAcceso, agregarAlCarrito } from '../../api/cursos';
import Breadcrumbs from '../../components/Breadcrumbs';
import { FaShoppingCart, FaLock, FaUnlock, FaDownload, FaFile, FaVideo, FaImage, FaFilePdf, FaFileArchive, FaUserGraduate, FaClock, FaDollarSign, FaBook, FaCheckCircle, FaEye } from 'react-icons/fa';
import './VistaEstudiante.css';

export default function VistaEstudiante() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  const [verificandoAcceso, setVerificandoAcceso] = useState(true);
  

  useEffect(() => {
    cargarCurso();
    verificarAccesoCurso();
  }, [id]);

  const cargarCurso = async () => {
    try {
      setLoading(true);
      const response = await getCursoById(id);
      if (response.status === 'success') {
        setCurso(response.data);
      }
    } catch (error) {
      console.error('Error cargando curso:', error);
      alert('Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  };

  const verificarAccesoCurso = async () => {
    try {
      setVerificandoAcceso(true);
      const response = await verificarAcceso(id);
      if (response.status === 'success') {
        setTieneAcceso(response.tiene_acceso);
      }
    } catch (error) {
      console.error('Error verificando acceso:', error);
      setTieneAcceso(false);
    } finally {
      setVerificandoAcceso(false);
    }
  };

  const handleAgregarCarrito = async () => {
    try {
      const response = await agregarAlCarrito(id);
      if (response.status === 'success') {
        alert('Curso agregado al carrito');
        navigate('/cursos/carrito');
      } else {
        alert(response.message || 'Error al agregar al carrito');
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert('Error al agregar al carrito');
    }
  };

  const getIconoArchivo = (tipo) => {
    switch (tipo) {
      case 'video': return <FaVideo />;
      case 'pdf': return <FaFilePdf />;
      case 'ppt': return <FaFile />;
      case 'imagen': return <FaImage />;
      case 'zip':
      case 'rar': return <FaFileArchive />;
      default: return <FaFile />;
    }
  };

  const formatTamaño = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' bytes';
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  const descargarArchivo = (archivo) => {
    window.open(`/storage/${archivo.ruta}`, '_blank');
  };

  const esVideo = (tipo) => {
    return tipo === 'video' || tipo === 'mp4' || tipo === 'avi' || tipo === 'mov' || tipo === 'webm';
  };

  const obtenerUrlVideo = (archivo) => {
    return `/storage/${archivo.ruta}`;
  };

  if (loading || verificandoAcceso) {
    return <div className="vista-estudiante-loading">Cargando curso...</div>;
  }

  if (!curso) {
    return <div className="vista-estudiante-error">Curso no encontrado</div>;
  }

  return (
    <div className="vista-estudiante-container">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Cursos', path: '/cursos' },
        { label: curso?.nombre || 'Curso', path: `/cursos/${id}` }
      ]} />

      <div className="curso-header-estudiante">
        {curso.imagen_portada && (
          <div className="curso-imagen-wrapper">
            <img 
              src={`/storage/${curso.imagen_portada}`} 
              alt={curso.nombre}
              className="curso-imagen-estudiante"
            />
            {curso.estado === 'Publicado' && (
              <div className="badge-publicado">
                <FaCheckCircle /> Publicado
              </div>
            )}
          </div>
        )}
        <div className="curso-info-estudiante">
          <div className="curso-header-top">
            <h1>{curso.nombre}</h1>
            <span className="curso-nivel-estudiante">{curso.nivel}</span>
          </div>
          <p className="curso-descripcion-estudiante">{curso.descripcion}</p>
          <div className="curso-meta-grid">
            <div className="meta-item">
              <FaClock /> <span>{curso.cantidad_horas} horas</span>
            </div>
            <div className="meta-item precio-destacado">
              <FaDollarSign /> <span>{formatMoneda(curso.precio)}</span>
            </div>
            {curso.estado && (
              <div className="meta-item">
                <FaBook /> <span>Estado: {curso.estado}</span>
              </div>
            )}
          </div>
          {!tieneAcceso && (
            <div className="curso-acciones-header">
              <button 
                className="btn-agregar-carrito"
                onClick={handleAgregarCarrito}
              >
                <FaShoppingCart /> Agregar al Carrito
              </button>
              <button 
                className="btn-matricular-header"
                onClick={handleAgregarCarrito}
              >
                <FaUserGraduate /> Matricularme Ahora
              </button>
            </div>
          )}
          {tieneAcceso && (
            <div className="acceso-activo-badge">
              <FaCheckCircle /> Tienes acceso completo a este curso
            </div>
          )}
        </div>
      </div>

      {curso.objetivos && (
        <div className="curso-seccion">
          <h2>Objetivos del Curso</h2>
          <p>{curso.objetivos}</p>
        </div>
      )}

      {curso.requisitos && (
        <div className="curso-seccion">
          <h2>Requisitos</h2>
          <p>{curso.requisitos}</p>
        </div>
      )}

      <div className="curso-seccion">
        <h2>
          Materiales del Curso
          {!tieneAcceso && (
            <span className="acceso-bloqueado">
              <FaLock /> Matricúlate para acceder
            </span>
          )}
        </h2>

        {!tieneAcceso ? (
          <div className="acceso-requerido">
            <FaLock size={48} />
            <p>Debes estar matriculado y haber pagado para acceder a los materiales del curso.</p>
            <button 
              className="btn-matricularse"
              onClick={handleAgregarCarrito}
            >
              <FaShoppingCart /> Matricularme Ahora
            </button>
          </div>
        ) : (
          <>
            {/* Archivos generales */}
            {curso.archivos && curso.archivos.filter(a => !a.sesionID).length > 0 && (
              <div className="materiales-grupo">
                <h3>Archivos Generales</h3>
                <div className="archivos-grid">
                    {curso.archivos
                    .filter(a => !a.sesionID)
                    .map(archivo => (
                      esVideo(archivo.tipo) ? (
                        <div key={archivo.archivoID} className="video-container">
                          <video 
                            controls 
                            className="video-player"
                            preload="metadata"
                          >
                            <source src={obtenerUrlVideo(archivo)} type={`video/${archivo.tipo}`} />
                            Tu navegador no soporta el elemento de video.
                          </video>
                          <div className="video-info">
                            <span className="archivo-nombre">{archivo.nombre_original}</span>
                            <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                          </div>
                        </div>
                      ) : (
                        <div key={archivo.archivoID} className="archivo-card">
                          <div className="archivo-icono">
                            {getIconoArchivo(archivo.tipo)}
                          </div>
                          <div className="archivo-detalle">
                            <span className="archivo-nombre">{archivo.nombre_original}</span>
                            <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                          </div>
                          <button
                            className="btn-descargar"
                            onClick={() => descargarArchivo(archivo)}
                            title="Descargar archivo"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      )
                    ))}
                </div>
              </div>
            )}

            {/* Sesiones con acordeón */}
            {curso.sesiones && curso.sesiones.length > 0 && (
              <div className="sesiones-estudiante">
                {curso.sesiones.map((sesion, index) => (
                  <SesionAcordeon 
                    key={sesion.sesionID} 
                    sesion={sesion} 
                    index={index}
                    esVideo={esVideo}
                    obtenerUrlVideo={obtenerUrlVideo}
                    getIconoArchivo={getIconoArchivo}
                    formatTamaño={formatTamaño}
                    descargarArchivo={descargarArchivo}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente de Sesión con Acordeón
function SesionAcordeon({ sesion, index, esVideo, obtenerUrlVideo, getIconoArchivo, formatTamaño, descargarArchivo }) {
  const [isOpen, setIsOpen] = React.useState(index === 0); // Primera sesión abierta por defecto

  return (
    <div className={`sesion-acordeon ${isOpen ? 'open' : ''}`}>
      <div 
        className="sesion-header-acordeon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="sesion-header-left">
          <span className="sesion-numero">{sesion.orden}</span>
          <h3>{sesion.nombre}</h3>
        </div>
        <div className="sesion-header-right">
          {sesion.archivos && sesion.archivos.length > 0 && (
            <span className="archivos-count">{sesion.archivos.length} archivos</span>
          )}
          <span className="acordeon-icon">{isOpen ? '−' : '+'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="sesion-content-acordeon">
          {sesion.descripcion && (
            <p className="sesion-descripcion">{sesion.descripcion}</p>
          )}
          {sesion.archivos && sesion.archivos.length > 0 ? (
            <div className="archivos-grid">
              {sesion.archivos.map(archivo => (
                esVideo(archivo.tipo) ? (
                  <div key={archivo.archivoID} className="video-container">
                    <video 
                      controls 
                      className="video-player"
                      preload="metadata"
                    >
                      <source src={obtenerUrlVideo(archivo)} type={`video/${archivo.tipo}`} />
                      Tu navegador no soporta el elemento de video.
                    </video>
                    <div className="video-info">
                      <span className="archivo-nombre">{archivo.nombre_original}</span>
                      <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                    </div>
                  </div>
                ) : (
                  <div key={archivo.archivoID} className="archivo-card">
                    <div className="archivo-icono">
                      {getIconoArchivo(archivo.tipo)}
                    </div>
                    <div className="archivo-detalle">
                      <span className="archivo-nombre">{archivo.nombre_original}</span>
                      <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                    </div>
                    <button
                      className="btn-descargar"
                      onClick={() => descargarArchivo(archivo)}
                      title="Descargar archivo"
                    >
                      <FaDownload />
                    </button>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="sin-archivos-sesion">No hay archivos en esta sesión</p>
          )}
        </div>
      )}
    </div>
  );
}

