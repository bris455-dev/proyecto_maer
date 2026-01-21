import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducto, crearProducto, actualizarProducto, getCategorias } from '../../api/inventario';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import './CrearProducto.css';

const CrearProducto = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    unidad_medida: 'unidad',
    stock_inicial: 0,
    stock_minimo: 0,
    stock_maximo: '',
    precio_unitario: 0,
    proveedor: '',
    ubicacion: '',
    activo: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategorias();
    if (isEdit) {
      fetchProducto();
    }
  }, [id]);

  const fetchCategorias = async () => {
    try {
      const response = await getCategorias();
      if (response.status === 'success') {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchProducto = async () => {
    try {
      setLoading(true);
      const response = await getProducto(id);
      if (response.status === 'success') {
        const producto = response.data;
        setFormData({
          codigo: producto.codigo || '',
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          categoria_id: producto.categoria_id || '',
          unidad_medida: producto.unidad_medida || 'unidad',
          stock_inicial: 0, // No se edita el stock inicial
          stock_minimo: producto.stock_minimo || 0,
          stock_maximo: producto.stock_maximo || '',
          precio_unitario: producto.precio_unitario || 0,
          proveedor: producto.proveedor || '',
          ubicacion: producto.ubicacion || '',
          activo: producto.activo !== undefined ? producto.activo : true
        });
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      alert('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.codigo.trim()) newErrors.codigo = 'El código es requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.categoria_id) newErrors.categoria_id = 'La categoría es requerida';
    if (formData.stock_minimo < 0) newErrors.stock_minimo = 'El stock mínimo no puede ser negativo';
    if (formData.stock_maximo && parseFloat(formData.stock_maximo) < parseFloat(formData.stock_minimo)) {
      newErrors.stock_maximo = 'El stock máximo debe ser mayor al mínimo';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const data = { ...formData };
      if (isEdit) {
        // En edición no se envía stock_inicial
        delete data.stock_inicial;
        const response = await actualizarProducto(id, data);
        if (response.status === 'success') {
          alert('Producto actualizado correctamente');
          navigate('/inventario');
        } else {
          alert(response.message || 'Error al actualizar producto');
        }
      } else {
        const response = await crearProducto(data);
        if (response.status === 'success') {
          alert('Producto creado correctamente');
          navigate('/inventario');
        } else {
          alert(response.message || 'Error al crear producto');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="loading">Cargando producto...</div>;
  }

  return (
    <div className="crear-producto-container">
      <div className="crear-producto-header">
        <button className="btn-back" onClick={() => navigate('/inventario')}>
          <FaArrowLeft /> Volver
        </button>
        <h1>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Código *</label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              disabled={isEdit}
              className={errors.codigo ? 'error' : ''}
            />
            {errors.codigo && <span className="error-message">{errors.codigo}</span>}
          </div>

          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label>Categoría *</label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChange}
              className={errors.categoria_id ? 'error' : ''}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            {errors.categoria_id && <span className="error-message">{errors.categoria_id}</span>}
          </div>

          <div className="form-group">
            <label>Unidad de Medida</label>
            <select
              name="unidad_medida"
              value={formData.unidad_medida}
              onChange={handleChange}
            >
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramos</option>
              <option value="g">Gramos</option>
              <option value="litro">Litros</option>
              <option value="ml">Mililitros</option>
              <option value="m">Metros</option>
              <option value="cm">Centímetros</option>
            </select>
          </div>

          {!isEdit && (
            <div className="form-group">
              <label>Stock Inicial</label>
              <input
                type="number"
                name="stock_inicial"
                value={formData.stock_inicial}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          )}

          <div className="form-group">
            <label>Stock Mínimo *</label>
            <input
              type="number"
              name="stock_minimo"
              value={formData.stock_minimo}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.stock_minimo ? 'error' : ''}
            />
            {errors.stock_minimo && <span className="error-message">{errors.stock_minimo}</span>}
          </div>

          <div className="form-group">
            <label>Stock Máximo</label>
            <input
              type="number"
              name="stock_maximo"
              value={formData.stock_maximo}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.stock_maximo ? 'error' : ''}
            />
            {errors.stock_maximo && <span className="error-message">{errors.stock_maximo}</span>}
          </div>

          <div className="form-group">
            <label>Precio Unitario</label>
            <input
              type="number"
              name="precio_unitario"
              value={formData.precio_unitario}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Proveedor</label>
            <input
              type="text"
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Ubicación</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Almacén A, Estante 3"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              Producto activo
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/inventario')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FaSave /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearProducto;

