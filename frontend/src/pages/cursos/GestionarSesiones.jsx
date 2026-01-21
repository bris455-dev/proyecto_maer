import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCursoById, crearSesion, subirArchivos, eliminarArchivo } from '../../api/cursos';
import { FaPlus, FaTrash, FaUpload, FaFile, FaVideo, FaImage, FaFilePdf, FaFileArchive } from 'react-icons/fa';
import './GestionarSesiones.css';

export default function GestionarSesiones() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nuevaSesion, setNuevaSesion] = useState({ nombre: '', descripcion: '' });
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
  const [archivosSubiendo, setArchivosSubiendo] = useState({});

  useEffect(() => {
    cargarCurso();
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

  const handleCrearSesion = async (e) => {
    e.preventDefault();
    try {
      const response = await crearSesion(id, nuevaSesion);
      if (response.status === 'success') {
        setNuevaSesion({ nombre: '', descripcion: '' });
        setMostrarFormSesion(false);
        cargarCurso();
      } else {
        alert(response.message || 'Error al crear sesión');
      }
    } catch (error) {
      console.error('Error creando sesión:', error);
      alert('Error al crear sesión');
    }
  };

  const handleFileChange = async (e, sesionID = null) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const key = sesionID || 'curso';
    setArchivosSubiendo(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('archivos[]', file);
      });

      const response = await subirArchivos(id, formData, sesionID);
      
      if (response.status === 'success' || response.status === 'partial') {
        if (response.errores && response.errores.length > 0) {
          alert(`Algunos archivos no se pudieron subir: ${response.errores.join(', ')}`);
        }
        cargarCurso();
      } else {
        alert('Error al subir archivos');
      }
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      alert('Error al subir archivos');
    } finally {
      setArchivosSubiendo(prev => ({ ...prev, [key]: false }));
      e.target.value = '';
    }
  };

  const handleEliminarArchivo = async (archivoID) => {
    if (!window.confirm('¿Está seguro de eliminar este archivo?')) return;

    try {
      const response = await eliminarArchivo(id, archivoID);
      if (response.status === 'success') {
        cargarCurso();
      } else {
        alert(response.message || 'Error al eliminar archivo');
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert('Error al eliminar archivo');
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

  if (loading) {
    return <div className="sesiones-loading">Cargando curso...</div>;
  }

  if (!curso) {
    return <div className="sesiones-error">Curso no encontrado</div>;
  }

  return (
    <div className="gestionar-sesiones-container">
      <div className="sesiones-header">
        <div>
          <h1>{curso.nombre}</h1>
          <p className="curso-nivel">{curso.nivel}</p>
        </div>
        <button 
          className="btn-volver"
          onClick={() => navigate('/cursos')}
        >
          Volver a Cursos
        </button>
      </div>

      <div className="sesiones-content">
        <div className="sesiones-lista">
          <div className="sesiones-header-lista">
            <h2>Sesiones del Curso</h2>
            <button
              className="btn-nueva-sesion"
              onClick={() => setMostrarFormSesion(!mostrarFormSesion)}
            >
              <FaPlus /> Nueva Sesión
            </button>
          </div>

          {mostrarFormSesion && (
            <form onSubmit={handleCrearSesion} className="form-nueva-sesion">
              <input
                type="text"
                placeholder="Nombre de la sesión"
                value={nuevaSesion.nombre}
                onChange={(e) => setNuevaSesion({ ...nuevaSesion, nombre: e.target.value })}
                required
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={nuevaSesion.descripcion}
                onChange={(e) => setNuevaSesion({ ...nuevaSesion, descripcion: e.target.value })}
                rows={2}
              />
              <div className="form-actions-sesion">
                <button type="submit" className="btn-guardar-sesion">Crear Sesión</button>
                <button 
                  type="button" 
                  className="btn-cancelar-sesion"
                  onClick={() => {
                    setMostrarFormSesion(false);
                    setNuevaSesion({ nombre: '', descripcion: '' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Archivos del curso (sin sesión) */}
          <div className="sesion-item">
            <div className="sesion-header-item">
              <h3>Archivos Generales del Curso</h3>
              <label className="btn-subir-archivo">
                <FaUpload /> Subir Archivos
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e, null)}
                  style={{ display: 'none' }}
                  accept=".mp4,.avi,.mov,.wmv,.flv,.webm,.pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                />
              </label>
            </div>
            {archivosSubiendo.curso && (
              <div className="subiendo">Subiendo archivos...</div>
            )}
            {curso.archivos && curso.archivos.filter(a => !a.sesionID).length > 0 ? (
              <div className="archivos-lista">
                {curso.archivos
                  .filter(a => !a.sesionID)
                  .map(archivo => (
                    <div key={archivo.archivoID} className="archivo-item">
                      <div className="archivo-info">
                        {getIconoArchivo(archivo.tipo)}
                        <span className="archivo-nombre">{archivo.nombre_original}</span>
                        <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                      </div>
                      <button
                        className="btn-eliminar-archivo"
                        onClick={() => handleEliminarArchivo(archivo.archivoID)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="sin-archivos">No hay archivos en esta sección</p>
            )}
          </div>

          {/* Sesiones */}
          {curso.sesiones && curso.sesiones.length > 0 ? (
            curso.sesiones.map(sesion => (
              <div key={sesion.sesionID} className="sesion-item">
                <div className="sesion-header-item">
                  <h3>Sesión {sesion.orden}: {sesion.nombre}</h3>
                  <label className="btn-subir-archivo">
                    <FaUpload /> Subir Archivos
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(e, sesion.sesionID)}
                      style={{ display: 'none' }}
                      accept=".mp4,.avi,.mov,.wmv,.flv,.webm,.pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                    />
                  </label>
                </div>
                {sesion.descripcion && (
                  <p className="sesion-descripcion">{sesion.descripcion}</p>
                )}
                {archivosSubiendo[sesion.sesionID] && (
                  <div className="subiendo">Subiendo archivos...</div>
                )}
                {sesion.archivos && sesion.archivos.length > 0 ? (
                  <div className="archivos-lista">
                    {sesion.archivos.map(archivo => (
                      <div key={archivo.archivoID} className="archivo-item">
                        <div className="archivo-info">
                          {getIconoArchivo(archivo.tipo)}
                          <span className="archivo-nombre">{archivo.nombre_original}</span>
                          <span className="archivo-tamaño">{formatTamaño(archivo.tamaño)}</span>
                        </div>
                        <button
                          className="btn-eliminar-archivo"
                          onClick={() => handleEliminarArchivo(archivo.archivoID)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sin-archivos">No hay archivos en esta sesión</p>
                )}
              </div>
            ))
          ) : (
            <p className="sin-sesiones">No hay sesiones creadas. Crea una sesión para organizar los archivos del curso.</p>
          )}
        </div>
      </div>
    </div>
  );
}

