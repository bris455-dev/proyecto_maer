<?php

namespace App\Http\Controllers\Clientes;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\BitacoraService;
use Illuminate\Validation\ValidationException;

class ClienteController extends Controller
{
    protected $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    // 🔹 Crear cliente
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'dni_ruc' => 'required|string',
            'direccion' => 'required|string',
            'pais' => 'required|string',
            'email' => 'required|email|unique:cliente,email', 
        ]);

        try {
            $exist = Cliente::where('dni_ruc', $request->dni_ruc)
                ->orWhere('nombre', $request->nombre)
                ->first();

            if ($exist) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ya existe un cliente con el mismo DNI/RUC o Nombre.'
                ], 400);
            }

            $cliente = Cliente::create([
                'nombre' => $request->nombre,
                'dni_ruc' => $request->dni_ruc,
                'direccion' => $request->direccion,
                'pais' => $request->pais,
                'email' => $request->email,
                'estado' => "1" // Activo por defecto
            ]);

            // Registrar acción en bitácora
            if (auth()->check()) {
                try {
                    $saved = $this->bitacoraService->registrar(
                        auth()->user(),
                        'Creación de cliente',
                        "Cliente creado: {$cliente->nombre}",
                        $request->ip()
                    );

                    if ($saved) {
                        Log::info("✅ Bitácora guardada correctamente para cliente {$cliente->nombre}");
                    }
                } catch (\Throwable $e) {
                    Log::warning("Fallo en Bitácora (store): " . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Cliente creado correctamente.",
                'cliente' => $cliente
            ], 201);

        } catch (\Throwable $e) {
            Log::error("Error al crear cliente: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Error interno al crear el cliente.'], 500);
        }
    }

    // 🔹 Listar todos los clientes
    public function all()
    {
        try {
            $clientes = Cliente::all();
            return response()->json(['status' => 'success', 'clientes' => $clientes]);
        } catch (\Throwable $e) {
            Log::error("Error al obtener clientes: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Error al obtener clientes.'], 500);
        }
    }

    // 🔹 Obtener cliente por ID
    public function show($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);
            return response()->json(['status' => 'success', 'cliente' => $cliente]);
        } catch (\Throwable $e) {
            Log::error("Error al obtener cliente: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Cliente no encontrado'], 404);
        }
    }

    // 🔹 Actualizar cliente
    public function update(Request $request, $id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            $request->validate([
                'direccion' => 'required|string',
                'email' => 'required|email|unique:cliente,email,'.$id.',clienteID', 
            ]);

            $cliente->update([
                'direccion' => $request->direccion,
                'email' => $request->email
            ]);

            // Registrar acción en bitácora
            if (auth()->check()) {
                try {
                    $this->bitacoraService->registrar(
                        auth()->user(),
                        'Actualización de cliente',
                        "Cliente actualizado: {$cliente->nombre}",
                        $request->ip()
                    );
                } catch (\Throwable $e) {
                    Log::warning("Fallo en Bitácora (update): " . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Cliente actualizado correctamente',
                'cliente' => $cliente
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Error de validación: Revise los campos.', 
                'errors' => $e->errors()
            ], 422);

        } catch (\Throwable $e) {
            Log::error("Error al actualizar cliente ID {$id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['status'=>'error','message'=>'Error interno al actualizar el cliente'], 500);
        }
    }

    // 🔹 Activar / Desactivar cliente
    public function toggleEstado($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            $accion = $cliente->estado === 1 ? 'desactivado' : 'activado';
            $cliente->estado = $cliente->estado === 1 ? 2 : 1;
            $cliente->save();

            // Registrar acción en bitácora
            if (auth()->check()) {
                try {
                    $this->bitacoraService->registrar(
                        auth()->user(),
                        ucfirst($accion) . ' de cliente',
                        "Cliente {$accion}: {$cliente->nombre}",
                        request()->ip()
                    );
                } catch (\Throwable $e) {
                    Log::warning("Fallo en Bitácora (toggleEstado): " . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Cliente {$accion} correctamente",
                'cliente' => $cliente
            ]);

        } catch (\Throwable $e) {
            Log::error("Error al cambiar estado de cliente: " . $e->getMessage());
            return response()->json(['status'=>'error','message'=>'Error al cambiar estado del cliente'], 500);
        }
    }
}
