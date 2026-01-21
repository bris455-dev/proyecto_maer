<?php

namespace App\Services;

use App\Models\Proyecto;
use App\Services\Proyectos\ProyectoHistorialService;
use App\Services\Proyectos\ProyectoDetalleService;
use App\Services\Proyectos\ProyectoTipificacionService;
use App\Services\Proyectos\ProyectoListService;
use App\Services\Proyectos\ProyectoBillingService;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;

class ProyectoService
{
    protected BitacoraService $bitacoraService;
    protected ProyectoHistorialService $historialService;
    protected ProyectoDetalleService $detalleService;
    protected ProyectoTipificacionService $tipificacionService;
    protected ProyectoListService $listService;
    protected ProyectoBillingService $billingService;

    public function __construct(
        BitacoraService $bitacoraService,
        ProyectoHistorialService $historialService,
        ProyectoDetalleService $detalleService,
        ProyectoTipificacionService $tipificacionService,
        ProyectoListService $listService,
        ProyectoBillingService $billingService
    ) {
        $this->bitacoraService = $bitacoraService;
        $this->historialService = $historialService;
        $this->detalleService = $detalleService;
        $this->tipificacionService = $tipificacionService;
        $this->listService = $listService;
        $this->billingService = $billingService;
    }

    /**
     * Crear proyecto con detalles
     */
    public function create(array $data, $actor, string $ip): array
    {
        Log::info("🔄 ProyectoService::create - Iniciando");
        DB::beginTransaction();
        try {
            $detalles = $data['detalles'] ?? [];
            Log::info("🔄 ProyectoService::create - Detalles a procesar: " . count($detalles));

            // Preparar datos para crear el proyecto
            $proyectoData = [
                'nombre' => $data['nombre'] ?? 'Proyecto sin nombre',
                'numero_proyecto' => $data['numero_proyecto'] ?? null,
                'clienteID' => $data['clienteID'] ?? null,
                'empleadoID' => $data['empleadoID'] ?? null,
                'fecha_inicio' => $data['fecha_inicio'] ?? null,
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'fecha_entrega' => $data['fecha_entrega'] ?? null,
                'notas' => $data['notas'] ?? null,
                'estado' => $data['estado'] ?? 1,
                'tipificacion' => $data['tipificacion'] ?? 'Pendiente',
                'total' => 0,
                'created_by' => $actor->id ?? null,
            ];
            
            Log::info("🔄 ProyectoService::create - Creando proyecto en BD");
            Log::info("🔄 Datos a insertar: " . json_encode($proyectoData));
            
            try {
                $proyecto = Proyecto::create($proyectoData);
                Log::info("🔄 Proyecto::create ejecutado. Resultado: " . ($proyecto ? "OK" : "NULL"));
            } catch (\Throwable $e) {
                Log::error("❌ Error en Proyecto::create: " . $e->getMessage());
                Log::error("❌ Stack trace: " . $e->getTraceAsString());
                throw $e;
            }
            
            if (!$proyecto) {
                Log::error("❌ Proyecto::create retornó NULL");
                throw new \Exception("No se pudo crear el proyecto en la base de datos - retornó NULL");
            }
            
            if (!isset($proyecto->proyectoID) || !$proyecto->proyectoID) {
                Log::error("❌ Proyecto creado pero proyectoID es null o vacío");
                Log::error("❌ Proyecto objeto: " . json_encode($proyecto->toArray()));
                throw new \Exception("No se pudo crear el proyecto - proyectoID no generado");
            }
            
            Log::info("✅ Proyecto creado. ProyectoID: {$proyecto->proyectoID}");

            // Insertar detalles y calcular precio
            $this->detalleService->crearDetalles($proyecto, $detalles);

            // Calcular total
            $proyecto->total = $this->detalleService->calculateTotalFromDetalles($proyecto);
            $proyecto->save();

            // Guardar nota inicial en historial si existe (sin archivos, se agregarán después)
            if (!empty($proyecto->notas)) {
                $this->historialService->crearNotaInicial($proyecto->proyectoID, $proyecto->notas, $actor);
            } elseif (isset($data['archivos_iniciales']) && !empty($data['archivos_iniciales'])) {
                // Si no hay notas pero hay archivos, crear historial vacío que se actualizará después
                $this->historialService->crearEntradaSoloArchivos(
                    $proyecto->proyectoID, 
                    [], 
                    $actor, 
                    'Archivos adjuntos al crear el proyecto'
                );
            }

            // Bitácora
            $this->bitacoraService->registrar(
                $actor,
                'Creación de proyecto',
                "Proyecto ID {$proyecto->proyectoID} creado para {$proyecto->nombre}.",
                $ip
            );

            DB::commit();
            Log::info("✅ ProyectoService::create - Transacción completada. ProyectoID: {$proyecto->proyectoID}");
            
            // Verificar que el proyecto realmente existe en la BD y cargar relaciones
            $proyectoVerificado = Proyecto::with(['empleado', 'cliente', 'detalles.tratamiento'])->find($proyecto->proyectoID);
            if (!$proyectoVerificado) {
                Log::error("❌ CRÍTICO: Proyecto creado pero no se encuentra en BD. ProyectoID: {$proyecto->proyectoID}");
                return [
                    'success' => false,
                    'message' => 'Error: El proyecto se creó pero no se pudo verificar en la base de datos'
                ];
            }
            
            Log::info("✅ ProyectoService::create - Proyecto verificado en BD. Retornando datos.");
            return ['success' => true, 'data' => $proyectoVerificado];
        } catch (\Throwable $e) {
            DB::rollBack();
            $errorMessage = $e->getMessage();
            Log::error("❌ Error ProyectoService@create: " . $errorMessage);
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("Payload recibido: " . json_encode($data));
            return [
                'success' => false, 
                'message' => env('APP_DEBUG') ? $errorMessage : 'Error al crear proyecto. Verifique los logs para más detalles.'
            ];
        }
    }


