<?php

namespace App\Services;

use App\Models\Facturacion;
use App\Models\FacturacionDetalle;
use App\Models\FacturacionProyecto;
use App\Models\Proyecto;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class FacturacionService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Listar facturas según el rol del usuario
     */
    public function listForUser($user, array $filters = [])
    {
        try {
            $query = Facturacion::with(['proyecto.empleado', 'proyecto.cliente', 'cliente', 'detalles', 'proyectos.proyecto']);

            // Filtrar según rol: administrador ve todo, otros solo sus facturas
            if (!\App\Helpers\RoleHelper::isAdmin($user)) {
                if ($user->clienteID) {
                    // Usuario con clienteID: solo sus facturas
                    $query->where('clienteID', $user->clienteID);
                } else {
                    // Usuario sin clienteID: sin facturas
                    return collect([]);
                }
            }

            // Filtros opcionales
            if (!empty($filters['estado'])) {
                $query->where('estado', $filters['estado']);
            }

            if (!empty($filters['fecha_desde'])) {
                $query->where('fecha_emision', '>=', $filters['fecha_desde']);
            }

            if (!empty($filters['fecha_hasta'])) {
                $query->where('fecha_emision', '<=', $filters['fecha_hasta']);
            }

            if (!empty($filters['numero_factura'])) {
                $query->where('numero_factura', 'like', "%{$filters['numero_factura']}%");
            }

            // Filtro por cliente
            if (!empty($filters['clienteID'])) {
                $query->where('clienteID', $filters['clienteID']);
            }

            // Filtro por diseñador (a través del proyecto)
            if (!empty($filters['empleadoID'])) {
                $query->whereHas('proyecto', function($q) use ($filters) {
                    $q->where('empleadoID', $filters['empleadoID']);
                });
            }

            return $query->orderBy('fecha_emision', 'desc')->get();
        } catch (\Throwable $e) {
            Log::error("Error FacturacionService@listForUser: " . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Crear factura desde un proyecto (factura individual)
     */
    public function createFromProyecto(array $data, $actor, string $ip): array
    {
        DB::beginTransaction();
        try {
            $proyecto = Proyecto::with('detalles.tratamiento', 'cliente', 'empleado')->find($data['proyectoID']);
            
            if (!$proyecto) {
                return [
                    'success' => false,
                    'message' => 'Proyecto no encontrado'
                ];
            }

            // Verificar si ya existe una factura para este proyecto (individual o grupal)
            $facturaExistente = Facturacion::where('proyectoID', $proyecto->proyectoID)->first();
            if ($facturaExistente) {
                return [
                    'success' => false,
                    'message' => 'Ya existe una factura individual para este proyecto',
                    'facturaID' => $facturaExistente->facturacionID
                ];
            }

            // Verificar si el proyecto está en alguna factura grupal
            $facturaGrupalExistente = FacturacionProyecto::where('proyectoID', $proyecto->proyectoID)->first();
            if ($facturaGrupalExistente) {
                return [
                    'success' => false,
                    'message' => 'Este proyecto ya está incluido en una factura grupal',
                    'facturaID' => $facturaGrupalExistente->facturacionID
                ];
            }

            // Generar número de factura único
            $numeroFactura = $this->generarNumeroFactura();

            // Calcular totales desde los detalles del proyecto
            $subtotal = $proyecto->total ?? 0;
            // Si no se proporciona impuesto, calcular como 18% del subtotal (IGV)
            $impuesto = isset($data['impuesto']) ? $data['impuesto'] : ($subtotal * 0.18);
            $descuento = $data['descuento'] ?? 0;
            $total = $subtotal + $impuesto - $descuento;

            // Crear factura individual
            $facturacion = Facturacion::create([
                'proyectoID' => $proyecto->proyectoID,
                'clienteID' => $proyecto->clienteID,
                'tipo' => 'Individual',
                'numero_factura' => $numeroFactura,
                'fecha_emision' => $data['fecha_emision'] ?? now()->toDateString(),
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => $data['estado'] ?? 'Pendiente',
                'observaciones' => $data['observaciones'] ?? null,
                'created_by' => $actor->id,
            ]);

            // Crear detalles desde los detalles del proyecto
            foreach ($proyecto->detalles as $detalle) {
                $tratamientoNombre = $detalle->tratamiento ? $detalle->tratamiento->nombre : 'Tratamiento';
                $pieza = $detalle->pieza ?? 'Pieza';
                $descripcion = "{$pieza} - {$tratamientoNombre}";
                
                FacturacionDetalle::create([
                    'facturacionID' => $facturacion->facturacionID,
                    'descripcion' => $descripcion,
                    'cantidad' => 1,
                    'precio_unitario' => $detalle->precio,
                    'subtotal' => $detalle->precio,
                ]);
            }

            // Bitácora
            $this->bitacoraService->registrar(
                $actor,
                'Creación de factura',
                "Factura {$numeroFactura} creada para proyecto {$proyecto->proyectoID}.",
                $ip
            );

            DB::commit();

            return [
                'success' => true,
                'data' => $facturacion->load(['proyecto.empleado', 'proyecto.cliente', 'cliente', 'detalles'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error FacturacionService@createFromProyecto: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear factura: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Crear factura grupal desde múltiples proyectos
     */
    public function createFromProyectos(array $data, $actor, string $ip): array
    {
        DB::beginTransaction();
        try {
            $proyectoIDs = $data['proyectoIDs'] ?? [];
            
            if (empty($proyectoIDs) || !is_array($proyectoIDs)) {
                return [
                    'success' => false,
                    'message' => 'Debe seleccionar al menos un proyecto'
                ];
            }

            // Cargar todos los proyectos
            $proyectos = Proyecto::with('detalles.tratamiento', 'cliente', 'empleado')
                ->whereIn('proyectoID', $proyectoIDs)
                ->get();

            if ($proyectos->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No se encontraron los proyectos seleccionados'
                ];
            }

            // Verificar que todos los proyectos pertenezcan al mismo cliente
            $clienteIDs = $proyectos->pluck('clienteID')->unique()->toArray();
            if (count($clienteIDs) > 1) {
                return [
                    'success' => false,
                    'message' => 'Todos los proyectos deben pertenecer al mismo cliente'
                ];
            }
            $clienteID = $clienteIDs[0];

            // Verificar que ningún proyecto ya tenga factura
            foreach ($proyectos as $proyecto) {
                $facturaExistente = Facturacion::where('proyectoID', $proyecto->proyectoID)->first();
                if ($facturaExistente) {
                    return [
                        'success' => false,
                        'message' => "El proyecto #{$proyecto->proyectoID} ya tiene una factura individual"
                    ];
                }

                $facturaGrupalExistente = FacturacionProyecto::where('proyectoID', $proyecto->proyectoID)->first();
                if ($facturaGrupalExistente) {
                    return [
                        'success' => false,
                        'message' => "El proyecto #{$proyecto->proyectoID} ya está incluido en una factura grupal"
                    ];
                }
            }

            // Generar número de factura único
            $numeroFactura = $this->generarNumeroFactura();

            // Calcular totales consolidados
            $subtotal = $proyectos->sum('total');
            $impuesto = isset($data['impuesto']) ? $data['impuesto'] : ($subtotal * 0.18);
            $descuento = $data['descuento'] ?? 0;
            $total = $subtotal + $impuesto - $descuento;

            // Crear factura grupal (proyectoID es null)
            $facturacion = Facturacion::create([
                'proyectoID' => null, // Null para facturas grupales
                'clienteID' => $clienteID,
                'tipo' => 'Grupal',
                'numero_factura' => $numeroFactura,
                'fecha_emision' => $data['fecha_emision'] ?? now()->toDateString(),
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => $data['estado'] ?? 'Pendiente',
                'observaciones' => $data['observaciones'] ?? "Factura grupal para " . count($proyectoIDs) . " proyecto(s)",
                'created_by' => $actor->id,
            ]);

            // Crear relaciones con proyectos y detalles agrupados por proyecto y precio
            foreach ($proyectos as $proyecto) {
                FacturacionProyecto::create([
                    'facturacionID' => $facturacion->facturacionID,
                    'proyectoID' => $proyecto->proyectoID,
                ]);

                // Agrupar detalles por precio unitario
                // Estructura: [precio => [tratamientos => [], piezas => []]]
                $agrupacionPorPrecio = [];
                
                foreach ($proyecto->detalles as $detalle) {
                    // Usar el ID del tratamiento en lugar del nombre
                    $tratamientoID = $detalle->tratamientoID ?? null;
                    $pieza = $detalle->pieza ?? 'Pieza';
                    $precio = floatval($detalle->precio);
                    
                    // Inicializar grupo de precio si no existe
                    if (!isset($agrupacionPorPrecio[$precio])) {
                        $agrupacionPorPrecio[$precio] = [
                            'tratamientos' => [],
                            'piezas' => [],
                            'cantidad' => 0,
                            'subtotal' => 0
                        ];
                    }
                    
                    // Agregar tratamientoID único (número)
                    if ($tratamientoID && !in_array($tratamientoID, $agrupacionPorPrecio[$precio]['tratamientos'])) {
                        $agrupacionPorPrecio[$precio]['tratamientos'][] = $tratamientoID;
                    }
                    
                    // Agregar pieza única
                    if (!in_array($pieza, $agrupacionPorPrecio[$precio]['piezas'])) {
                        $agrupacionPorPrecio[$precio]['piezas'][] = $pieza;
                    }
                    
                    $agrupacionPorPrecio[$precio]['cantidad']++;
                    $agrupacionPorPrecio[$precio]['subtotal'] += $precio;
                }

                // Crear un detalle por cada grupo de precio
                foreach ($agrupacionPorPrecio as $precioUnitario => $grupo) {
                    // Ordenar tratamientos por ID y concatenar
                    sort($grupo['tratamientos']);
                    $tratamientosConcatenados = implode(', ', $grupo['tratamientos']);
                    
                    // Crear descripción: "Proyecto #X - Tratamientos"
                    $descripcion = "Proyecto #{$proyecto->proyectoID} - {$tratamientosConcatenados}";
                    
                    FacturacionDetalle::create([
                        'facturacionID' => $facturacion->facturacionID,
                        'descripcion' => $descripcion,
                        'cantidad' => count($grupo['piezas']), // Cantidad de piezas únicas con este precio
                        'precio_unitario' => $precioUnitario,
                        'subtotal' => $grupo['subtotal'],
                    ]);
                }
            }

            // Bitácora
            $this->bitacoraService->registrar(
                $actor,
                'Creación de factura grupal',
                "Factura grupal {$numeroFactura} creada para " . count($proyectoIDs) . " proyecto(s).",
                $ip
            );

            DB::commit();

            return [
                'success' => true,
                'data' => $facturacion->load(['cliente', 'detalles', 'proyectos.proyecto.empleado', 'proyectos.proyecto.cliente'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error FacturacionService@createFromProyectos: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear factura grupal: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar estado de factura
     */
    public function updateEstado(int $facturacionID, string $nuevoEstado, $actor, string $ip): array
    {
        DB::beginTransaction();
        try {
            $facturacion = Facturacion::find($facturacionID);
            
            if (!$facturacion) {
                return [
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ];
            }

            $facturacion->estado = $nuevoEstado;
            $facturacion->save();

            // Bitácora
            $this->bitacoraService->registrar(
                $actor,
                'Actualización de estado de factura',
                "Estado de factura {$facturacion->numero_factura} cambiado a '{$nuevoEstado}'.",
                $ip
            );

            DB::commit();

            return [
                'success' => true,
                'data' => $facturacion
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error FacturacionService@updateEstado: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar estado de factura: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener factura por ID
     */
    public function getById(int $facturacionID, $user)
    {
        try {
            $facturacion = Facturacion::with(['proyecto.empleado', 'proyecto.cliente', 'cliente', 'detalles', 'creador', 'proyectos.proyecto.empleado', 'proyectos.proyecto.cliente'])
                ->find($facturacionID);

            if (!$facturacion) {
                return null;
            }

            // Verificar permisos: usuarios no admin solo ven sus propias facturas
            if (!\App\Helpers\RoleHelper::isAdmin($user)) {
                if ($user->clienteID && $facturacion->clienteID != $user->clienteID) {
                    return null; // Cliente solo puede ver sus propias facturas
                }
            }

            return $facturacion;
        } catch (\Throwable $e) {
            Log::error("Error FacturacionService@getById: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generar número de factura único
     */
    private function generarNumeroFactura(): string
    {
        $year = date('Y');
        $lastFactura = Facturacion::where('numero_factura', 'like', "FAC-{$year}-%")
            ->orderBy('facturacionID', 'desc')
            ->first();

        if ($lastFactura) {
            $lastNumber = (int) substr($lastFactura->numero_factura, -6);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "FAC-{$year}-" . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }
}
