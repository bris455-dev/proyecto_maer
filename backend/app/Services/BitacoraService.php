<?php

namespace App\Services;

use App\Models\Bitacora;
use App\Models\User;
use Illuminate\Support\Facades\Log;
// Eliminamos la importación de Carbon si usamos now() en la inserción
// use Carbon\Carbon; 

class BitacoraService
{
    /**
     * ✅ Registra una acción en la bitácora del sistema.
     *
     * @param User|null $usuario   Usuario que realiza la acción.
     * @param string    $accion    Descripción corta de la acción.
     * @param string|null $detalle Detalle adicional (opcional).
     * @param string|null $ip      Dirección IP desde donde se ejecuta la acción.
     * @param int|null $proyectoID ID del proyecto asociado (opcional).
     * @return void
     */
    public function registrar(?User $usuario, string $accion, ?string $detalle = null, ?string $ip = null, ?int $proyectoID = null): void
    {
        try {
            // 💡 NOTA: La lógica de extracción de proyectoID del detalle es correcta,
            // pero es más robusto pasar el ID directamente cuando esté disponible.
            if (!$proyectoID && $detalle) {
                if (preg_match('/Proyecto ID (\d+)/', $detalle, $matches)) {
                    $proyectoID = (int)$matches[1];
                }
            }

            $datos = [
                'user_id'     => $usuario?->id,
                'proyecto_id' => $proyectoID,
                'accion'      => $accion,
                'detalle'     => $detalle,
                'ip'          => $ip,
                // Usar now() de Laravel es más limpio que Carbon::now()
                'fecha_hora'  => now(), 
            ];
            
            Bitacora::create($datos);

            $logMessage = "📝 Acción registrada: {$accion} — Usuario: " . ($usuario?->email ?? 'Desconocido');
            if ($proyectoID) {
                 $logMessage .= " — Proyecto ID: {$proyectoID}";
            }
            Log::info($logMessage);

        } catch (\Throwable $e) {
            // ⚠️ Importante: El mensaje de error ahora incluye la acción que falló.
            Log::error("❌ Error registrando '{$accion}' en bitácora: " . $e->getMessage());
        }
    }
}