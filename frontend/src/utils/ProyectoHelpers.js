export const getClienteId = (cliente) =>
  cliente?.id ??
  cliente?.clienteID ??
  cliente?.clienteId ??
  cliente?.cliente_id ??
  cliente?.ID ??
  null;

export const getEmpleadoId = (empleado) =>
  empleado?.empleadoID ??
  empleado?.empleadoId ??
  empleado?.empleado_id ??
  empleado?.id ??
  null;

export const getClienteNombre = (cliente) =>
  cliente?.nombre ||
  cliente?.razon_social ||
  cliente?.empresa ||
  "Cliente sin nombre";

export const getEmpleadoNombre = (empleado) =>
  empleado?.nombre ||
  `${empleado?.nombres || ""} ${empleado?.apellidos || ""}`.trim() ||
  empleado?.email ||
  "Sin nombre";
