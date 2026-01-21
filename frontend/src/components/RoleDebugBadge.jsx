/**
 * Componente para mostrar el rol actual en la esquina de la pantalla
 * Solo visible en modo desarrollo para facilitar debugging
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getRoleFromURL } from '../utils/urlRoleHelper';
import './RoleDebugBadge.css';

export default function RoleDebugBadge() {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState(null);
  
  useEffect(() => {
    if (!user) {
      setRoleInfo(null);
      return;
    }
    
    // Obtener rol del usuario
    const rolesDisponibles = user.rolesDisponibles || [];
    const rolIDActual = user.rolID;
    const rolActual = rolesDisponibles.find(r => r.rolID === rolIDActual);
    const nombreRol = rolActual?.nombreRol || rolesDisponibles[0]?.nombreRol || 'Sin rol';
    
    // Obtener rol de la URL para comparar
    const urlRole = getRoleFromURL();
    
    setRoleInfo({
      nombreRol,
      rolID: rolIDActual,
      urlRole: urlRole?.nombreRol,
      match: urlRole ? urlRole.nombreRol === nombreRol : true
    });
  }, [user]);
  
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD || !roleInfo) {
    return null;
  }
  
  const getRoleColor = (nombreRol) => {
    if (!nombreRol) return '#9e9e9e';
    const rolLower = nombreRol.toLowerCase();
    if (rolLower.includes('admin')) return '#f44336';
    if (rolLower.includes('diseñador')) return '#2196f3';
    if (rolLower.includes('cliente')) return '#4caf50';
    if (rolLower.includes('estudiante')) return '#ff9800';
    return '#9e9e9e';
  };
  
  return (
    <div 
      className="role-debug-badge"
      style={{ 
        borderColor: getRoleColor(roleInfo.nombreRol),
        backgroundColor: roleInfo.match ? 'rgba(0, 0, 0, 0.7)' : 'rgba(244, 67, 54, 0.8)'
      }}
      title={`Rol: ${roleInfo.nombreRol} (ID: ${roleInfo.rolID})\nURL: ${roleInfo.urlRole || 'N/A'}\n${roleInfo.match ? '✓ Coincide' : '⚠ No coincide'}`}
    >
      <div className="role-badge-content">
        <span className="role-label">ROL:</span>
        <span className="role-name">{roleInfo.nombreRol}</span>
        {roleInfo.rolID && (
          <span className="role-id">(ID: {roleInfo.rolID})</span>
        )}
        {!roleInfo.match && (
          <span className="role-warning">⚠</span>
        )}
      </div>
      {roleInfo.urlRole && (
        <div className="role-url-info">
          URL: {roleInfo.urlRole}
        </div>
      )}
    </div>
  );
}

