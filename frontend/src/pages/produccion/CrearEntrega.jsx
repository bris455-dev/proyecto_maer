import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { crearEntrega } from '../../api/produccion';
import { getUsuarios } from '../../api/usuarios';
import { getProductos } from '../../api/inventario';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import './CrearEntrega.css';

const CrearEntrega = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState({
    usuario_asignado_id: '',
    fecha_entrega: new Date().toISOString().split('T')[0],
    motivo: '',
    observaciones: ''
  });
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoForm, setProductoForm] = useState({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsuarios();
    fetchProductos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await getUsuarios();
      if (response.status === 'success') {
        setUsuarios(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await getProductos({ activo: 1, per_page: 1000 });
      if (response.status === 'success') {
        setProductos(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAgregarProducto = () => {
    if (!productoForm.producto_id || !productoForm.cantidad) {
      alert('Seleccione un producto y especifique la cantidad');
      return;
    }

    const producto = productos.find(p => p.id === parseInt(productoForm.producto_id));
    if (!producto) return;

    const nuevoProducto = {
      producto_id: parseInt(productoForm.producto_id),
      cantidad: parseFloat(productoForm.cantidad),
      precio_unitario: parseFloat(productoForm.precio_unitario) || producto.precio_unitario || 0,
      observaciones: productoForm.observaciones || '',
      producto_nombre: producto.nombre,
      producto_codigo: producto.codigo
    };

    setProductosSeleccionados(prev => [...prev, nuevoProducto]);
    setProductoForm({ producto_id: '', cantidad: '', precio_unitario: '', observaciones: '' });
    setShowProductoModal(false);
  };

  const handleEliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.usuario_asignado_id) newErrors.usuario_asignado_id = 'El usuario asignado es requerido';
    if (!formData.fecha_entrega) newErrors.fecha_entrega = 'La fecha de entrega es requerida';
    if (productosSeleccionados.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const data = {
        ...formData,
        productos: productosSeleccionados.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          observaciones: p.observaciones
        }))
      };

      const response = await crearEntrega(data);
      if (response.status === 'success') {
        alert('Entrega creada correctamente');
        navigate('/produccion');
      } else {
        alert(response.message || 'Error al crear entrega');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la entrega');
    } finally {
      setLoading(false);
    }
  };

  const getProductoNombre = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    return producto ? `${producto.nombre} (${producto.codigo})` : 'Producto no encontrado';
  };

  return (
    <div className="crear-entrega-container">
      <div className="crear-entrega-header">
        <button className="btn-back" onClick={() => navigate('/produccion')}>
          <FaArrowLeft /> Volver
        </button>
        <h1>Nueva Entrega de Producción</h1>
      </div>

      <form onSubmit={handleSubmit} className="entrega-form">
        <div className="form-section">
          <h2>Información General</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Usuario Asignado *</label>
              <select
                name="usuario_asignado_id"
                value={formData.usuario_asignado_id}
                onChange={handleChange}
                className={errors.usuario_asignado_id ? 'error' : ''}
              >
                <option value="">Seleccione un usuario</option>
                {usuarios.map(usr => (
                  <option key={usr.id} value={usr.id}>{usr.nombre}</option>
                ))}
              </select>
              {errors.usuario_asignado_id && <span className="error-message">{errors.usuario_asignado_id}</span>}
            </div>

            <div className="form-group">
              <label>Fecha de Entrega *</label>
              <input
                type="date"
                name="fecha_entrega"
                value={formData.fecha_entrega}
                onChange={handleChange}
                className={errors.fecha_entrega ? 'error' : ''}
              />
              {errors.fecha_entrega && <span className="error-message">{errors.fecha_entrega}</span>}
            </div>

            <div className="form-group full-width">
              <label>Motivo</label>
              <textarea
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                rows="3"
                placeholder="Motivo de la entrega..."
              />
            </div>

            <div className="form-group full-width">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="3"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Productos</h2>
            <button
              type="button"
              className="btn-add"
              onClick={() => setShowProductoModal(true)}
            >
              <FaPlus /> Agregar Producto
            </button>
          </div>

          {errors.productos && <span className="error-message">{errors.productos}</span>}

          {productosSeleccionados.length === 0 ? (
            <div className="no-products">No hay productos agregados</div>
          ) : (
            <div className="productos-table-container">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosSeleccionados.map((prod, index) => (
                    <tr key={index}>
                      <td>{prod.producto_codigo}</td>
                      <td>{prod.producto_nombre}</td>
                      <td>{prod.cantidad}</td>
                      <td>${prod.precio_unitario.toFixed(2)}</td>
                      <td><strong>${(prod.cantidad * prod.precio_unitario).toFixed(2)}</strong></td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleEliminarProducto(index)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                    <td style={{ fontWeight: 'bold' }}>
                      ${productosSeleccionados.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/produccion')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FaSave /> {loading ? 'Guardando...' : 'Crear Entrega'}
          </button>
        </div>
      </form>

      {showProductoModal && (
        <div className="modal-overlay" onClick={() => setShowProductoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Agregar Producto</h2>
            <div className="form-group">
              <label>Producto *</label>
              <select
                value={productoForm.producto_id}
                onChange={(e) => {
                  const producto = productos.find(p => p.id === parseInt(e.target.value));
                  setProductoForm(prev => ({
                    ...prev,
                    producto_id: e.target.value,
                    precio_unitario: producto ? producto.precio_unitario : ''
                  }));
                }}
                required
              >
                <option value="">Seleccione un producto</option>
                {productos.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre} ({prod.codigo}) - Stock: {prod.stock_actual}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Cantidad *</label>
              <input
                type="number"
                value={productoForm.cantidad}
                onChange={(e) => setProductoForm(prev => ({ ...prev, cantidad: e.target.value }))}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Precio Unitario</label>
              <input
                type="number"
                value={productoForm.precio_unitario}
                onChange={(e) => setProductoForm(prev => ({ ...prev, precio_unitario: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                value={productoForm.observaciones}
                onChange={(e) => setProductoForm(prev => ({ ...prev, observaciones: e.target.value }))}
                rows="2"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowProductoModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleAgregarProducto}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearEntrega;

