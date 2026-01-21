# Cómo Identificar el Rol del Usuario en la URL

## 📋 Métodos Disponibles

### 1. **Desde el Hook useAuth (Recomendado)**

```jsx
import { useAuth } from '../hooks/useAuth';

function MiComponente() {
  const { user } = useAuth();
  
  // Obtener información del rol
  const rolID = user?.rolID;
  const nombreRol = user?.rol?.nombreRol;
  
  console.log('Rol ID:', rolID);
  console.log('Nombre Rol:', nombreRol);
  
  // Identificar tipo de rol
  if (nombreRol?.toLowerCase().includes('admin')) {
    console.log('Es Administrador');
  } else if (nombreRol?.toLowerCase().includes('diseñador')) {
    console.log('Es Diseñador');
  } else if (nombreRol?.toLowerCase().includes('cliente')) {
    console.log('Es Cliente');
  } else if (nombreRol?.toLowerCase().includes('estudiante')) {
    console.log('Es Estudiante');
  }
}
```

### 2. **Desde localStorage (Sin React Context)**

```jsx
import { getUserRoleInfo, logUserRole } from '../utils/roleIdentifier';

function MiComponente() {
  // Obtener información completa del rol
  const roleInfo = getUserRoleInfo();
  
  console.log('Rol ID:', roleInfo.rolID);
  console.log('Nombre Rol:', roleInfo.nombreRol);
  console.log('Tipo Rol:', roleInfo.tipoRol); // 'admin', 'diseñador', 'cliente', 'estudiante'
  console.log('Es Admin:', roleInfo.isAdmin);
  console.log('Es Diseñador:', roleInfo.isDiseñador);
  console.log('Es Cliente:', roleInfo.isCliente);
  console.log('Es Estudiante:', roleInfo.isEstudiante);
  
  // O mostrar todo en consola de una vez
  logUserRole();
}
```

### 3. **Desde la URL (Query Parameters) - Solo para Debugging**

```jsx
// Agregar a la URL manualmente: ?rol=admin
import { getRoleFromURL } from '../utils/roleIdentifier';

function MiComponente() {
  const rolFromURL = getRoleFromURL(); // 'admin', 'diseñador', etc.
  
  if (rolFromURL) {
    console.log('Rol desde URL:', rolFromURL);
  }
}
```

### 4. **Usando el Componente RoleIndicator**

El componente `RoleIndicator` muestra automáticamente el rol en la UI y consola:

```jsx
import RoleIndicator from '../components/RoleIndicator';

function App() {
  return (
    <>
      {/* Mostrar en UI y consola */}
      <RoleIndicator showInUI={true} showInConsole={true} />
      
      {/* Solo en consola */}
      <RoleIndicator showInUI={false} showInConsole={true} />
    </>
  );
}
```

## 🔍 Ejemplos de Uso

### Ejemplo 1: Verificar rol en un componente

```jsx
import { useAuth } from '../hooks/useAuth';
import { identifyRoleType } from '../utils/roleIdentifier';

function MiComponente() {
  const { user } = useAuth();
  const tipoRol = identifyRoleType(user?.rol?.nombreRol);
  
  if (tipoRol === 'admin') {
    return <div>Vista de Administrador</div>;
  } else if (tipoRol === 'diseñador') {
    return <div>Vista de Diseñador</div>;
  } else if (tipoRol === 'cliente') {
    return <div>Vista de Cliente</div>;
  } else if (tipoRol === 'estudiante') {
    return <div>Vista de Estudiante</div>;
  }
  
  return <div>Rol desconocido</div>;
}
```

### Ejemplo 2: Agregar rol a la URL (solo desarrollo)

```jsx
import { useEffect } from 'react';
import { addRoleToURL } from '../utils/roleIdentifier';

function MiComponente() {
  useEffect(() => {
    // Solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      addRoleToURL();
    }
  }, []);
}
```

### Ejemplo 3: Logging automático en consola

```jsx
import { useEffect } from 'react';
import { logUserRole } from '../utils/roleIdentifier';

function MiComponente() {
  useEffect(() => {
    // Mostrar información del rol en consola
    logUserRole();
  }, []);
}
```

## 📝 Estructura del Objeto User

El objeto `user` en localStorage tiene esta estructura:

```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "rolID": 1,
  "rol": {
    "rolID": 1,
    "nombreRol": "Administrador"
  },
  "permissions": [
    {
      "nombreModulo": "Cursos",
      "nombreSubmodulo": "Básico"
    }
  ]
}
```

## ⚠️ Notas Importantes

1. **Seguridad**: No agregar el rol directamente en la URL en producción, ya que puede ser manipulado por el usuario.

2. **Recomendación**: Usar siempre `useAuth()` o `getUserRoleInfo()` que obtienen el rol desde el token/localStorage.

3. **Debugging**: El componente `RoleIndicator` está configurado para mostrarse solo en desarrollo (`NODE_ENV === 'development'`).

4. **Identificación por nombre**: La función `identifyRoleType()` identifica el rol por el nombre, no por el ID, lo que es más flexible.

## 🎯 Casos de Uso

- **Debugging**: Ver qué rol tiene el usuario actual
- **Logging**: Registrar el rol en logs del sistema
- **UI Condicional**: Mostrar diferentes vistas según el rol
- **Permisos**: Verificar permisos antes de mostrar funcionalidades
- **Analytics**: Trackear qué roles usan qué funcionalidades

