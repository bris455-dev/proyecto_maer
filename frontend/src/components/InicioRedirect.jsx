import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isStudent } from '../utils/roleHelper';
import Inicio from '../pages/Inicio';

/**
 * Componente que redirige estudiantes al dashboard del estudiante
 * y muestra el inicio normal para otros roles
 */
export default function InicioRedirect() {
  const { user } = useAuth();
  
  if (user && isStudent(user)) {
    return <Navigate to="/estudiante/dashboard" replace />;
  }
  
  return <Inicio />;
}

