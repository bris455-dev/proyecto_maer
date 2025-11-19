import React, { useState } from "react";
import { crearUsuario } from "../../api/usuarios.js";

export default function CrearUsuario() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rolID, setRolID] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearUsuario({ nombre, email, rolID });
      setMensaje(`Usuario ${nombre} creado correctamente`);
      setNombre(""); setEmail(""); setRolID("");
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Error al crear usuario");
    }
  };

  return (
    <div>
      <h2>Crear Usuario</h2>
      {mensaje && <p>{mensaje}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="ID de rol"
          value={rolID}
          onChange={(e) => setRolID(e.target.value)}
          required
        />
        <button type="submit">Crear Usuario</button>
      </form>
    </div>
  );
}
