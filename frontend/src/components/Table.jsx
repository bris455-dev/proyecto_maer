import React from "react";

export default function Table({ columns, data, actions }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.field}>{col.label}</th>
          ))}
          {actions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => {
              const keys = col.field.split(".");
              let value = row;
              keys.forEach(k => (value = value ? value[k] : ""));
              return <td key={col.field}>{value}</td>;
            })}
            {actions && (
              <td>
                {actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => action.onClick(row)}
                    className={action.className}
                  >
                    {action.label}
                  </button>
                ))}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
