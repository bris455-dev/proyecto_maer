import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { changeProfile } from '../api/auth';
import { updateURLWithRole } from '../utils/urlRoleHelper';
import { FaUserCircle, FaChevronDown } from 'react-icons/fa';
import '../styles/ChangeProfile.css';

export default function ChangeProfile() {
  const { user, setUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const rolesDisponibles = user?.rolesDisponibles || [];
  const rolActual = rolesDisponibles.find(r => r.rolID === user?.rolID) || rolesDisponibles[0];

  // Si solo tiene un rol, no mostrar el selector
  if (rolesDisponibles.length <= 1) {
    return null;
  }

  const handleChangeProfile = async (usuarioRolID) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await changeProfile(usuarioRolID);
      
      if (response.status === 'success') {
        // Actualizar el usuario en el contexto y localStorage
        const updatedUser = {
          ...user,
          ...response.user
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Actualizar rol en la URL antes de recargar
        updateURLWithRole(updatedUser);
        
        // Recargar la página para aplicar los nuevos permisos
        window.location.reload();
      } else {
        alert(response.message || 'Error al cambiar el perfil');
      }
    } catch (error) {
      console.error('Error cambiando perfil:', error);
      alert('Error al cambiar el perfil');
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="change-profile-container">
      <button 
        className="change-profile-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Cambiar de perfil"
      >
        <FaUserCircle />
        <span>Cambiar a: {rolActual?.nombreRol || 'Perfil'}</span>
        <FaChevronDown className={showDropdown ? 'rotated' : ''} />
      </button>
      
      {showDropdown && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <strong>Seleccionar Perfil</strong>
          </div>
          <div className="profile-dropdown-list">
            {rolesDisponibles.map((rol) => (
              <button
                key={rol.usuarioRolID}
                className={`profile-option ${rol.rolID === user?.rolID ? 'active' : ''}`}
                onClick={() => handleChangeProfile(rol.usuarioRolID)}
                disabled={loading || rol.rolID === user?.rolID}
              >
                <FaUserCircle />
                <span>{rol.nombreRol}</span>
                {rol.rolID === user?.rolID && <span className="current-badge">Actual</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

