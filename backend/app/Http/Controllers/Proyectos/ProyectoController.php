<?php

namespace App\Http\Controllers\Proyectos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Requests\Proyectos\StoreProyectoRequest;
use App\Requests\Proyectos\UpdateProyectoRequest;
use App\Services\ProyectoService;
use App\Services\Proyectos\ProyectoFileService;
use App\Services\Proyectos\ProyectoImageService;
use App\Services\Proyectos\ProyectoHistorialService;
use App\Models\Proyecto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProyectoController extends Controller
{
    protected ProyectoService $service;
    protected ProyectoFileService $fileService;
    protected ProyectoImageService $imageService;
    protected ProyectoHistorialService $historialService;

    public function __construct(
        ProyectoService $service,
        ProyectoFileService $fileService,
        ProyectoImageService $imageService,
        ProyectoHistorialService $historialService
    ) {
        $this->service = $service;
        $this->fileService = $fileService;
        $this->imageService = $imageService;
        $this->historialService = $historialService;
    }

    // Listar proyectos según rol
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['status'=>'error','message'=>'Usuario no autenticado'], 401);
            }

            $filters = ['q' => $request->query('q') ?? null];
            $lista = $this->service->listForUser($user, $filters);

            // Registrar en bitácora solo si hay usuario
            try {
                app()->make(\App\Services\BitacoraService::class)
                    ->registrar($user, 'Listado de proyectos', 'Listado consultado', $request->ip());
            } catch (\Throwable $e) {
                Log::warning("Error en bitácora (index proyectos): " . $e->getMessage());
            }

            return response()->json(['status' => 'success', 'data' => $lista]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@index: " . $e->getMessage() . " - " . $e->getTraceAsString());
            return response()->json(['status'=>'error','message'=>'Error al listar proyectos: ' . (env('APP_DEBUG') ? $e->getMessage() : 'Error interno')], 500);
        }
    }

    // Mostrar proyecto con imágenes e historial
    public function show(Request $request, $id)
    {
        try {
            $proyecto = $this->cargarProyectoCompleto($id);
            
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }
            
            Log::info("📋 ProyectoController@show - Devolviendo proyecto. notas: " . ($proyecto->notas ?? 'NULL') . ", images count: " . (is_array($proyecto->images) ? count($proyecto->images) : 'NO ARRAY') . ", historial count: " . (is_array($proyecto->historial) ? count($proyecto->historial) : 'NO ARRAY'));

            return response()->json(['status'=>'success','data'=>$proyecto]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@show: " . $e->getMessage() . " - " . $e->getTraceAsString());
            return response()->json([
                'status'=>'error',
                'message'=>'Error al mostrar proyecto: ' . (env('APP_DEBUG') ? $e->getMessage() : 'Error interno')
            ], 500);
        }
    }

    // Crear proyecto
    public function store(StoreProyectoRequest $request)
    {
        // Log inmediato al entrar al método
        Log::info("🚀🚀🚀 ProyectoController@store - MÉTODO LLAMADO");
        Log::info("📥 Request method: " . $request->method());
        Log::info("📥 Content-Type: " . $request->header('Content-Type'));
        Log::info("📥 Request URI: " . $request->getRequestUri());
        Log::info("📥 Request all: " . json_encode($request->all()));
        Log::info("📥 User: " . ($request->user() ? $request->user()->id : 'NO AUTENTICADO'));
        
        try {
            
            // Manejar FormData si viene con archivos
            $validated = [];
            if ($request->has('data') && is_string($request->input('data'))) {
                // Si viene data como JSON string (desde FormData)
                $data = json_decode($request->input('data'), true);
                if (is_array($data)) {
                    $validated = $data;
                }
                Log::info("📦 Proyecto recibido con FormData. Archivos presentes: " . ($request->hasFile('images') ? 'Sí' : 'No'));
                Log::info("📦 Datos validados (keys): " . json_encode(array_keys($validated)));
            } else {
                // Si viene como JSON normal
                try {
                    $validated = $request->validated();
                    Log::info("📦 Proyecto recibido como JSON. Archivos presentes: " . ($request->hasFile('images') ? 'Sí' : 'No'));
                    Log::info("📦 Datos validados (keys): " . json_encode(array_keys($validated)));
                } catch (\Illuminate\Validation\ValidationException $e) {
                    Log::error("❌ Error de validación: " . json_encode($e->errors()));
                    return response()->json([
                        'status'=>'error',
                        'message'=>'Error de validación',
                        'errors'=>$e->errors()
                    ], 422);
                }
            }
            
            Log::info("📦 Datos del proyecto a crear: nombre=" . ($validated['nombre'] ?? 'NO EXISTE') . ", detalles=" . (isset($validated['detalles']) ? count($validated['detalles']) : 0));
            
            // Debug: verificar archivos
            if ($request->hasFile('images')) {
                $files = $request->file('images');
                if (!is_array($files)) {
                    $files = [$files];
                }
                Log::info("Archivos recibidos en store: " . count($files));
                foreach ($files as $idx => $file) {
                    if ($file) {
                        Log::info("Archivo {$idx}: {$file->getClientOriginalName()} ({$file->getSize()} bytes, tipo: {$file->getMimeType()})");
                    }
                }
            } else {
                Log::warning("No se detectaron archivos en la petición");
            }
            
            $actor = $request->user();
            
            if (!$actor) {
                return response()->json(['status'=>'error','message'=>'Usuario no autenticado'], 401);
            }

            // Validar que empleadoID y clienteID existan si se proporcionan
            if (isset($validated['empleadoID']) && $validated['empleadoID']) {
                $empleadoExiste = \App\Models\Empleado::where('empleadoID', $validated['empleadoID'])->exists();
                if (!$empleadoExiste) {
                    return response()->json([
                        'status'=>'error',
                        'message'=>'El diseñador seleccionado no existe en la base de datos.'
                    ], 400);
                }
            }

            if (isset($validated['clienteID']) && $validated['clienteID']) {
                $clienteExiste = \App\Models\Cliente::where('clienteID', $validated['clienteID'])->exists();
                if (!$clienteExiste) {
                    return response()->json([
                        'status'=>'error',
                        'message'=>'El cliente seleccionado no existe en la base de datos.'
                    ], 400);
                }
            }

            // Validar que los tratamientos existan
            if (isset($validated['detalles']) && is_array($validated['detalles'])) {
                foreach ($validated['detalles'] as $detalle) {
                    if (isset($detalle['tratamientoID'])) {
                        $tratamientoExiste = \App\Models\Tratamiento::where('tratamientoID', $detalle['tratamientoID'])->exists();
                        if (!$tratamientoExiste) {
                            return response()->json([
                                'status'=>'error',
                                'message'=>"El tratamiento ID {$detalle['tratamientoID']} no existe en la base de datos para la pieza {$detalle['pieza']}."
                            ], 400);
                        }
                    }
                }
            }

            // Obtener archivos de la petición y guardarlos temporalmente
            $files = $this->obtenerArchivosDeRequest($request);
            $archivosRutas = [];
            
            if ($files) {
                $archivosRutas = $this->fileService->guardarTemporalmente($files);
                if (!empty($archivosRutas)) {
                    $validated['archivos_iniciales'] = $archivosRutas;
                }
            }
            
            Log::info("🔄 Llamando a ProyectoService::create con datos: " . json_encode($validated));
            Log::info("🔄 Actor ID: " . ($actor->id ?? 'NO EXISTE'));
            Log::info("🔄 Actor nombre: " . ($actor->nombre ?? $actor->email ?? 'NO EXISTE'));
            
            $result = $this->service->create($validated, $actor, $request->ip());
            
            Log::info("🔄 Resultado de ProyectoService::create recibido");
            Log::info("🔄 Resultado keys: " . json_encode(array_keys($result)));
            Log::info("🔄 Resultado success: " . (isset($result['success']) ? ($result['success'] ? 'true' : 'false') : 'NO EXISTE'));
            
            if (!isset($result['success']) || !$result['success']) {
                $errorMsg = $result['message'] ?? 'Error desconocido al crear proyecto';
                Log::error("❌ Error al crear proyecto: " . $errorMsg);
                Log::error("❌ Resultado completo: " . json_encode($result));
                return response()->json([
                    'status'=>'error',
                    'message'=>$errorMsg
                ], 400);
            }
            
            if (!isset($result['data']) || !$result['data']) {
                Log::error("❌ ProyectoService::create retornó success=true pero data es null o vacío");
                Log::error("❌ Resultado completo: " . json_encode($result));
                return response()->json([
                    'status'=>'error',
                    'message'=>'Error: El proyecto se creó pero no se pudo recuperar'
                ], 500);
            }
            
            $proyectoCreado = $result['data'];
            Log::info("✅ Proyecto creado exitosamente. ProyectoID: " . ($proyectoCreado->proyectoID ?? 'NO EXISTE'));
            Log::info("✅ Proyecto creado - Nombre: " . ($proyectoCreado->nombre ?? 'NO EXISTE'));
            Log::info("✅ Proyecto creado - ClienteID: " . ($proyectoCreado->clienteID ?? 'NO EXISTE'));
            Log::info("✅ Proyecto creado - EmpleadoID: " . ($proyectoCreado->empleadoID ?? 'NO EXISTE'));
            
            // Procesar archivos temporales después de crear el proyecto
            if (!empty($archivosRutas) && $proyectoCreado) {
                $this->procesarArchivosDespuesDeCrear($proyectoCreado, $archivosRutas, $actor);
            }
            
            // Recargar el proyecto completo con historial e imágenes para devolverlo
            $proyectoCompleto = $this->cargarProyectoCompleto($proyectoCreado->proyectoID);
            
            if ($proyectoCompleto) {
                Log::info("✅ Proyecto creado - Historial: " . count($proyectoCompleto->historial) . " registros, Imágenes: " . count($proyectoCompleto->imagenes));
                return response()->json(['status'=>'success','data'=>$proyectoCompleto], 201);
            }

            return response()->json(['status'=>'success','data'=>$proyectoCreado], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("Error de validación al crear proyecto: " . json_encode($e->errors()));
            return response()->json([
                'status'=>'error',
                'message'=>'Error de validación',
                'errors'=>$e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@store: " . $e->getMessage() . " - " . $e->getTraceAsString());
            return response()->json([
                'status'=>'error',
                'message'=>'Error al crear proyecto: ' . (env('APP_DEBUG') ? $e->getMessage() : 'Error interno')
            ], 500);
        }
    }

    // Actualizar proyecto
    public function update(UpdateProyectoRequest $request, $id)
    {
        Log::info("🔄🔄🔄 ProyectoController@update - MÉTODO LLAMADO para proyecto ID: {$id}");
        Log::info("📥 Request method: " . $request->method());
        Log::info("📥 Content-Type: " . $request->header('Content-Type'));
        Log::info("📥 Request URI: " . $request->getRequestUri());
        
        try {
            $proyecto = Proyecto::find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $user = $request->user();
            if (!$this->checkPermission($user, $proyecto)) {
                return response()->json(['status'=>'error','message'=>'Sin permiso'], 403);
            }
            
            // Debug: verificar archivos ANTES de procesar
            Log::info("📁 Verificando archivos en request ANTES de procesar");
            Log::info("📁 hasFile('images'): " . ($request->hasFile('images') ? 'true' : 'false'));
            if ($request->hasFile('images')) {
                $testFiles = $request->file('images');
                if (!is_array($testFiles)) {
                    $testFiles = [$testFiles];
                }
                Log::info("📁 Archivos detectados con hasFile('images'): " . count($testFiles));
                foreach ($testFiles as $idx => $file) {
                    if ($file) {
                        Log::info("📁 Archivo {$idx}: {$file->getClientOriginalName()} ({$file->getSize()} bytes)");
                    }
                }
            }

            // Manejar FormData si viene con archivos
            $validated = [];
            if ($request->has('data') && is_string($request->input('data'))) {
                // Si viene data como JSON string (desde FormData)
                $data = json_decode($request->input('data'), true);
                if (is_array($data)) {
                    $validated = $data;
                }
                Log::info("📝 Update - Datos recibidos desde FormData. nueva_nota: " . ($validated['nueva_nota'] ?? 'NO EXISTE'));
            } else {
                // Si viene como JSON normal
                $validated = $request->validated();
                Log::info("📝 Update - Datos recibidos desde JSON. nueva_nota: " . ($validated['nueva_nota'] ?? 'NO EXISTE'));
            }
            
            Log::info("📝 Update - Validated completo: " . json_encode($validated));
            
            // Procesar archivos si hay - VERIFICAR ANTES DE LLAMAR A obtenerArchivosDeRequest
            Log::info("📝 Update - Verificando archivos en request...");
            Log::info("📝 Update - hasFile('images'): " . ($request->hasFile('images') ? 'SÍ' : 'NO'));
            Log::info("📝 Update - allFiles keys: " . json_encode(array_keys($request->allFiles())));
            
            // Procesar archivos si hay
            $files = $this->obtenerArchivosDeRequest($request);
            $archivosRutas = [];
            
            Log::info("📝 Update - Archivos detectados por obtenerArchivosDeRequest: " . ($files ? (is_array($files) ? count($files) : 1) : 0));
            
            if ($files) {
                // Normalizar $files a array si no lo es
                if (!is_array($files)) {
                    $files = [$files];
                }
                
                // Filtrar valores null y archivos inválidos
                $files = array_filter($files, function($f) { 
                    return $f !== null && $f->isValid(); 
                });
                
                Log::info("📝 Update - Archivos válidos después de filtrar: " . count($files));
                
                if (!empty($files)) {
                    Log::info("📝 Update - Llamando a guardarArchivosEnProyecto con " . count($files) . " archivos");
                    $archivosRutas = $this->fileService->guardarArchivosEnProyecto($proyecto->proyectoID, $files);
                    Log::info("📝 Update - Archivos guardados: " . count($archivosRutas) . " archivos. Rutas: " . json_encode($archivosRutas));
                    
                    if (!empty($archivosRutas)) {
                        $this->imageService->registrarImagenes($proyecto->proyectoID, $archivosRutas);
                        Log::info("📝 Update - Archivos registrados en proyecto_imagenes");
                    } else {
                        Log::warning("⚠️ guardarArchivosEnProyecto retornó array vacío");
                    }
                } else {
                    Log::warning("⚠️ No hay archivos válidos después de filtrar");
                }
            } else {
                Log::warning("⚠️ obtenerArchivosDeRequest retornó null o vacío");
            }
            
            // Agregar archivos al validated si hay
            if (!empty($archivosRutas)) {
                if (isset($validated['nueva_nota']) && !empty(trim($validated['nueva_nota']))) {
                    $validated['archivos_nota'] = $archivosRutas;
                    Log::info("✅ Archivos asociados a nueva nota: " . count($archivosRutas) . " archivos");
                } else {
                    Log::info("✅ Creando entrada solo con archivos (sin nota): " . count($archivosRutas) . " archivos");
                    $resultado = $this->historialService->crearEntradaSoloArchivos($proyecto->proyectoID, $archivosRutas, $user);
                    if ($resultado) {
                        Log::info("✅ Entrada de historial creada exitosamente. ID: {$resultado}");
                    } else {
                        Log::error("❌ No se pudo crear entrada de historial con archivos");
                    }
                }
            } else {
                Log::info("⚠️ No hay archivos para procesar");
            }
            
            $result = $this->service->update($proyecto, $validated, $user, $request->ip());

            if (!$result['success']) {
                return response()->json(['status'=>'error','message'=>$result['message']], 400);
            }

            // Recargar el proyecto completo con historial e imágenes actualizados
            $proyectoCompleto = $this->cargarProyectoCompleto($proyecto->proyectoID);
            
            if ($proyectoCompleto) {
                return response()->json(['status'=>'success','data'=>$proyectoCompleto]);
            }

            return response()->json(['status'=>'success','data'=>$result['data']]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@update: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al actualizar proyecto'], 500);
        }
    }


    // Permisos según rol
    private function checkPermission($user, Proyecto $proyecto): bool
    {
        // Administrador tiene acceso a todo
        if (\App\Helpers\RoleHelper::isAdmin($user)) {
            return true;
        }
        
        // Diseñador: solo sus proyectos (empleadoID)
        if ($user->empleadoID && $proyecto->empleadoID == $user->empleadoID) {
            return true;
        }
        
        // Cliente: solo sus proyectos (clienteID)
        if ($user->clienteID && $proyecto->clienteID == $user->clienteID) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtener archivos de la petición
     */
    private function obtenerArchivosDeRequest($request)
    {
        Log::info("📁 obtenerArchivosDeRequest - Verificando archivos en request");
        Log::info("📁 Content-Type: " . $request->header('Content-Type'));
        
        // Laravel agrupa automáticamente images[] en un array cuando se envía como FormData
        // Primero intentar con hasFile que detecta arrays automáticamente
        if ($request->hasFile('images')) {
            $files = $request->file('images');
            Log::info("📁 hasFile('images') retornó: " . (is_array($files) ? 'array con ' . count($files) . ' elementos' : 'objeto único'));
            
            // Si es un solo archivo, convertirlo a array
            if (!is_array($files)) {
                $files = [$files];
            }
            
            // Filtrar archivos válidos
            $files = array_filter($files, function($f) { 
                if ($f === null) return false;
                if (!method_exists($f, 'isValid')) return false;
                return $f->isValid(); 
            });
            
            Log::info("📁 Archivos válidos encontrados en 'images': " . count($files));
            if (!empty($files)) {
                foreach ($files as $idx => $file) {
                    Log::info("📁 Archivo {$idx}: {$file->getClientOriginalName()} ({$file->getSize()} bytes)");
                }
                return array_values($files);
            }
        }
        
        // Intentar con hasFile para el primer elemento del array (Laravel puede indexarlos así)
        if ($request->hasFile('images.0')) {
            $files = [];
            $index = 0;
            while ($request->hasFile("images.{$index}")) {
                $file = $request->file("images.{$index}");
                if ($file && $file->isValid()) {
                    $files[] = $file;
                    Log::info("📁 Archivo encontrado en images.{$index}: {$file->getClientOriginalName()}");
                }
                $index++;
            }
            if (!empty($files)) {
                Log::info("📁 Archivos encontrados en 'images.0' hasta 'images." . ($index - 1) . "': " . count($files));
                return $files;
            }
        }
        
        // Si no se detectó con hasFile, intentar con allFiles
        $allFiles = $request->allFiles();
        Log::info("📁 allFiles keys: " . json_encode(array_keys($allFiles)));
        Log::info("📁 allFiles completo: " . json_encode(array_map(function($f) {
            if (is_object($f) && method_exists($f, 'getClientOriginalName')) {
                return $f->getClientOriginalName();
            }
            return gettype($f);
        }, $allFiles)));
        
        if (isset($allFiles['images']) && !empty($allFiles['images'])) {
            $files = is_array($allFiles['images']) ? $allFiles['images'] : [$allFiles['images']];
            $files = array_filter($files, function($f) { 
                if ($f === null) return false;
                if (!method_exists($f, 'isValid')) return true; // Si no tiene isValid, asumir válido
                return $f->isValid(); 
            });
            if (!empty($files)) {
                Log::info("📁 Archivos encontrados en allFiles['images']: " . count($files));
                return array_values($files);
            }
        }
        
        // Intentar con diferentes variaciones del nombre
        foreach (['images[]', 'images[0]', 'files', 'files[]'] as $key) {
            if (isset($allFiles[$key]) && !empty($allFiles[$key])) {
                $files = is_array($allFiles[$key]) ? $allFiles[$key] : [$allFiles[$key]];
                $files = array_filter($files, function($f) { 
                    if ($f === null) return false;
                    if (!method_exists($f, 'isValid')) return true;
                    return $f->isValid(); 
                });
                if (!empty($files)) {
                    Log::info("📁 Archivos encontrados en allFiles['{$key}']: " . count($files));
                    return array_values($files);
                }
            }
        }
        
        Log::warning("⚠️ No se encontraron archivos válidos en la request");
        Log::warning("⚠️ Request all: " . json_encode($request->all()));
        return null;
    }
    
    /**
     * Procesar archivos después de crear el proyecto
     */
    private function procesarArchivosDespuesDeCrear($proyecto, array $archivosTemporales, $actor): void
    {
        try {
            Log::info("📁 Procesando " . count($archivosTemporales) . " archivos temporales para proyecto {$proyecto->proyectoID}");
            
            // Mover archivos a la carpeta del proyecto
            $archivosFinales = $this->fileService->moverArchivosAlProyecto($proyecto->proyectoID, $archivosTemporales);
            
            if (empty($archivosFinales)) {
                Log::warning("⚠️ No hay archivos finales para guardar");
                return;
            }
            
            // Registrar en proyecto_imagenes
            $this->imageService->registrarImagenes($proyecto->proyectoID, $archivosFinales);
            
            // Actualizar o crear historial con archivos
            $actualizado = $this->historialService->actualizarUltimaEntradaConArchivos($proyecto->proyectoID, $archivosFinales);
            
            if (!$actualizado) {
                // Si no se pudo actualizar, crear nueva entrada
                if (!empty($proyecto->notas)) {
                    $this->historialService->crearNotaInicial($proyecto->proyectoID, $proyecto->notas, $actor, $archivosFinales);
                } else {
                    $this->historialService->crearEntradaSoloArchivos($proyecto->proyectoID, $archivosFinales, $actor);
                }
            }
        } catch (\Throwable $e) {
            Log::error("❌ Error procesando archivos después de crear: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
        }
    }
    
    /**
     * Cargar proyecto completo con historial e imágenes
     */
    private function cargarProyectoCompleto($proyectoID): ?Proyecto
    {
        try {
            $proyecto = Proyecto::with(['detalles.tratamiento', 'empleado', 'cliente'])->find($proyectoID);
            if (!$proyecto) {
                return null;
            }
            
            // Calcular tipificación
            $proyecto->tipificacion = $this->service->calcularTipificacion($proyecto);
            
            // Obtener historial
            $proyecto->historial = $this->historialService->obtenerHistorial($proyecto->proyectoID);
            
            // Obtener imágenes
            $proyecto->imagenes = $this->imageService->obtenerImagenes($proyecto->proyectoID);
            $proyecto->imagenes = $this->imageService->agregarImagenesDelHistorial($proyecto->historial, $proyecto->imagenes);
            
            // Asegurar que notas e images se devuelvan correctamente
            if ($proyecto->images === null) {
                $proyecto->images = [];
            } elseif (is_string($proyecto->images)) {
                try {
                    $decoded = json_decode($proyecto->images, true);
                    $proyecto->images = is_array($decoded) ? $decoded : [];
                } catch (\Throwable $e) {
                    $proyecto->images = [];
                }
            }
            
            if ($proyecto->notas === null) {
                $proyecto->notas = '';
            }
            
            // Si hay notas en la tabla proyecto, asegurarse de que estén en el historial
            if (!empty($proyecto->notas)) {
                $notaExisteEnHistorial = false;
                foreach ($proyecto->historial as $item) {
                    if (isset($item['nota']) && trim($item['nota']) === trim($proyecto->notas)) {
                        $notaExisteEnHistorial = true;
                        break;
                    }
                }
                
                if (!$notaExisteEnHistorial && !empty($proyecto->historial)) {
                    array_unshift($proyecto->historial, [
                        'id' => 0,
                        'proyectoID' => $proyecto->proyectoID,
                        'userID' => $proyecto->created_by ?? null,
                        'usuario_nombre' => 'Sistema',
                        'nota' => $proyecto->notas,
                        'archivos' => [],
                        'created_at' => $proyecto->fecha_inicio ? date('Y-m-d H:i:s', strtotime($proyecto->fecha_inicio)) : now()->toDateTimeString()
                    ]);
                }
            }
            
            return $proyecto;
        } catch (\Throwable $e) {
            Log::error("Error cargando proyecto completo: " . $e->getMessage());
            return null;
        }
    }
}

