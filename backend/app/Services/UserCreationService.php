<?php

namespace App\Services;

use App\Models\User;
use App\Models\Empleado;
use App\Models\Cliente;
use App\DTOs\User\CreateUserDTO;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class UserCreationService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Crea un nuevo usuario y su entidad asociada (Empleado o Cliente)
     */
    public function create(CreateUserDTO $dto, string $ip): array
    {
        try {
            // 🔹 Generar contraseña temporal segura
            $passwordTemporal = Str::random(10);

            $empleadoID = null;
            $clienteID = null;
            $nombreUsuario = '';

            // ======================================================
            // 1️⃣ CREAR ENTIDAD EMPLEADO
            // ======================================================
            if ($dto->tipo === 'empleado') {

                $empleado = Empleado::create([
    'nombre' => $dto->empleado_nombre,
    'dni'    => $dto->empleado_dni,
    'cargo'  => $dto->empleado_cargo,
    'email'  => $dto->empleado_email, // <- agregado
    'estado' => $dto->empleado_estado ?? 1,
]);


                $empleadoID = $empleado->empleadoID;
                $nombreUsuario = $dto->empleado_nombre;
            }

            // ======================================================
            // 2️⃣ CREAR ENTIDAD CLIENTE
            // ======================================================
            elseif ($dto->tipo === 'cliente') {

                $cliente = Cliente::create([
                    'nombre'    => $dto->cliente_nombre,
                    'dni_ruc'   => $dto->cliente_dni_ruc,
                    'direccion' => $dto->cliente_direccion,
                    'pais'      => $dto->cliente_pais,
                    'email'     => $dto->cliente_email,
                    'estado'    => $dto->cliente_estado ?? 1,
                ]);

                $clienteID = $cliente->clienteID;
                $nombreUsuario = $dto->cliente_nombre;
            }

            // ======================================================
            // 3️⃣ CREAR USUARIO PRINCIPAL
            // ======================================================
            $usuario = User::create([
                'nombre'      => $nombreUsuario,
                'email'       => $dto->email,
                'password'    => Hash::make($passwordTemporal),
                'rolID'       => $dto->rolID,
                'empleadoID'  => $empleadoID,
                'clienteID'   => $clienteID,
                'is_locked'   => 0,
                'password_changed' => 0,
                'created_at' => Carbon::now(),
            ]);

            // ======================================================
            // 4️⃣ Registrar en bitácora
            // ======================================================
            $this->bitacoraService->registrar(
                $usuario,
                'Creación de usuario',
                "Usuario {$usuario->email} creado correctamente.",
                $ip
            );

            return [
                'success' => true,
                'message' => 'Usuario creado exitosamente con contraseña temporal.',
                'data' => $usuario,
                'password_temporal' => $passwordTemporal,
            ];

        } catch (\Throwable $e) {

            Log::error(
                "❌ Error al crear usuario: " . $e->getMessage() .
                " — linea " . $e->getLine()
            );

            return [
                'success' => false,
                'message' => 'Error al crear el usuario y sus entidades asociadas.',
            ];
        }
    }
}
