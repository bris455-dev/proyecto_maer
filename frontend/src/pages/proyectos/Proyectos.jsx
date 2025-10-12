import React from "react";
import Layout from "../../components/layout";

function Proyectos({ setIsAuthenticated }) {
  return (
    <Layout setIsAuthenticated={setIsAuthenticated}>
      <h1>Gestión de Proyectos</h1>
      <p>Administra los proyectos activos, asigna responsables y controla el progreso.</p>
    </Layout>
  );
}

export default Proyectos;

