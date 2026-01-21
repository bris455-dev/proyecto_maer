import React, { useState, useEffect } from 'react';
import { getMatriculas } from '../../api/cursos';
import { FaTrophy, FaDownload, FaChartLine, FaClock, FaBookOpen } from 'react-icons/fa';
import './Progreso.css';

export default function EstudianteProgreso() {
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [stats, setStats] = useState({
    totalCursos: 0,
    completados: 0,
    enProgreso: 0,
    horasTotales: 0,
    promedioProgreso: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await getMatriculas();
      
      if (response.status === 'success') {
        const cursosData = response.data || [];
        setCursos(cursosData);
        
        const completados = cursosData.filter(c => calcularProgreso(c) === 100);
        const enProgreso = cursosData.filter(c => calcularProgreso(c) < 100 && calcularProgreso(c) > 0);
        const horasTotales = cursosData.reduce((acc, c) => acc + (c.curso?.cantidad_horas || 0), 0);
        const promedioProgreso = cursosData.length > 0
          ? Math.round(cursosData.reduce((acc, c) => acc + calcularProgreso(c), 0) / cursosData.length)
          : 0;
        
        setStats({
          totalCursos: cursosData.length,
          completados: completados.length,
          enProgreso: enProgreso.length,
          horasTotales,
          promedioProgreso
        });
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (matricula) => {
    if (!matricula.curso) return 0;
    const curso = matricula.curso;
    const archivosGenerales = curso.archivos?.filter(a => !a.sesionID).length || 0;
    const totalArchivos = archivosGenerales + (curso.sesiones?.reduce((acc, s) => acc + (s.archivos?.length || 0), 0) || 0);
    return totalArchivos > 0 ? Math.round((totalArchivos / totalArchivos) * 100) : 0;
  };

  const descargarCertificado = (curso) => {
    // TODO: Implementar descarga de certificado
    alert(`Descargando certificado de: ${curso.nombre}`);
  };

  if (loading) {
    return <div className="progreso-loading">Cargando tu progreso...</div>;
  }

  return (
    <div className="estudiante-progreso">
      <div className="progreso-header">
        <h1>Mi Progreso y Certificados</h1>
        <p>Visualiza tu avance y descarga tus certificados de finalización</p>
      </div>

      {/* Estadísticas generales */}
      <div className="progreso-stats">
        <div className="progreso-stat-card">
          <FaBookOpen className="stat-icon" />
          <div>
            <h3>{stats.totalCursos}</h3>
            <p>Total de Cursos</p>
          </div>
        </div>
        <div className="progreso-stat-card">
          <FaTrophy className="stat-icon" />
          <div>
            <h3>{stats.completados}</h3>
            <p>Completados</p>
          </div>
        </div>
        <div className="progreso-stat-card">
          <FaChartLine className="stat-icon" />
          <div>
            <h3>{stats.promedioProgreso}%</h3>
            <p>Progreso Promedio</p>
          </div>
        </div>
        <div className="progreso-stat-card">
          <FaClock className="stat-icon" />
          <div>
            <h3>{stats.horasTotales}</h3>
            <p>Horas de Estudio</p>
          </div>
        </div>
      </div>

      {/* Cursos completados con certificados */}
      <div className="progreso-section">
        <h2>Cursos Completados</h2>
        {cursos.filter(c => calcularProgreso(c) === 100).length > 0 ? (
          <div className="certificados-grid">
            {cursos
              .filter(c => calcularProgreso(c) === 100)
              .map((matricula) => {
                const curso = matricula.curso;
                return (
                  <div key={matricula.matriculaID} className="certificado-card">
                    <div className="certificado-icon">
                      <FaTrophy />
                    </div>
                    <h3>{curso?.nombre || 'Curso sin nombre'}</h3>
                    <p className="certificado-nivel">{curso?.nivel}</p>
                    <p className="certificado-fecha">
                      Completado: {new Date(matricula.updated_at || matricula.created_at).toLocaleDateString()}
                    </p>
                    <button
                      className="descargar-certificado-btn"
                      onClick={() => descargarCertificado(curso)}
                    >
                      <FaDownload /> Descargar Certificado
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-state">
            <FaTrophy size={48} />
            <p>Aún no has completado ningún curso</p>
          </div>
        )}
      </div>

      {/* Todos los cursos con progreso */}
      <div className="progreso-section">
        <h2>Todos mis Cursos</h2>
        {cursos.length > 0 ? (
          <div className="cursos-progreso-list">
            {cursos.map((matricula) => {
              const curso = matricula.curso;
              const progreso = calcularProgreso(matricula);
              const isCompletado = progreso === 100;
              
              return (
                <div key={matricula.matriculaID} className="curso-progreso-item">
                  <div className="curso-progreso-info">
                    <h3>{curso?.nombre || 'Curso sin nombre'}</h3>
                    <p className="curso-nivel">{curso?.nivel}</p>
                    <div className="progreso-bar-container">
                      <div className="progreso-bar">
                        <div 
                          className={`progreso-fill ${isCompletado ? 'completado' : ''}`}
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <span className="progreso-porcentaje">{progreso}%</span>
                    </div>
                  </div>
                  {isCompletado && (
                    <button
                      className="certificado-btn-small"
                      onClick={() => descargarCertificado(curso)}
                    >
                      <FaDownload /> Certificado
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FaBookOpen size={48} />
            <p>No tienes cursos inscritos</p>
          </div>
        )}
      </div>
    </div>
  );
}

