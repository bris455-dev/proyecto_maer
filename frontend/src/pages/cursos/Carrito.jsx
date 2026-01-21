import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isStudent } from '../../utils/roleHelper';
import { getCarrito, eliminarDelCarrito, vaciarCarrito } from '../../api/cursos';
import { FaTrash, FaShoppingCart, FaCreditCard, FaTimes } from 'react-icons/fa';
import './Carrito.css';

export default function Carrito() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    try {
      setLoading(true);
      const response = await getCarrito();
      if (response.status === 'success') {
        setCarrito(response.data || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (carritoID) => {
    try {
      const response = await eliminarDelCarrito(carritoID);
      if (response.status === 'success') {
        cargarCarrito();
      } else {
        alert(response.message || 'Error al eliminar del carrito');
      }
    } catch (error) {
      console.error('Error eliminando del carrito:', error);
      alert('Error al eliminar del carrito');
    }
  };

  const handleVaciar = async () => {
    if (!window.confirm('¿Está seguro de vaciar el carrito?')) return;

    try {
      const response = await vaciarCarrito();
      if (response.status === 'success') {
        cargarCarrito();
      } else {
        alert(response.message || 'Error al vaciar el carrito');
      }
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      alert('Error al vaciar el carrito');
    }
  };

  const handlePagar = () => {
    navigate('/cursos/pagos');
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  if (loading) {
    return <div className="carrito-loading">Cargando carrito...</div>;
  }

  return (
    <div className="carrito-container">
      <div className="carrito-header">
        <h1>
          <FaShoppingCart /> Carrito de Compras
        </h1>
        {carrito.length > 0 && (
          <button 
            className="btn-vaciar"
            onClick={handleVaciar}
          >
            <FaTimes /> Vaciar Carrito
          </button>
        )}
      </div>

      {carrito.length === 0 ? (
        <div className="carrito-vacio">
          <FaShoppingCart size={64} />
          <h2>Tu carrito está vacío</h2>
          <p>Agrega cursos para comenzar tu aprendizaje</p>
          <button 
            className="btn-explorar"
            onClick={() => {
              // Si es estudiante, redirigir a su catálogo, sino a la lista de cursos
              if (isStudent(user)) {
                navigate('/estudiante/catalogo');
              } else {
                navigate('/cursos');
              }
            }}
          >
            Explorar Cursos
          </button>
        </div>
      ) : (
        <>
          <div className="carrito-items">
            {carrito.map((item) => (
              <div key={item.carritoID} className="carrito-item">
                <div className="item-info">
                  <h3>{item.curso.nombre}</h3>
                  <p className="item-nivel">{item.curso.nivel}</p>
                  <p className="item-descripcion">{item.curso.descripcion}</p>
                  <div className="item-meta">
                    <span>{item.curso.cantidad_horas} horas</span>
                  </div>
                </div>
                <div className="item-precio">
                  <span className="precio">{formatMoneda(item.curso.precio)}</span>
                  <button
                    className="btn-eliminar-item"
                    onClick={() => handleEliminar(item.carritoID)}
                    title="Eliminar del carrito"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="carrito-resumen">
            <div className="resumen-total">
              <span className="total-label">Total:</span>
              <span className="total-valor">{formatMoneda(total)}</span>
            </div>
            <button 
              className="btn-pagar"
              onClick={handlePagar}
            >
              <FaCreditCard /> Proceder al Pago
            </button>
          </div>
        </>
      )}
    </div>
  );
}