    /**
     * Actualizar proyecto con detalles
     */
    public function update(Proyecto $proyecto, array $data, $actor, string $ip): array
    {
        Log::info("🔄 ProyectoService::update - Iniciando. ProyectoID: {$proyecto->proyectoID}");
        DB::beginTransaction();
        try {
            // Validar permisos para cambiar tipificación según rol
            if (isset($data['tipificacion'])) {
                $validacion = $this->tipificacionService->validarCambioTipificacion($actor, $data['tipificacion']);
                if (!$validacion['success']) {
                    return $validacion;
                }
                
                if ($data['tipificacion'] === 'Atrasado') {
                    unset($data['tipificacion']);
                } else {
                    $proyecto->tipificacion = $data['tipificacion'];
                }
            }
            
            // Actualizar campos del proyecto
            foreach (['numero_proyecto','nombre','clienteID','empleadoID','fecha_inicio','fecha_fin','fecha_entrega','notas','estado'] as $f) {
                if (array_key_exists($f, $data)) {
                    $proyecto->{$f} = $data[$f];
                }
            }
            
            // Reemplazar detalles
            if (!empty($data['detalles'])) {
                $this->detalleService->reemplazarDetalles($proyecto, $data['detalles']);
            }

            // Guardar nueva nota en historial si se proporciona
            if (isset($data['nueva_nota']) && !empty(trim($data['nueva_nota']))) {
                $archivos = isset($data['archivos_nota']) && is_array($data['archivos_nota']) 
                    ? $data['archivos_nota'] 
                    : null;
                $this->historialService->agregarNota($proyecto->proyectoID, $data['nueva_nota'], $actor, $archivos);
            }

            // Recalcular total
            $proyecto->total = $this->detalleService->calculateTotalFromDetalles($proyecto);
            
            // Recalcular tipificación después de actualizar (por si cambió fecha_fin)
            if (!isset($data['tipificacion']) || $data['tipificacion'] === 'Atrasado') {
                $proyecto->tipificacion = $this->tipificacionService->calcularTipificacion($proyecto);
            }
            
            $proyecto->save();

            // Recargar el proyecto con relaciones para devolverlo
            $proyecto->load(['empleado', 'cliente', 'detalles.tratamiento']);

            $this->bitacoraService->registrar(
                $actor,
                'Actualización de proyecto',
                "Proyecto ID {$proyecto->proyectoID} actualizado.",
                $ip
            );

            DB::commit();
            return ['success' => true, 'data' => $proyecto];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("❌ Error ProyectoService@update: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return ['success' => false, 'message' => 'Error al actualizar proyecto.'];
        }
    }

    /**
     * Calcular tipificación del proyecto (método público para compatibilidad)
     */
    public function calcularTipificacion(Proyecto $proyecto): string
    {
        return $this->tipificacionService->calcularTipificacion($proyecto);
    }

    /**
     * Lista proyectos según rol (método público para compatibilidad)
     */
    public function listForUser($user, array $filters = [])
    {
        return $this->listService->listForUser($user, $filters);
    }

    /**
     * Resumen de facturación incluyendo comisión diseñador (35%) (método público para compatibilidad)
     */
    public function billingSummary(Proyecto $proyecto, $user)
    {
        return $this->billingService->billingSummary($proyecto, $user);
    }
}
