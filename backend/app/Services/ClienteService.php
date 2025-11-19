<?php

namespace App\Services;

use App\Models\Cliente;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;

class ClienteService
{
    /**
     * 🔹 Crear un nuevo cliente.
     */
    public function createCliente(array $data)
    {
        try {
            $cliente = Cliente::create($data);

            BitacoraService::registrar(
                auth()->user(),
                'Creación de cliente',
                "Cliente creado: {$cliente->nombre}"
            );

            return [
                'success' => true,
                'message' => 'Cliente creado correctamente.',
                'cliente' => $cliente
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error al crear cliente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear el cliente.'
            ];
        }
    }

    /**
     * 🔹 Actualizar datos del cliente.
     */
    public function updateCliente(int $id, array $data)
    {
        try {
            $cliente = Cliente::findOrFail($id);
            $cliente->update($data);

            BitacoraService::registrar(auth()->user(), 'Actualización de cliente', "Cliente actualizado: {$cliente->nombre}");

            return [
                'success' => true,
                'message' => 'Cliente actualizado correctamente.',
                'cliente' => $cliente
            ];
        } catch (\Throwable $e) {
            Log::error("❌ Error al actualizar cliente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar el cliente.'
            ];
        }
    }
}
