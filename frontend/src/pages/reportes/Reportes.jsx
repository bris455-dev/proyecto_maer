import React from "react";
import Layout from "../../components/layout";

function Reportes({ setIsAuthenticated }) {
  return (
    <Layout setIsAuthenticated={setIsAuthenticated}>
      <h1>Reportes y Dashboard</h1>
      <p>Genera reportes personalizados, gráficos y análisis del rendimiento del sistema.</p>
    </Layout>
  );
}

export default Reportes;


