/**
 * Componente para mostrar/identificar el rol del usuario
 * Útil para debugging y desarrollo
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserRoleInfo, logUserRole } from '../utils/roleIdentifier';
import './RoleIndicator.css';

export default function RoleIndicator({ showInUI = false, showInConsole = true }) {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState(null);

  useEffect(() => {
    const info = getUserRoleInfo();
    setRoleInfo(info);
    
    if (showInConsole) {
      logUserRole();
    }
  }, [user, showInConsole]);

  if (!roleInfo || !showInUI) {
    return null;
  }

  const getRoleColor = (tipoRol) => {
    switch (tipoRol) {
      case 'admin': return '#f44336';
      case 'diseñador': return '#2196f3';
      case 'cliente': return '#4caf50';
      case 'estudiante': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="role-indicator" style={{ borderColor: getRoleColor(roleInfo.tipoRol) }}>
      <div className="role-indicator-header">
        <strong>Rol Actual:</strong>
      </div>
      <div className="role-indicator-info">
        <span className="role-badge" style={{ backgroundColor: getRoleColor(roleInfo.tipoRol) }}>
          {roleInfo.nombreRol || 'Sin rol'}
        </span>
        <span className="role-type">({roleInfo.tipoRol})</span>
        {roleInfo.rolID && (
          <span className="role-id">ID: {roleInfo.rolID}</span>
        )}
      </div>
    </div>
  );
}

