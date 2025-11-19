import React from "react";
import "../styles/consultar.css";

// NOTA IMPORTANTE: Se ha eliminado la importación y el uso de <Layout>
// para evitar el menú lateral doble en la aplicación. Este componente
// ahora solo contiene el contenido de la página.

function Consultar() {
  return (
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
  );
}

export default Consultar;
