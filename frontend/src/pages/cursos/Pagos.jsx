import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCarrito, procesarPago } from '../../api/cursos';
import { FaCreditCard, FaPaypal, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';
import './Pagos.css';

export default function Pagos() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Tarjeta');
  const [datosPago, setDatosPago] = useState({
    numeroTarjeta: '',
    nombreTitular: '',
    fechaVencimiento: '',
    cvv: '',
    emailPayPal: '',
    numeroYape: '',
    numeroPlin: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    try {
      const response = await getCarrito();
      if (response.status === 'success') {
        setCarrito(response.data || []);
        setTotal(response.total || 0);
        
        if (response.data.length === 0) {
          alert('El carrito está vacío');
          navigate('/cursos/carrito');
        }
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPago(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas según método de pago
    if (metodoPago === 'Tarjeta') {
      if (!datosPago.numeroTarjeta || !datosPago.nombreTitular || !datosPago.fechaVencimiento || !datosPago.cvv) {
        alert('Por favor complete todos los datos de la tarjeta');
        return;
      }
    } else if (metodoPago === 'PayPal') {
      if (!datosPago.emailPayPal) {
        alert('Por favor ingrese su email de PayPal');
        return;
      }
    } else if (metodoPago === 'Yape' || metodoPago === 'Plin') {
      if (!datosPago.numeroYape && metodoPago === 'Yape') {
        alert('Por favor ingrese su número de Yape');
        return;
      }
      if (!datosPago.numeroPlin && metodoPago === 'Plin') {
        alert('Por favor ingrese su número de Plin');
        return;
      }
    }

    try {
      setProcesando(true);
      
      const datosTransaccion = {
        metodo_pago: metodoPago,
        datos_transaccion: {
          ...datosPago,
          fecha: new Date().toISOString()
        }
      };

      const response = await procesarPago(datosTransaccion);
      
      if (response.status === 'success') {
        setPagoExitoso(true);
        setTimeout(() => {
          navigate('/cursos');
        }, 3000);
      } else {
        alert(response.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error al procesar el pago. Por favor intente nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  if (pagoExitoso) {
    return (
      <div className="pago-exitoso">
        <FaCheckCircle size={64} />
        <h2>¡Pago Exitoso!</h2>
        <p>Tu matrícula ha sido procesada correctamente.</p>
        <p>Redirigiendo a tus cursos...</p>
      </div>
    );
  }

  return (
    <div className="pagos-container">
      <div className="pagos-header">
        <h1>Procesar Pago</h1>
        <button 
          className="btn-volver-pagos"
          onClick={() => navigate('/cursos/carrito')}
        >
          Volver al Carrito
        </button>
      </div>

      <div className="pagos-content">
        <div className="resumen-pago">
          <h2>Resumen de Compra</h2>
          <div className="items-resumen">
            {carrito.map((item) => (
              <div key={item.carritoID} className="item-resumen">
                <span>{item.curso.nombre}</span>
                <span>{formatMoneda(item.curso.precio)}</span>
              </div>
            ))}
          </div>
          <div className="total-resumen">
            <span>Total:</span>
            <span>{formatMoneda(total)}</span>
          </div>
        </div>

        <div className="form-pago">
          <h2>Método de Pago</h2>
          
          <div className="metodos-pago">
            <button
              type="button"
              className={`metodo-btn ${metodoPago === 'Tarjeta' ? 'active' : ''}`}
              onClick={() => setMetodoPago('Tarjeta')}
            >
              <FaCreditCard /> Tarjeta de Crédito/Débito
            </button>
            <button
              type="button"
              className={`metodo-btn ${metodoPago === 'PayPal' ? 'active' : ''}`}
              onClick={() => setMetodoPago('PayPal')}
            >
              <FaPaypal /> PayPal
            </button>
            <button
              type="button"
              className={`metodo-btn ${metodoPago === 'Yape' ? 'active' : ''}`}
              onClick={() => setMetodoPago('Yape')}
            >
              <FaMobileAlt /> Yape
            </button>
            <button
              type="button"
              className={`metodo-btn ${metodoPago === 'Plin' ? 'active' : ''}`}
              onClick={() => setMetodoPago('Plin')}
            >
              <FaMobileAlt /> Plin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-datos-pago">
            {metodoPago === 'Tarjeta' && (
              <>
                <div className="form-group">
                  <label>Número de Tarjeta *</label>
                  <input
                    type="text"
                    name="numeroTarjeta"
                    value={datosPago.numeroTarjeta}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del Titular *</label>
                  <input
                    type="text"
                    name="nombreTitular"
                    value={datosPago.nombreTitular}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Vencimiento *</label>
                    <input
                      type="text"
                      name="fechaVencimiento"
                      value={datosPago.fechaVencimiento}
                      onChange={handleChange}
                      placeholder="MM/AA"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      type="text"
                      name="cvv"
                      value={datosPago.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {metodoPago === 'PayPal' && (
              <div className="form-group">
                <label>Email de PayPal *</label>
                <input
                  type="email"
                  name="emailPayPal"
                  value={datosPago.emailPayPal}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>
            )}

            {metodoPago === 'Yape' && (
              <div className="form-group">
                <label>Número de Yape *</label>
                <input
                  type="text"
                  name="numeroYape"
                  value={datosPago.numeroYape}
                  onChange={handleChange}
                  placeholder="987654321"
                  required
                />
                <p className="info-pago">Realiza el pago a través de la app Yape y confirma aquí.</p>
              </div>
            )}

            {metodoPago === 'Plin' && (
              <div className="form-group">
                <label>Número de Plin *</label>
                <input
                  type="text"
                  name="numeroPlin"
                  value={datosPago.numeroPlin}
                  onChange={handleChange}
                  placeholder="987654321"
                  required
                />
                <p className="info-pago">Realiza el pago a través de la app Plin y confirma aquí.</p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-procesar-pago"
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : `Pagar ${formatMoneda(total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

