<?php

namespace App\Services;

use App\Models\Carrito;
use App\Models\Curso;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CarritoService
{
    /**
     * Agregar curso al carrito
     */
    public function agregar(int $usuarioID, int $cursoID): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::find($cursoID);
            
            if (!$curso) {
                return [
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ];
            }

            // Verificar si ya está en el carrito
            $existe = Carrito::where('usuarioID', $usuarioID)
                ->where('cursoID', $cursoID)
                ->first();

            if ($existe) {
                return [
                    'success' => false,
                    'message' => 'El curso ya está en el carrito'
                ];
            }

            $carrito = Carrito::create([
                'usuarioID' => $usuarioID,
                'cursoID' => $cursoID,
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => $carrito->load('curso')
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CarritoService@agregar: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al agregar al carrito: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener carrito del usuario
     */
    public function getByUsuario(int $usuarioID): array
    {
        try {
            $carrito = Carrito::with('curso')
                ->where('usuarioID', $usuarioID)
                ->orderBy('created_at', 'desc')
                ->get();

            $total = $carrito->sum(function($item) {
                return $item->curso->precio ?? 0;
            });

            return [
                'success' => true,
                'data' => $carrito,
                'total' => $total
            ];
        } catch (\Throwable $e) {
            Log::error("Error CarritoService@getByUsuario: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener carrito: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Eliminar del carrito
     */
    public function eliminar(int $carritoID, int $usuarioID): array
    {
        DB::beginTransaction();
        try {
            $carrito = Carrito::where('carritoID', $carritoID)
                ->where('usuarioID', $usuarioID)
                ->first();

            if (!$carrito) {
                return [
                    'success' => false,
                    'message' => 'Item no encontrado en el carrito'
                ];
            }

            $carrito->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Item eliminado del carrito'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CarritoService@eliminar: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al eliminar del carrito: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Vaciar carrito
     */
    public function vaciar(int $usuarioID): array
    {
        DB::beginTransaction();
        try {
            Carrito::where('usuarioID', $usuarioID)->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Carrito vaciado'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error CarritoService@vaciar: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al vaciar carrito: ' . $e->getMessage()
            ];
        }
    }
}

