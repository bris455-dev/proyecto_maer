<?php

// app/Services/PermisoService.php
namespace App\Services;

use App\Models\Permiso;
use Illuminate\Support\Facades\DB;

class PermisoService
{
    public function getAll()
{
    return Permiso::select('permisoID AS id','nombreModulo','nombreSubmodulo')
                   ->orderBy('nombreModulo')
                   ->get();
}


    public function create($data)
    {
        try {
            $permiso = Permiso::create($data);

            return [
                'success' => true,
                'message' => 'Permiso creado correctamente',
                'data' => $permiso
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Error al crear permiso',
                'error'   => $e->getMessage()
            ];
        }
    }

    public function update($id, $data)
    {
        try {
            $permiso = Permiso::find($id);
            if(!$permiso){
                return ['success'=>false,'message'=>'Permiso no encontrado'];
            }

            $permiso->update($data);

            return [
                'success'=> true,
                'message'=> 'Permiso actualizado correctamente',
                'data'   => $permiso
            ];

        } catch (\Throwable $e){
            return [
                'success'=>false,
                'message'=>'Error al actualizar permiso',
                'error'=>$e->getMessage()
            ];
        }
    }

    public function delete($id)
    {
        try {
            $permiso = Permiso::find($id);
            if(!$permiso){
                return ['success'=>false,'message'=>'Permiso no encontrado'];
            }

            $permiso->delete();
            
            return [
                'success'=> true,
                'message'=> 'Permiso eliminado correctamente'
            ];

        } catch (\Throwable $e){
            return [
                'success'=>false,
                'message'=>'Error al eliminar permiso',
                'error'=>$e->getMessage()
            ];
        }
    }
}
