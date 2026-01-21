import React from 'react';
import { FaComments, FaUsers, FaEnvelope } from 'react-icons/fa';
import './Mensajes.css';

export default function EstudianteMensajes() {
  return (
    <div className="estudiante-mensajes">
      <div className="mensajes-header">
        <h1>Mensajes y Comunidad</h1>
        <p>Conecta con instructores y otros estudiantes</p>
      </div>

      <div className="mensajes-content">
        <div className="mensajes-placeholder">
          <FaComments size={64} />
          <h2>Próximamente</h2>
          <p>La funcionalidad de mensajes y comunidad estará disponible pronto.</p>
          <div className="mensajes-features">
            <div className="feature-item">
              <FaEnvelope />
              <span>Mensajes directos con instructores</span>
            </div>
            <div className="feature-item">
              <FaUsers />
              <span>Foros de discusión por curso</span>
            </div>
            <div className="feature-item">
              <FaComments />
              <span>Chat en tiempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

