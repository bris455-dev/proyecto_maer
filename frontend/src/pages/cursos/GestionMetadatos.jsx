import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumbs from '../../components/Breadcrumbs';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import './GestionMetadatos.css';

const API_BASE = '/api/cursos/metadata';

export default function GestionMetadatos() {
  const { hasPermission } = useAuth();
  const [metadata, setMetadata] = useState({
    software: [],
    aplicaciones: [],
    niveles: [],
    producciones: []
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [newItem, setNewItem] = useState({
    software: '',
    aplicacion: '',
    nivel: '',
    produccion: ''
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setMetadata(data.data);
        }
      }
    } catch (error) {
      console.error('Error cargando metadatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (type) => {
    const nombre = newItem[type];
    if (!nombre.trim()) {
      alert('Por favor ingrese un nombre');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setNewItem(prev => ({ ...prev, [type]: '' }));
          fetchMetadata();
        } else {
          alert(data.message || 'Error al crear');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear');
      }
    } catch (error) {
      console.error('Error creando:', error);
      alert('Error al crear: ' + error.message);
    }
  };

  const handleEdit = (type, id, currentName) => {
    setEditing(prev => ({
      ...prev,
      [`${type}_${id}`]: currentName
    }));
  };

  const handleSave = async (type, id) => {
    const nombre = editing[`${type}_${id}`];
    if (!nombre || !nombre.trim()) {
      alert('Por favor ingrese un nombre válido');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setEditing(prev => {
            const newEditing = { ...prev };
            delete newEditing[`${type}_${id}`];
            return newEditing;
          });
          fetchMetadata();
        } else {
          alert(data.message || 'Error al actualizar');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error actualizando:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Está seguro de eliminar este elemento?')) return;

    try {
      const response = await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          fetchMetadata();
        } else {
          alert(data.message || 'Error al eliminar');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handleCancel = (type, id) => {
    setEditing(prev => {
      const newEditing = { ...prev };
      delete newEditing[`${type}_${id}`];
      return newEditing;
    });
  };

  const renderTable = (type, items, label) => {
    const isEditing = (id) => editing[`${type}_${id}`] !== undefined;
    const editValue = (id) => editing[`${type}_${id}`] || '';

    return (
      <div className="metadata-section">
        <div className="metadata-header">
          <h2>{label}</h2>
          <div className="add-item-form">
            <input
              type="text"
              placeholder={`Añadir nuevo ${label.toLowerCase()}`}
              value={newItem[type]}
              onChange={(e) => setNewItem(prev => ({ ...prev, [type]: e.target.value }))}
              className="add-input"
            />
            <button
              className="btn-add"
              onClick={() => handleCreate(type)}
            >
              <FaPlus /> Añadir
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="no-items">No hay elementos registrados</div>
        ) : (
          <table className="metadata-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    {isEditing(item.id) ? (
                      <input
                        type="text"
                        value={editValue(item.id)}
                        onChange={(e) => setEditing(prev => ({
                          ...prev,
                          [`${type}_${item.id}`]: e.target.value
                        }))}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <span>{item.nombre}</span>
                    )}
                  </td>
                  <td>
                    {isEditing(item.id) ? (
                      <div className="acciones-cell">
                        <button
                          className="btn-action btn-save"
                          onClick={() => handleSave(type, item.id)}
                          title="Guardar"
                        >
                          <FaSave />
                        </button>
                        <button
                          className="btn-action btn-cancel"
                          onClick={() => handleCancel(type, item.id)}
                          title="Cancelar"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="acciones-cell">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(type, item.id, item.nombre)}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(type, item.id)}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="gestion-metadatos-container">
      <Breadcrumbs />
      
      <div className="gestion-metadatos-header">
        <h1>Gestión de Metadatos</h1>
        <p className="subtitle">Configure las etiquetas y clasificaciones para los filtros del catálogo</p>
      </div>

      {renderTable('software', metadata.software || [], 'Software Principal')}
      {renderTable('aplicacion', metadata.aplicaciones || [], 'Aplicación / Restauración')}
      {renderTable('produccion', metadata.producciones || [], 'Salida de Producción')}
      
      {/* Nota: Niveles no se editan aquí ya que son fijos (Principiante, Intermedio, Avanzado) */}
      <div className="metadata-section">
        <div className="metadata-header">
          <h2>Nivel de Profundidad</h2>
        </div>
        <div className="info-box">
          <p>Los niveles (Principiante, Intermedio, Avanzado) son fijos y no pueden ser modificados.</p>
        </div>
      </div>
    </div>
  );
}

