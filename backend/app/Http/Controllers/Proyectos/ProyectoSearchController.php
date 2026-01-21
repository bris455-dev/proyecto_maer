<?php

namespace App\Http\Controllers\Proyectos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Proyecto;
use Illuminate\Support\Facades\Log;

class ProyectoSearchController extends Controller
{
    /**
     * Búsqueda rápida de proyectos
     */
    public function search(Request $request)
    {
        try {
            $q = $request->query('q');
            if (!$q) {
                return response()->json(['status'=>'error','message'=>'Falta query'], 422);
            }

            $results = Proyecto::where('nombre','like',"%{$q}%")
                ->orWhere('proyectoID',$q)
                ->select('proyectoID','nombre','clienteID','empleadoID','total','created_at')
                ->limit(30)
                ->get();

            // Registrar en bitácora
            try {
                app()->make(\App\Services\BitacoraService::class)
                    ->registrar($request->user(),'Búsqueda de proyectos',"Busqueda: {$q}",$request->ip());
            } catch (\Throwable $e) {
                Log::warning("Error en bitácora (search): " . $e->getMessage());
            }

            return response()->json(['status'=>'success','data'=>$results]);
        } catch (\Throwable $e) {
            Log::error("Error ProyectoSearchController@search: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error'], 500);
        }
    }
}

