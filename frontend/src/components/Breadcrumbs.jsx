import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import './Breadcrumbs.css';

export default function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="breadcrumbs">
      <Link to="/inicio" className="breadcrumb-item">
        <FaHome /> Inicio
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator">
            <FaChevronRight />
          </span>
          {index === items.length - 1 ? (
            <span className="breadcrumb-item active">{item.label}</span>
          ) : (
            <Link to={item.path} className="breadcrumb-item">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

