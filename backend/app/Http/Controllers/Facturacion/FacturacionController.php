<?php

namespace App\Http\Controllers\Facturacion;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\FacturacionService;
use App\Models\Facturacion;
use App\Models\Proyecto;
use Illuminate\Support\Facades\Log;

class FacturacionController extends Controller
{
    protected FacturacionService $service;

    public function __construct(FacturacionService $service)
    {
        $this->service = $service;
    }

    /**
     * Listar facturas según rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $filters = $request->only(['estado', 'fecha_desde', 'fecha_hasta', 'numero_factura', 'clienteID', 'empleadoID']);
            
            $facturas = $this->service->listForUser($user, $filters);

            return response()->json([
                'status' => 'success',
                'data' => $facturas
            ]);
        } catch (\Throwable $e) {
            Log::error("Error FacturacionController@index: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener facturas'
            ], 500);
        }
    }

    /**
     * Obtener factura por ID
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $factura = $this->service->getById($id, $user);

            if (!$factura) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Factura no encontrada o sin permisos'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $factura
            ]);
        } catch (\Throwable $e) {
            Log::error("Error FacturacionController@show: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener factura'
            ], 500);
        }
    }

    /**
     * Crear factura desde proyecto (individual o grupal)
     */
    public function store(Request $request)
    {
        try {
            // Determinar si es factura individual o grupal
            if ($request->has('proyectoIDs') && is_array($request->proyectoIDs) && count($request->proyectoIDs) > 1) {
                // Factura grupal
                $validated = $request->validate([
                    'proyectoIDs' => 'required|array|min:1',
                    'proyectoIDs.*' => 'required|integer|exists:proyecto,proyectoID',
                    'fecha_emision' => 'nullable|date',
                    'fecha_vencimiento' => 'nullable|date|after_or_equal:fecha_emision',
                    'impuesto' => 'nullable|numeric|min:0',
                    'descuento' => 'nullable|numeric|min:0',
                    'estado' => 'nullable|in:Pendiente,Emitida,Pagada,Cancelada',
                    'observaciones' => 'nullable|string|max:1000',
                ]);

                $user = $request->user();
                $result = $this->service->createFromProyectos($validated, $user, $request->ip());

                if (!$result['success']) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $result['message']
                    ], 400);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Factura grupal creada correctamente',
                    'data' => $result['data']
                ], 201);
            } else {
                // Factura individual
                $validated = $request->validate([
                    'proyectoID' => 'required|integer|exists:proyecto,proyectoID',
                    'fecha_emision' => 'nullable|date',
                    'fecha_vencimiento' => 'nullable|date|after_or_equal:fecha_emision',
                    'impuesto' => 'nullable|numeric|min:0',
                    'descuento' => 'nullable|numeric|min:0',
                    'estado' => 'nullable|in:Pendiente,Emitida,Pagada,Cancelada',
                    'observaciones' => 'nullable|string|max:1000',
                ]);

                $user = $request->user();
                $result = $this->service->createFromProyecto($validated, $user, $request->ip());

                if (!$result['success']) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $result['message']
                    ], 400);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Factura creada correctamente',
                    'data' => $result['data']
                ], 201);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error FacturacionController@store: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear factura'
            ], 500);
        }
    }

    /**
     * Actualizar estado de factura
     */
    public function updateEstado(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'estado' => 'required|in:Pendiente,Emitida,Pagada,Cancelada',
            ]);

            $user = $request->user();
            $result = $this->service->updateEstado($id, $validated['estado'], $user, $request->ip());

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Estado actualizado correctamente',
                'data' => $result['data']
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error FacturacionController@updateEstado: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar estado'
            ], 500);
        }
    }

    /**
     * Obtener proyectos disponibles para facturar (sin factura aún)
     * Filtrados por cliente y rango de fechas para facturación grupal
     */
    public function proyectosDisponibles(Request $request)
    {
        try {
            $user = $request->user();
            $query = Proyecto::with(['cliente', 'empleado', 'detalles.tratamiento']);

            // Filtrar según rol: administrador ve todo, otros solo sus proyectos
            if (!\App\Helpers\RoleHelper::isAdmin($user)) {
                if ($user->empleadoID) {
                    // Usuario con empleadoID: solo sus proyectos
                    $query->where('empleadoID', $user->empleadoID);
                } elseif ($user->clienteID) {
                    // Usuario con clienteID: solo sus proyectos
                    $query->where('clienteID', $user->clienteID);
                } else {
                    // Usuario sin empleadoID ni clienteID: sin proyectos
                    return response()->json([
                        'status' => 'success',
                        'data' => []
                    ]);
                }
            }

            // Filtros opcionales para facturación grupal
            if ($request->has('clienteID') && $request->clienteID) {
                $query->where('clienteID', $request->clienteID);
            }

            if ($request->has('fecha_desde') && $request->fecha_desde) {
                $query->whereDate('fecha_inicio', '>=', $request->fecha_desde);
            }

            if ($request->has('fecha_hasta') && $request->fecha_hasta) {
                $query->whereDate('fecha_inicio', '<=', $request->fecha_hasta);
            }

            // Obtener IDs de proyectos que ya tienen factura (individual o grupal)
            // Proyectos con factura individual (proyectoID no null)
            $proyectosConFacturaIndividual = Facturacion::whereNotNull('proyectoID')
                ->pluck('proyectoID')
                ->toArray();

            // Proyectos con factura grupal (en tabla facturacion_proyectos)
            $proyectosConFacturaGrupal = \DB::table('facturacion_proyectos')
                ->pluck('proyectoID')
                ->toArray();

            // Combinar ambos arrays
            $proyectosConFactura = array_unique(array_merge($proyectosConFacturaIndividual, $proyectosConFacturaGrupal));

            // Excluir proyectos que ya tienen factura
            if (!empty($proyectosConFactura)) {
                $query->whereNotIn('proyectoID', $proyectosConFactura);
            }

            $proyectos = $query->orderBy('proyectoID', 'desc')->get();

            return response()->json([
                'status' => 'success',
                'data' => $proyectos
            ]);
        } catch (\Throwable $e) {
            Log::error("Error FacturacionController@proyectosDisponibles: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener proyectos disponibles'
            ], 500);
        }
    }
}
