import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPerfil, updatePerfil, cambiarContrasena, updateNotificaciones } from '../../api/estudiante';
import { aplicarTema, inicializarTema } from '../../utils/themeManager';
import { t, obtenerIdioma, establecerIdioma, inicializarIdioma } from '../../utils/i18n';
import { FaUser, FaLock, FaBell, FaCog, FaCheck, FaTimes } from 'react-icons/fa';
import './Configuracion.css';

export default function EstudianteConfiguracion() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para el formulario de perfil
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    idioma: 'es',
    tema: 'claro'
  });

  // Estados para el formulario de contraseña
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    password_nueva_confirmacion: ''
  });

  // Estados para notificaciones
  const [notificaciones, setNotificaciones] = useState({
    notificaciones_email: true,
    notificaciones_nuevos_cursos: true,
    notificaciones_recordatorios: false
  });

  // Estados para preferencias
  const [preferencias, setPreferencias] = useState({
    idioma: 'es',
    tema: 'claro'
  });

  useEffect(() => {
    // Inicializar tema e idioma al cargar
    inicializarTema();
    inicializarIdioma();
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const response = await getPerfil();
      if (response.status === 'success') {
        const data = response.data;
        setPerfilData({
          nombre: data.nombre || '',
          idioma: data.idioma || 'es',
          tema: data.tema || 'claro'
        });
        setNotificaciones({
          notificaciones_email: data.notificaciones_email ?? true,
          notificaciones_nuevos_cursos: data.notificaciones_nuevos_cursos ?? true,
          notificaciones_recordatorios: data.notificaciones_recordatorios ?? false
        });
        setPreferencias({
          idioma: data.idioma || 'es',
          tema: data.tema || 'claro'
        });
        
        // Aplicar tema e idioma inmediatamente
        if (data.tema) {
          aplicarTema(data.tema);
        }
        if (data.idioma) {
          establecerIdioma(data.idioma);
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      mostrarMensaje('error', 'Error al cargar el perfil');
    }
  };

  // La función aplicarTema ahora viene de themeManager

  const mostrarMensaje = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updatePerfil(perfilData);
      if (response.status === 'success') {
        // Actualizar el usuario en el contexto
        if (response.user) {
          const updatedUser = {
            ...user,
            ...response.user
          };
          setUser(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
        
        // Aplicar tema e idioma si cambiaron
        if (perfilData.tema) {
          aplicarTema(perfilData.tema);
        }
        if (perfilData.idioma) {
          establecerIdioma(perfilData.idioma);
        }
        
        const idioma = obtenerIdioma();
        mostrarMensaje('success', t('mensajes.exito', idioma));
      } else {
        mostrarMensaje('error', response.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      mostrarMensaje('error', error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarContrasena = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validaciones
    if (passwordData.password_nueva !== passwordData.password_nueva_confirmacion) {
      mostrarMensaje('error', 'Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (passwordData.password_nueva.length < 8) {
      mostrarMensaje('error', 'La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await cambiarContrasena({
        password_actual: passwordData.password_actual,
        password_nueva: passwordData.password_nueva,
        password_nueva_confirmacion: passwordData.password_nueva_confirmacion
      });
      
      if (response.status === 'success') {
        mostrarMensaje('success', 'Contraseña actualizada correctamente');
        // Limpiar formulario
        setPasswordData({
          password_actual: '',
          password_nueva: '',
          password_nueva_confirmacion: ''
        });
      } else {
        mostrarMensaje('error', response.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      const errorMessage = error.data?.errors 
        ? Object.values(error.data.errors).flat().join(', ')
        : error.message || 'Error al cambiar la contraseña';
      mostrarMensaje('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotificaciones = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updateNotificaciones(notificaciones);
      if (response.status === 'success') {
        // Actualizar el usuario en el contexto
        if (response.user) {
          const updatedUser = {
            ...user,
            ...response.user
          };
          setUser(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
        mostrarMensaje('success', 'Preferencias de notificaciones actualizadas correctamente');
      } else {
        mostrarMensaje('error', response.message || 'Error al actualizar las notificaciones');
      }
    } catch (error) {
      console.error('Error actualizando notificaciones:', error);
      mostrarMensaje('error', error.message || 'Error al actualizar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferencias = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updatePerfil({
        idioma: preferencias.idioma,
        tema: preferencias.tema
      });
      
      if (response.status === 'success') {
        // Actualizar perfilData también
        setPerfilData(prev => ({
          ...prev,
          idioma: preferencias.idioma,
          tema: preferencias.tema
        }));
        
        // Aplicar tema e idioma
        aplicarTema(preferencias.tema);
        establecerIdioma(preferencias.idioma);
        
        // Actualizar el usuario en el contexto
        if (response.user) {
          const updatedUser = {
            ...user,
            ...response.user
          };
          setUser(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
        
        const idioma = obtenerIdioma();
        mostrarMensaje('success', t('mensajes.exito', idioma));
      } else {
        mostrarMensaje('error', response.message || 'Error al guardar las preferencias');
      }
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      mostrarMensaje('error', error.message || 'Error al guardar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  // Obtener idioma actual para traducciones
  const idioma = obtenerIdioma();

  const tabs = [
    { id: 'perfil', nombre: t('configuracion.perfil', idioma), icono: FaUser },
    { id: 'seguridad', nombre: t('configuracion.seguridad', idioma), icono: FaLock },
    { id: 'notificaciones', nombre: t('configuracion.notificaciones', idioma), icono: FaBell },
    { id: 'preferencias', nombre: t('configuracion.preferencias', idioma), icono: FaCog }
  ];

  return (
    <div className="estudiante-configuracion">
      <div className="config-header">
        <h1>{t('configuracion.titulo', idioma)}</h1>
        <p>{t('configuracion.subtitulo', idioma)}</p>
      </div>

      {/* Mensaje de éxito/error */}
      {message.text && (
        <div className={`config-message ${message.type}`}>
          {message.type === 'success' ? <FaCheck /> : <FaTimes />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="config-content">
        <div className="config-tabs">
          {tabs.map((tab) => {
            const Icono = tab.icono;
            return (
              <button
                key={tab.id}
                className={`config-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icono />
                <span>{tab.nombre}</span>
              </button>
            );
          })}
        </div>

        <div className="config-panel">
          {activeTab === 'perfil' && (
            <div className="config-section">
              <h2>{t('perfil.nombre', idioma)}</h2>
              <form onSubmit={handleUpdatePerfil}>
                <div className="form-group">
                  <label>{t('perfil.nombre', idioma)}</label>
                  <input
                    type="text"
                    value={perfilData.nombre}
                    onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('perfil.email', idioma)}</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="disabled-input"
                  />
                  <small>{t('perfil.emailNoModificable', idioma)}</small>
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? t('mensajes.guardando', idioma) : t('perfil.guardar', idioma)}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="config-section">
              <h2>{t('seguridad.cambiarContrasena', idioma)}</h2>
              <form onSubmit={handleCambiarContrasena}>
                <div className="form-group">
                  <label>{t('seguridad.passwordActual', idioma)}</label>
                  <input
                    type="password"
                    value={passwordData.password_actual}
                    onChange={(e) => setPasswordData({ ...passwordData, password_actual: e.target.value })}
                    required
                    placeholder={t('seguridad.passwordActual', idioma)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('seguridad.passwordNueva', idioma)}</label>
                  <input
                    type="password"
                    value={passwordData.password_nueva}
                    onChange={(e) => setPasswordData({ ...passwordData, password_nueva: e.target.value })}
                    required
                    minLength={8}
                  />
                  <small>
                    {t('seguridad.passwordRequisitos', idioma)}
                  </small>
                </div>
                <div className="form-group">
                  <label>{t('seguridad.passwordConfirmar', idioma)}</label>
                  <input
                    type="password"
                    value={passwordData.password_nueva_confirmacion}
                    onChange={(e) => setPasswordData({ ...passwordData, password_nueva_confirmacion: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? t('mensajes.guardando', idioma) : t('seguridad.actualizar', idioma)}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="config-section">
              <h2>{t('notificaciones.titulo', idioma)}</h2>
              <div className="notification-options">
                <div className="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificaciones.notificaciones_email}
                      onChange={(e) => setNotificaciones({ ...notificaciones, notificaciones_email: e.target.checked })}
                    />
                    <div className="notification-info">
                      <span className="notification-title">{t('notificaciones.email', idioma)}</span>
                      <span className="notification-desc">{t('notificaciones.emailDesc', idioma)}</span>
                    </div>
                  </label>
                </div>
                <div className="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificaciones.notificaciones_nuevos_cursos}
                      onChange={(e) => setNotificaciones({ ...notificaciones, notificaciones_nuevos_cursos: e.target.checked })}
                    />
                    <div className="notification-info">
                      <span className="notification-title">{t('notificaciones.nuevosCursos', idioma)}</span>
                      <span className="notification-desc">{t('notificaciones.nuevosCursosDesc', idioma)}</span>
                    </div>
                  </label>
                </div>
                <div className="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificaciones.notificaciones_recordatorios}
                      onChange={(e) => setNotificaciones({ ...notificaciones, notificaciones_recordatorios: e.target.checked })}
                    />
                    <div className="notification-info">
                      <span className="notification-title">{t('notificaciones.recordatorios', idioma)}</span>
                      <span className="notification-desc">{t('notificaciones.recordatoriosDesc', idioma)}</span>
                    </div>
                  </label>
                </div>
              </div>
              <button
                className="save-btn"
                onClick={handleUpdateNotificaciones}
                disabled={loading}
              >
                {loading ? t('mensajes.guardando', idioma) : t('notificaciones.guardar', idioma)}
              </button>
            </div>
          )}

          {activeTab === 'preferencias' && (
            <div className="config-section">
              <h2>{t('preferencias.titulo', idioma)}</h2>
              <div className="form-group">
                <label>{t('preferencias.idioma', idioma)}</label>
                <select
                  value={preferencias.idioma}
                  onChange={(e) => {
                    setPreferencias({ ...preferencias, idioma: e.target.value });
                    // Aplicar idioma inmediatamente para preview
                    establecerIdioma(e.target.value);
                  }}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('preferencias.tema', idioma)}</label>
                <select
                  value={preferencias.tema}
                  onChange={(e) => {
                    setPreferencias({ ...preferencias, tema: e.target.value });
                    // Aplicar tema inmediatamente para preview
                    aplicarTema(e.target.value);
                  }}
                >
                  <option value="claro">{t('preferencias.temaClaro', idioma)}</option>
                  <option value="oscuro">{t('preferencias.temaOscuro', idioma)}</option>
                  <option value="automatico">{t('preferencias.temaAutomatico', idioma)}</option>
                </select>
                <small>{t('preferencias.temaAutomaticoDesc', idioma)}</small>
              </div>
              <button
                className="save-btn"
                onClick={handleUpdatePreferencias}
                disabled={loading}
              >
                {loading ? t('mensajes.guardando', idioma) : t('preferencias.guardar', idioma)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
