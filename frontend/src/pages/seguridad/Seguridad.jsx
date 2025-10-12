import React from "react";
import Layout from "../../components/layout";

function Seguridad({ setIsAuthenticated }) {
  return (
    <Layout setIsAuthenticated={setIsAuthenticated}>
      <h1>Configuración de Seguridad</h1>
      <p>Administra usuarios, contraseñas, autenticación MFA y roles de acceso.</p>
    </Layout>
  );
}

export default Seguridad;

