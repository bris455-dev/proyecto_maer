<?php

namespace App\Http\Controllers\Proyectos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Requests\Proyectos\StoreProyectoRequest;
use App\Requests\Proyectos\UpdateProyectoRequest;
use App\Services\ProyectoService;
use App\Models\Proyecto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProyectoController extends Controller
{
    protected ProyectoService $service;

    public function __construct(ProyectoService $service)
    {
        $this->service = $service;
    }

    // Listar proyectos según rol
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $filters = ['q' => $request->query('q') ?? null];
            $lista = $this->service->listForUser($user, $filters);

            app()->make(\App\Services\BitacoraService::class)
                ->registrar($user, 'Listado de proyectos', 'Listado consultado', $request->ip());

            return response()->json(['status' => 'success', 'data' => $lista]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@index: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al listar proyectos'], 500);
        }
    }

    // Mostrar proyecto con imágenes e historial
    public function show(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::with(['detalles.tratamiento'])->find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $proyecto->imagenes = DB::table('proyecto_imagenes')
                ->where('proyectoID', $proyecto->proyectoID)
                ->pluck('ruta');

            $proyecto->historial = DB::table('proyecto_historial')
                ->where('proyectoID', $proyecto->proyectoID)
                ->get();

            return response()->json(['status'=>'success','data'=>$proyecto]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@show: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al mostrar proyecto'], 500);
        }
    }

    // Crear proyecto
    public function store(StoreProyectoRequest $request)
    {
        try {
            $validated = $request->validated();
            $actor = $request->user();
            $result = $this->service->create($validated, $actor, $request->ip());

            if (!$result['success']) {
                return response()->json(['status'=>'error','message'=>$result['message']], 400);
            }

            return response()->json(['status'=>'success','data'=>$result['data']], 201);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@store: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al crear proyecto'], 500);
        }
    }

    // Actualizar proyecto
    public function update(UpdateProyectoRequest $request, $id)
    {
        try {
            $proyecto = Proyecto::find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $user = $request->user();
            if (!$this->checkPermission($user, $proyecto)) {
                return response()->json(['status'=>'error','message'=>'Sin permiso'], 403);
            }

            $validated = $request->validated();
            $result = $this->service->update($proyecto, $validated, $user, $request->ip());

            if (!$result['success']) {
                return response()->json(['status'=>'error','message'=>$result['message']], 400);
            }

            return response()->json(['status'=>'success','data'=>$result['data']]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@update: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al actualizar proyecto'], 500);
        }
    }

    // Subir imágenes
    public function uploadImages(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $user = $request->user();
            if (!$this->checkPermission($user, $proyecto)) {
                return response()->json(['status'=>'error','message'=>'Sin permiso'], 403);
            }

            $files = $request->file('images', []);
            $stored = DB::table('proyecto_imagenes')
                ->where('proyectoID', $proyecto->proyectoID)
                ->pluck('ruta')
                ->toArray();

            foreach ((array)$files as $f) {
                $path = $f->store('proyectos/'.$proyecto->proyectoID,'public');
                DB::table('proyecto_imagenes')->insert([
                    'proyectoID'=>$proyecto->proyectoID,
                    'ruta'=>$path,
                    'created_at'=>now()
                ]);
                $stored[] = $path;
            }

            app()->make(\App\Services\BitacoraService::class)
                ->registrar($user, 'Subida imágenes proyecto', "Proyecto {$proyecto->proyectoID}", $request->ip());

            return response()->json(['status'=>'success','data'=>['imagenes'=>$stored]]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@uploadImages: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al subir imágenes'], 500);
        }
    }

    // Facturación / resumen por tratamiento con comisión diseñador
    public function billing(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::with('detalles.tratamiento')->find($id);
            if (!$proyecto) {
                return response()->json(['status'=>'error','message'=>'Proyecto no encontrado'], 404);
            }

            $user = $request->user();
            $result = $this->service->billingSummary($proyecto, $user);

            if (!$result['success']) {
                return response()->json(['status'=>'error','message'=>$result['message']], 403);
            }

            return response()->json(['status'=>'success','data'=>$result]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@billing: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al obtener resumen de facturación'], 500);
        }
    }

    // Búsqueda rápida
    public function search(Request $request)
    {
        try {
            $q = $request->query('q');
            if (!$q) return response()->json(['status'=>'error','message'=>'Falta query'], 422);

            $results = Proyecto::where('nombre','like',"%{$q}%")
                ->orWhere('proyectoID',$q)
                ->select('proyectoID','nombre','clienteID','empleadoID','total','created_at')
                ->limit(30)
                ->get();

            app()->make(\App\Services\BitacoraService::class)
                ->registrar($request->user(),'Búsqueda de proyectos',"Busqueda: {$q}",$request->ip());

            return response()->json(['status'=>'success','data'=>$results]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoController@search: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error'], 500);
        }
    }

    // Permisos según rol
    private function checkPermission($user, Proyecto $proyecto): bool
    {
        if ($user->rolID == 1) return true; // Admin
        if ($user->rolID == 2 && $proyecto->empleadoID == $user->empleadoID) return true; // Diseñador
        if ($user->rolID == 3 && $proyecto->clienteID == $user->clienteID) return true; // Cliente
        return false;
    }
}
