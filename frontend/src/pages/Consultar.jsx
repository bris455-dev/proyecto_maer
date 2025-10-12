// src/pages/Consultar.jsx
import React from "react";
import Layout from "../components/layout";
import "../styles/consultar.css";

function Consultar() {
  return (
    <Layout>
      <div className="consultar-container">
        <h1 className="titulo">Consultar Información</h1>

        <p className="descripcion">
          En esta sección puedes realizar búsquedas y consultas detalladas sobre clientes,
          proyectos o registros del sistema.
        </p>

        {/* 🔍 Formulario de consulta */}
        <form className="form-consultar">
          <input
            type="text"
            placeholder="Escribe el nombre o código del registro a buscar..."
          />
          <button type="submit">Buscar</button>
        </form>

        {/* 📋 Resultados simulados */}
        <div className="resultados">
          <p>No se encontraron resultados.</p>
        </div>
      </div>
    </Layout>
  );
}

export default Consultar;
