import React from "react";
import Layout from "../../components/layout";

function Clientes({ setIsAuthenticated }) {
  return (
    <Layout setIsAuthenticated={setIsAuthenticated}>
      <h1>Gestión de Clientes</h1>
      <p>Aquí podrás ver, agregar o editar clientes del sistema.</p>
    </Layout>
  );
}

export default Clientes;

