import React, { useEffect } from "react";
import { useMenu } from "../hooks/useMenu";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { isStudent } from "../utils/roleHelper.js";
import "../styles/Inicio.css";
import { routesMap } from "../config/routesMap";

// imágenes
import inicioImg from "../assets/inicio.jpg";
import clientesImg from "../assets/clientes.jpg";
import consultarproyectosImg from "../assets/consultarproyectos.jpeg";
import proyectosImg from "../assets/proyectos.jpeg";
import reportesImg from "../assets/reportes.jpeg";
import seguridadImg from "../assets/seguridad.jpeg";
// Usar reportes como imagen temporal para facturación
const facturacionImg = reportesImg;

function Inicio() {
  const { menuAbierto, setMenuAbierto, setMostrarSubmenu } = useMenu();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si el usuario es estudiante, redirigir al dashboard del estudiante
  useEffect(() => {
    if (user && isStudent(user)) {
      navigate('/estudiante/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Si es estudiante, no mostrar nada mientras redirige
  if (user && isStudent(user)) {
    return null;
  }

  const email = user?.email || "";
  const permissions = user?.permissions || [];

  const modulosDisponibles = [
    { nombre: "Inicio", imagen: inicioImg },
    { nombre: "Clientes", imagen: clientesImg },
    { nombre: "Proyectos", imagen: proyectosImg },
    { nombre: "Consultar Proyectos", imagen: consultarproyectosImg },
    { nombre: "Reportes", imagen: reportesImg },
    { nombre: "Facturación", imagen: facturacionImg },
    { nombre: "Cursos", imagen: reportesImg },
    { nombre: "Seguridad", imagen: seguridadImg },
  ];

  const modulos = modulosDisponibles.filter(mod => 
    permissions.some(p => p.nombreModulo === mod.nombre) || mod.nombre === "Inicio"
  );

  const handleClickModulo = (modulo) => {
    if (!menuAbierto) setMenuAbierto(true);
    setMostrarSubmenu(modulo.nombre);

    const ruta = routesMap[modulo.nombre]?.rutaFrontend || "/inicio";
    navigate(ruta);
  };

  return (
    <div className="inicio-container">
      <h1>Bienvenido a la Plataforma MAER</h1>
      {email && <p className="bienvenida-texto"><strong>{email}</strong></p>}

      <div className="grid-modulos">
        {modulos.map((modulo, index) => (
          <div key={index} className="card-modulo">
            <img src={modulo.imagen} alt={modulo.nombre} className="img-modulo" />
            <button onClick={() => handleClickModulo(modulo)}>
              {modulo.nombre}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Inicio;
