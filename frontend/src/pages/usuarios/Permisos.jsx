import { useState, useEffect } from "react";
import { FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Permisos = () => {
  const [permisos, setPermisos] = useState([]);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const navigate = useNavigate();

  // ============================
  // Cargar permisos desde API 🚀
  // ============================
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:8080/api/permisos", {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        const json = await res.json();
        setPermisos(json.data);   // 👈 importante!
      } catch (error) {
        console.error("Error cargando permisos:", error);
      }
    };

    cargarPermisos();
  }, []);

  // ============================
  // Seleccionar permisos
  // ============================
  const togglePermiso = (id) => {
    setPermisosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const guardarAsignacion = () => {
    console.log("Permisos asignados:", permisosSeleccionados);
    alert("Permisos asignados correctamente 👌");

    navigate("/seguridad/roles");
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-2xl font-bold mb-5 text-gray-800">Asignar Permisos al Rol</h2>
        <p className="text-gray-600 mb-6">Marca los permisos que este rol podrá utilizar dentro del sistema.</p>

        {/* Tabla de permisos */}
        <table className="w-full border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left font-semibold">Módulo</th>
              <th className="p-3 text-left font-semibold">Submódulo</th>
              <th className="p-3 text-center font-semibold">Asignar</th>
            </tr>
          </thead>
          <tbody>
            {permisos.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{p.nombreModulo}</td>
                <td className="p-3 text-gray-600">{p.nombreSubmodulo}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={permisosSeleccionados.includes(p.id)}
                    onChange={() => togglePermiso(p.id)}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botón guardar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={guardarAsignacion}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <FaSave /> Guardar permisos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Permisos;
