import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMatriculas } from '../../api/cursos';
import { FaPlayCircle, FaBookOpen, FaClock, FaTrophy, FaChartLine, FaBell } from 'react-icons/fa';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cursosActivos: 0,
    cursosCompletados: 0,
    horasEstudiadas: 0,
    proximasActividades: []
  });
  const [cursosRecientes, setCursosRecientes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await getMatriculas();
      
      if (response.status === 'success') {
        const cursosData = response.data || [];
        
        // Calcular estadísticas
        const activos = cursosData.filter(c => calcularProgreso(c) < 100).length;
        const completados = cursosData.filter(c => calcularProgreso(c) === 100).length;
        
        // Ordenar por fecha de última actividad
        const ordenados = cursosData.sort((a, b) => {
          const fechaA = new Date(a.updated_at || a.created_at);
          const fechaB = new Date(b.updated_at || b.created_at);
          return fechaB - fechaA;
        });
        
        setCursosRecientes(ordenados.slice(0, 3));
        setStats({
          cursosActivos: activos,
          cursosCompletados: completados,
          horasEstudiadas: calcularHorasTotales(cursosData),
          proximasActividades: []
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (matricula) => {
    if (!matricula.curso) return 0;
    const curso = matricula.curso;
    const archivosGenerales = curso.archivos?.filter(a => !a.sesionID).length || 0;
    const totalSesiones = curso.sesiones?.length || 0;
    const totalArchivos = archivosGenerales + (curso.sesiones?.reduce((acc, s) => acc + (s.archivos?.length || 0), 0) || 0);
    return totalArchivos > 0 ? Math.round((totalArchivos / totalArchivos) * 100) : 0;
  };

  const calcularHorasTotales = (cursos) => {
    return cursos.reduce((acc, c) => acc + (c.curso?.cantidad_horas || 0), 0);
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando tu dashboard...</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>¡Bienvenido, {user?.nombre || 'Estudiante'}!</h1>
          <p className="dashboard-subtitle">Continúa tu aprendizaje desde donde lo dejaste</p>
        </div>
        <div className="dashboard-notifications">
          <button className="notification-btn" title="Notificaciones">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon cursos-activos">
            <FaBookOpen />
          </div>
          <div className="stat-content">
            <h3>{stats.cursosActivos}</h3>
            <p>Cursos Activos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon cursos-completados">
            <FaTrophy />
          </div>
          <div className="stat-content">
            <h3>{stats.cursosCompletados}</h3>
            <p>Cursos Completados</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon horas-estudiadas">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>{stats.horasEstudiadas}</h3>
            <p>Horas de Estudio</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon progreso">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>
              {stats.cursosActivos + stats.cursosCompletados > 0
                ? Math.round((stats.cursosCompletados / (stats.cursosActivos + stats.cursosCompletados)) * 100)
                : 0}%
            </h3>
            <p>Progreso General</p>
          </div>
        </div>
      </div>

      {/* Cursos recientes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Continúa Aprendiendo</h2>
          <button 
            className="view-all-btn"
            onClick={() => navigate('/estudiante/mis-cursos')}
          >
            Ver todos
          </button>
        </div>
        
        {cursosRecientes.length > 0 ? (
          <div className="cursos-recientes-grid">
            {cursosRecientes.map((matricula) => {
              const curso = matricula.curso;
              const progreso = calcularProgreso(matricula);
              
              return (
                <div key={matricula.matriculaID} className="curso-reciente-card">
                  {curso?.imagen_portada && (
                    <div className="curso-imagen">
                      <img src={`/storage/${curso.imagen_portada}`} alt={curso.nombre} />
                    </div>
                  )}
                  <div className="curso-content">
                    <h3>{curso?.nombre || 'Curso sin nombre'}</h3>
                    <p className="curso-nivel">{curso?.nivel}</p>
                    <div className="progreso-bar">
                      <div className="progreso-fill" style={{ width: `${progreso}%` }}></div>
                    </div>
                    <p className="progreso-text">{progreso}% completado</p>
                    <button
                      className="continuar-btn"
                      onClick={() => navigate(`/cursos/${curso?.cursoID}`)}
                    >
                      <FaPlayCircle /> Continuar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FaBookOpen size={48} />
            <p>No tienes cursos inscritos aún</p>
            <button
              className="explorar-btn"
              onClick={() => navigate('/estudiante/catalogo')}
            >
              Explorar Cursos
            </button>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="dashboard-section">
        <h2>Accesos Rápidos</h2>
        <div className="quick-actions">
          <button
            className="quick-action-card"
            onClick={() => navigate('/estudiante/catalogo')}
          >
            <FaBookOpen />
            <span>Explorar Catálogo</span>
          </button>
          <button
            className="quick-action-card"
            onClick={() => navigate('/estudiante/progreso')}
          >
            <FaTrophy />
            <span>Ver Certificados</span>
          </button>
          <button
            className="quick-action-card"
            onClick={() => navigate('/estudiante/mensajes')}
          >
            <FaBell />
            <span>Mensajes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

