import React, { useEffect, useState } from 'react';
import { useProyectos } from '../../hooks/useProyectos.js';
import { useNavigate } from 'react-router-dom';
import { getClientes } from '../../api/clientesApi.js';
import { getClienteNombre, getEmpleadoNombre, getEmpleadoId } from '../../utils/ProyectoHelpers.js';
import '../../styles/proyectos.css';

const formatFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  try { return new Date(fecha).toLocaleDateString(); } 
  catch { return fecha; }
};

const Proyectos = () => {
  const { proyectos, loading, error, fetchProyectos } = useProyectos();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Clientes
        const resClientes = await getClientes();
        const listaClientes = Array.isArray(resClientes?.data) ? resClientes.data : resClientes?.clientes || [];
        if (isMounted) setClientes(listaClientes);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }

      try {
        // Empleados
        const token = localStorage.getItem("auth_token");
        const respuesta = await fetch("/api/usuarios", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await respuesta.json().catch(() => ({}));
        const todosUsuarios = Array.isArray(data?.data) ? data.data : data?.usuarios || [];

        // Filtrar solo rol 1 (admin) y rol 2 (diseñador)
        const listaEmpleados = todosUsuarios.filter((u) => {
          const rolId = u.rolID || u.rol?.rolID;
          return rolId === 1 || rolId === 2;
        });

        if (isMounted) setEmpleados(listaEmpleados);
      } catch (err) {
        console.error("Error cargando diseñadores:", err);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  if (loading) return <p>Cargando proyectos...</p>;

  return (
    <div className="proyectos-container">
      <div className="proyectos-header">
        <h1>Listado de Proyectos</h1>
        <button onClick={() => navigate('/proyectos/nuevo')} className="btn-nuevo">+ Nuevo Proyecto</button>
      </div>

      {error && (
        <div className="alert-error">
          <p>{error}</p>
          <button type="button" onClick={fetchProyectos}>Reintentar</button>
        </div>
      )}

      <table className="proyectos-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Paciente</th>
            <th>Cliente</th>
            <th>Diseñador</th>
            <th>Fecha Inicio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proyectos.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No hay proyectos registrados</td>
            </tr>
          )}
          {proyectos.map((p) => {
            const id = p.proyectoID || p.id;

            // Normalizar cliente
            let cliente = null;
            if (clientes.length > 0) {
              // Intentar buscar por clienteID o id
              cliente = clientes.find(c =>
                c.id === p.clienteID ||
                c.clienteID === p.clienteID ||
                c.clienteId === p.clienteID ||
                c.cliente_id === p.clienteID
              ) || { nombre: p.cliente_nombre };
            } else {
              cliente = { nombre: p.cliente_nombre || "Cliente sin nombre" };
            }

            // Normalizar empleado
            const empleado = empleados.find(e => getEmpleadoId(e) === (p.empleadoID || p.diseñadorID)) || p.empleado || { nombre: p.diseñador_nombre };

            return (
              <tr key={id}>
                <td>{p.numero_proyecto || p.codigo || 'Sin asignar'}</td>
                <td>{p.nombre || p.paciente || 'Sin asignar'}</td>
                <td>{getClienteNombre(cliente)}</td>
                <td>{getEmpleadoNombre(empleado)}</td>
                <td>{formatFecha(p.fecha_inicio)}</td>
                <td className="proyectos-acciones">
                  <button onClick={() => navigate(`/proyectos/${id}`)}>Ver Detalle</button>
                  <button onClick={() => navigate(`/proyectos/editar/${id}`)}>Editar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Proyectos;
