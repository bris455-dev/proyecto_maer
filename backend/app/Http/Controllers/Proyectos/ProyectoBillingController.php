<?php

namespace App\Http\Controllers\Proyectos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Proyecto;
use App\Services\ProyectoService;
use Illuminate\Support\Facades\Log;

class ProyectoBillingController extends Controller
{
    protected ProyectoService $service;

    public function __construct(ProyectoService $service)
    {
        $this->service = $service;
    }

    /**
     * Obtener resumen de facturación de un proyecto
     */
    public function billing(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::find($id);
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
            Log::error("Error ProyectoBillingController@billing: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al obtener resumen de facturación'], 500);
        }
    }
}

