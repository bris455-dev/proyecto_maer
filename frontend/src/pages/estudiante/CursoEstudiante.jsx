import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCursoById, verificarAcceso } from '../../api/cursos';
import Breadcrumbs from '../../components/Breadcrumbs';
import { 
  FaDownload, FaFile, FaVideo, FaImage, FaFilePdf, FaFileArchive, 
  FaClock, FaBook, FaChevronDown, FaChevronUp, FaCheckCircle, FaLock,
  FaArrowLeft
} from 'react-icons/fa';
import './CursoEstudiante.css';

export default function CursoEstudiante() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
    return <div className="curso-estudiante-loading">Cargando curso...</div>;
  }

  if (!curso) {
    return <div className="curso-estudiante-error">Curso no encontrado</div>;
  }

  // Verificar si hay materiales
  const archivosGenerales = curso.archivos?.filter(a => !a.sesionID) || [];
  const sesionesConArchivos = curso.sesiones?.filter(s => s.archivos && s.archivos.length > 0) || [];
  const tieneMateriales = archivosGenerales.length > 0 || sesionesConArchivos.length > 0;

  return (
    <div className="curso-estudiante-container">
      <Breadcrumbs items={[
        { label: 'Dashboard', path: '/estudiante/dashboard' },
        { label: 'Mis Cursos', path: '/estudiante/mis-cursos' },
        { label: curso?.nombre || 'Curso', path: `/estudiante/curso/${id}` }
      ]} />

      {/* Header del curso */}
      <div className="curso-estudiante-header">
        <button 
          className="btn-volver"
          onClick={() => navigate('/estudiante/mis-cursos')}
        >
          <FaArrowLeft /> Volver a Mis Cursos
        </button>
        
        <div className="curso-header-info">
          {curso.imagen_portada && (
            <img 
              src={`/storage/${curso.imagen_portada}`} 
              alt={curso.nombre}
              className="curso-imagen-header"
            />
          )}
          <div className="curso-info-header">
            <h1>{curso.nombre}</h1>
            <div className="curso-meta-header">
              <span className="curso-nivel-badge">{curso.nivel}</span>
              <span><FaClock /> {curso.cantidad_horas} horas</span>
            </div>
            {curso.descripcion && (
              <p className="curso-descripcion-header">{curso.descripcion}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del curso */}
      {!tieneAcceso ? (
        <div className="acceso-bloqueado-container">
          <FaLock size={64} />
          <h2>Acceso Restringido</h2>
          <p>Debes estar matriculado y haber completado el pago para acceder a los materiales del curso.</p>
        </div>
      ) : !tieneMateriales ? (
        <div className="sin-materiales-container">
          <FaBook size={64} />
          <h2>No hay materiales disponibles</h2>
          <p>Este curso aún no tiene módulos o materiales subidos. Los materiales estarán disponibles próximamente.</p>
        </div>
      ) : (
        <div className="curso-contenido">
          {/* Archivos generales */}
          {archivosGenerales.length > 0 && (
            <div className="modulo-seccion">
              <h2 className="modulo-titulo">
                <FaBook /> Materiales Generales
              </h2>
              <div className="archivos-grid">
                {archivosGenerales.map(archivo => (
                  esVideo(archivo.tipo) ? (
                    <div key={archivo.archivoID} className="archivo-item video-item">
                      <video 
                        controls 
                        className="video-player"
                        preload="metadata"
                      >
                        <source src={obtenerUrlVideo(archivo)} type={`video/${archivo.tipo}`} />
                        Tu navegador no soporta el elemento de video.
                      </video>
                      <div className="archivo-info">
                        <span className="archivo-nombre">{archivo.nombre_original}</span>
                        <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                      </div>
                    </div>
                  ) : (
                    <div key={archivo.archivoID} className="archivo-item">
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

          {/* Módulos/Sesiones */}
          {curso.sesiones && curso.sesiones.length > 0 && (
            <div className="modulos-seccion">
              <h2 className="modulos-titulo">
                <FaBook /> Módulos del Curso
              </h2>
              <div className="modulos-lista">
                {curso.sesiones.map((sesion, index) => (
                  <ModuloAcordeon 
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente de Módulo con Acordeón
function ModuloAcordeon({ sesion, index, esVideo, obtenerUrlVideo, getIconoArchivo, formatTamaño, descargarArchivo }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  const tieneArchivos = sesion.archivos && sesion.archivos.length > 0;

  return (
    <div className={`modulo-acordeon ${isOpen ? 'open' : ''}`}>
      <div 
        className="modulo-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="modulo-header-left">
          <span className="modulo-numero">Módulo {sesion.orden}</span>
          <h3>{sesion.nombre}</h3>
          {sesion.descripcion && (
            <p className="modulo-descripcion-preview">{sesion.descripcion}</p>
          )}
        </div>
        <div className="modulo-header-right">
          {tieneArchivos && (
            <span className="archivos-count">{sesion.archivos.length} {sesion.archivos.length === 1 ? 'archivo' : 'archivos'}</span>
          )}
          <span className="acordeon-icon">
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="modulo-content">
          {sesion.descripcion && (
            <p className="modulo-descripcion-completa">{sesion.descripcion}</p>
          )}
          {tieneArchivos ? (
            <div className="archivos-grid">
              {sesion.archivos.map(archivo => (
                esVideo(archivo.tipo) ? (
                  <div key={archivo.archivoID} className="archivo-item video-item">
                    <video 
                      controls 
                      className="video-player"
                      preload="metadata"
                    >
                      <source src={obtenerUrlVideo(archivo)} type={`video/${archivo.tipo}`} />
                      Tu navegador no soporta el elemento de video.
                    </video>
                    <div className="archivo-info">
                      <span className="archivo-nombre">{archivo.nombre_original}</span>
                      <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                    </div>
                  </div>
                ) : (
                  <div key={archivo.archivoID} className="archivo-item">
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
            <div className="sin-archivos-modulo">
              <p>Este módulo aún no tiene archivos disponibles.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

