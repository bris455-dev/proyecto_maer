<?php

namespace App\Services;

use App\Models\Bitacora;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BitacoraService
{
    /**
     * ✅ Registra una acción en la bitácora del sistema.
     *
     * @param User|null $usuario  Usuario que realiza la acción
     * @param string    $accion   Descripción corta de la acción
     * @param string|null $detalle Detalle adicional (opcional)
     * @param string|null $ip     Dirección IP desde donde se ejecuta la acción
     * @param int|null $proyectoID ID del proyecto asociado (opcional)
     * @return void
     */
    public function registrar(?User $usuario, string $accion, ?string $detalle = null, ?string $ip = null, ?int $proyectoID = null): void
    {
        try {
            // Si no se pasa proyectoID explícito, intentamos extraerlo del detalle
            if (!$proyectoID && $detalle) {
                if (preg_match('/Proyecto ID (\d+)/', $detalle, $matches)) {
                    $proyectoID = (int)$matches[1];
                }
            }

            Bitacora::create([
                'user_id'     => $usuario?->id,
                'proyecto_id' => $proyectoID,
                'accion'      => $accion,
                'detalle'     => $detalle,
                'ip'          => $ip,
                'fecha_hora'  => Carbon::now(),
            ]);

            Log::info("📝 Acción registrada en bitácora: {$accion} — Usuario: " . ($usuario?->email ?? 'Desconocido') . ($proyectoID ? " — Proyecto ID: {$proyectoID}" : ''));

        } catch (\Throwable $e) {
            Log::error("❌ Error registrando en bitácora: " . $e->getMessage());
        }
    }
}
