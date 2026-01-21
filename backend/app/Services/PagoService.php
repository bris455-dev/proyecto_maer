<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Matricula;
use App\Models\Carrito;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagoService
{
    /**
     * Procesar pago
     */
    public function procesarPago(int $usuarioID, array $data): array
    {
        DB::beginTransaction();
        try {
            $metodoPago = $data['metodo_pago'] ?? 'Tarjeta';
            $monto = $data['monto'] ?? 0;
            $numeroTransaccion = $this->generarNumeroTransaccion($metodoPago);

            // Crear registro de pago
            $pago = Pago::create([
                'usuarioID' => $usuarioID,
                'numero_transaccion' => $numeroTransaccion,
                'metodo_pago' => $metodoPago,
                'monto' => $monto,
                'estado' => 'Pendiente',
                'datos_transaccion' => $data['datos_transaccion'] ?? null,
                'notas' => $data['notas'] ?? null,
            ]);

            // Si hay matrículas asociadas, actualizar su estado
            if (!empty($data['matriculaIDs'])) {
                foreach ($data['matriculaIDs'] as $matriculaID) {
                    $matricula = Matricula::find($matriculaID);
                    if ($matricula && $matricula->usuarioID == $usuarioID) {
                        $matricula->update([
                            'estado' => 'Pagado',
                            'fecha_matricula' => now()->toDateString(),
                        ]);
                        $pago->matriculaID = $matriculaID;
                        $pago->save();
                    }
                }
            }

            // Simular procesamiento de pago (aquí se integraría con la pasarela de pago real)
            // Por ahora, marcamos como completado automáticamente
            $pago->estado = 'Completado';
            $pago->save();

            // Vaciar carrito si se procesó correctamente
            if ($pago->estado === 'Completado') {
                Carrito::where('usuarioID', $usuarioID)->delete();
            }

            DB::commit();

            return [
                'success' => true,
                'data' => $pago->load(['matricula.curso', 'usuario'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error PagoService@procesarPago: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al procesar pago: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generar número de transacción único
     */
    private function generarNumeroTransaccion(string $metodo): string
    {
        $prefijo = match($metodo) {
            'Tarjeta' => 'TAR',
            'PayPal' => 'PP',
            'Yape' => 'YAP',
            'Plin' => 'PLN',
            default => 'PAY'
        };

        $numero = $prefijo . '-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        
        // Verificar que sea único
        while (Pago::where('numero_transaccion', $numero)->exists()) {
            $numero = $prefijo . '-' . date('Ymd') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        }

        return $numero;
    }

    /**
     * Obtener pagos del usuario
     */
    public function getByUsuario(int $usuarioID): array
    {
        try {
            $pagos = Pago::with(['matricula.curso', 'usuario'])
                ->where('usuarioID', $usuarioID)
                ->orderBy('created_at', 'desc')
                ->get();

            return [
                'success' => true,
                'data' => $pagos
            ];
        } catch (\Throwable $e) {
            Log::error("Error PagoService@getByUsuario: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener pagos: ' . $e->getMessage()
            ];
        }
    }
}

