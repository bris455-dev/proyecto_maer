// src/pages/Inicio.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import "../styles/Inicio.css"; // crea este archivo para estilos
import { useMenu } from "../context/MenuContext"; // 👈 Importar el contexto



//imágenes
import inicioImg from "../assets/inicio.jpg";
import clientesImg from "../assets/clientes.jpg";
import consultarproyectosImg from "../assets/consultarproyectos.jpeg";
import proyectosImg from "../assets/proyectos.jpeg";
import reportesImg from "../assets/reportes.jpeg";
import seguridadImg from "../assets/seguridad.jpeg";


function Inicio() {
  const navigate = useNavigate();
  const { menuAbierto, setMenuAbierto, setMostrarSubmenu } = useMenu(); // 👈 Obtenemos el estado global




  // Lista de módulos con nombre e imagen opcional
  const modulos = [
    { nombre: "Inicio", imagen: inicioImg, ruta: "/inicio" },
    { nombre: "Clientes", imagen: clientesImg, ruta: "/clientes" },
    { nombre: "Proyectos", imagen: proyectosImg, ruta: "/proyectos" },
    { nombre: "Consultar Proyectos", imagen: consultarproyectosImg, ruta: "/consultar" },
    { nombre: "Reportes", imagen: reportesImg, ruta: "/reportes" },
    { nombre: "Seguridad", imagen: seguridadImg, ruta: "/seguridad" },
  ];

  const handleClickModulo = (modulo) => {
    if (!menuAbierto) setMenuAbierto(true); // abre el menú si está cerrado

    // Si el módulo tiene submenú, lo despliega en lugar de navegar
  if (["Seguridad", "Clientes", "Proyectos", "Reportes"].includes(modulo.nombre)) {
    setMostrarSubmenu(modulo.nombre);
   } else {
    setMostrarSubmenu(null);
    navigate(modulo.ruta);
   }
  };

  return (
    <Layout>  
        <h1>Bienvenido a la Plataforma MAER</h1>
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
    </Layout>
  );
}

export default Inicio;