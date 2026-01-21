<?php

namespace App\Services;

use App\Models\User;
use App\Models\Empleado;
use App\Models\Cliente;
use App\Models\UsuarioRol;
use App\DTOs\User\CreateUserDTO;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserCreationService
{
    protected BitacoraService $bitacoraService;

    public function __construct(BitacoraService $bitacoraService)
    {
        $this->bitacoraService = $bitacoraService;
    }

    /**
     * Crea un nuevo usuario o agrega un nuevo rol/perfil a un usuario existente
     * - Si el email NO existe: crea usuario nuevo con contraseña genérica Maer1234$
     * - Si el email YA existe: agrega el nuevo rol/perfil usando su contraseña existente
     */
    public function create(CreateUserDTO $dto, string $ip): array
    {
        // Usamos transacción para consistencia en caso de error
        DB::beginTransaction();
        try {
            $empleadoID = null;
            $clienteID = null;
            $nombreUsuario = '';
            $usuarioExistente = null;
            $esUsuarioNuevo = false;
            $passwordTemporalPlano = null;

            // Verificar si el usuario ya existe por email
            $usuarioExistente = User::where('email', $dto->email)->first();

            // 1) Crear entidad empleado (si aplica)
            if ($dto->tipo === 'empleado') {
                if (empty($dto->empleado_nombre) || empty($dto->empleado_dni) || empty($dto->empleado_cargo)) {
                    throw new \Exception('Los campos del empleado son obligatorios: nombre, dni, cargo');
                }

                // Si el usuario existe y ya tiene empleadoID, usar el existente
                if ($usuarioExistente && $usuarioExistente->empleadoID) {
                    $empleadoID = $usuarioExistente->empleadoID;
                    $nombreUsuario = $usuarioExistente->nombre;
                } else {
                    $empleado = Empleado::create([
                        'nombre' => $dto->empleado_nombre,
                        'dni'    => $dto->empleado_dni,
                        'cargo'  => $dto->empleado_cargo,
                        'email'  => $dto->empleado_email ?? null,
                        'estado' => $dto->empleado_estado ?? 1,
                    ]);

                    $empleadoID = $empleado->empleadoID ?? $empleado->id ?? null;
                    $nombreUsuario = $dto->empleado_nombre;
                }
            }

            // 2) Crear entidad cliente (si aplica)
            elseif ($dto->tipo === 'cliente') {
                if (empty($dto->cliente_nombre) || empty($dto->cliente_dni_ruc) || empty($dto->cliente_direccion) || empty($dto->cliente_pais)) {
                    throw new \Exception('Los campos del cliente son obligatorios: nombre, dni_ruc, direccion, pais');
                }

                // Si el usuario existe y ya tiene clienteID, usar el existente
                if ($usuarioExistente && $usuarioExistente->clienteID) {
                    $clienteID = $usuarioExistente->clienteID;
                    $nombreUsuario = $usuarioExistente->nombre;
                } else {
                    $cliente = Cliente::create([
                        'nombre'    => $dto->cliente_nombre,
                        'dni_ruc'   => $dto->cliente_dni_ruc,
                        'direccion' => $dto->cliente_direccion,
                        'pais'      => $dto->cliente_pais,
                        'email'     => $dto->cliente_email ?? null,
                        'estado'    => $dto->cliente_estado ?? 1,
                    ]);

                    $clienteID = $cliente->clienteID ?? $cliente->id ?? null;
                    $nombreUsuario = $dto->cliente_nombre;
                }
            }

            // 3) Si el usuario NO existe, crear nuevo usuario con contraseña genérica
            if (!$usuarioExistente) {
                $esUsuarioNuevo = true;
                $passwordTemporalPlano = 'Maer1234$';
                $passwordHash = Hash::make($passwordTemporalPlano);
                
                Log::info('UserCreationService - Creando NUEVO usuario', [
                    'email' => $dto->email,
                    'tipo' => $dto->tipo,
                    'rolID' => $dto->rolID
                ]);

                $usuario = User::create([
                    'nombre'           => $nombreUsuario,
                    'email'            => $dto->email,
                    'password'         => $passwordHash,
                    'rolID'            => $dto->rolID, // Rol principal (el primero)
                    'empleadoID'       => $empleadoID,
                    'clienteID'        => $clienteID,
                    'is_locked'        => 0,
                    'password_changed' => 0,
                    'created_at'       => Carbon::now(),
                ]);
                
                // Verificar que la contraseña se guardó correctamente
                $usuario->refresh();
                $passwordVerification = Hash::check($passwordTemporalPlano, $usuario->password);
                
                if (!$passwordVerification) {
                    throw new \Exception('Error: La contraseña no se guardó correctamente.');
                }
            } else {
                // Usuario ya existe, usar el existente
                $usuario = $usuarioExistente;
                Log::info('UserCreationService - Usuario EXISTENTE, agregando nuevo rol', [
                    'usuario_id' => $usuario->id,
                    'email' => $dto->email,
                    'nuevo_rolID' => $dto->rolID,
                    'tipo' => $dto->tipo
                ]);
            }

            // 4) Verificar si ya existe este rol para este usuario
            $rolExistente = UsuarioRol::where('usuarioID', $usuario->id)
                ->where('rolID', $dto->rolID)
                ->where(function($query) use ($empleadoID, $clienteID) {
                    $query->where(function($q) use ($empleadoID, $clienteID) {
                        $q->where('empleadoID', $empleadoID)
                          ->where('clienteID', $clienteID);
                    });
                })
                ->first();

            if ($rolExistente) {
                // Si el rol ya existe pero está inactivo, reactivarlo
                if (!$rolExistente->activo) {
                    $rolExistente->activo = true;
                    $rolExistente->save();
                } else {
                    throw new \Exception("Este usuario ya tiene el rol {$dto->rolID} asignado para este perfil.");
                }
            } else {
                // Crear nuevo registro en usuario_roles
                UsuarioRol::create([
                    'usuarioID' => $usuario->id,
                    'rolID' => $dto->rolID,
                    'empleadoID' => $empleadoID,
                    'clienteID' => $clienteID,
                    'activo' => true,
                ]);
            }

            // 5) Actualizar empleadoID o clienteID en el usuario si no los tenía
            if ($empleadoID && !$usuario->empleadoID) {
                $usuario->empleadoID = $empleadoID;
            }
            if ($clienteID && !$usuario->clienteID) {
                $usuario->clienteID = $clienteID;
            }
            // Actualizar rolID principal si es el primer rol o si no tiene rol principal
            if (!$usuario->rolID) {
                $usuario->rolID = $dto->rolID;
            }
            $usuario->save();

            // 6) Registrar en bitácora
            $accion = $esUsuarioNuevo ? 'Creación de usuario' : 'Agregado de rol/perfil';
            $detalle = $esUsuarioNuevo 
                ? "Usuario {$usuario->email} creado correctamente."
                : "Rol {$dto->rolID} agregado al usuario {$usuario->email}.";
            
            $this->bitacoraService->registrar(
                $usuario,
                $accion,
                $detalle,
                $ip
            );

            DB::commit();

            return [
                'success' => true,
                'message' => $esUsuarioNuevo 
                    ? 'Usuario creado exitosamente.' 
                    : 'Rol/perfil agregado exitosamente al usuario existente.',
                'data' => $usuario->load('roles'),
                'password_temporal' => $esUsuarioNuevo ? $passwordTemporalPlano : null, // Solo para usuarios nuevos
                'es_usuario_nuevo' => $esUsuarioNuevo
            ];

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error(
                "❌ Error al crear usuario: {$e->getMessage()} — linea {$e->getLine()}\n" .
                "Payload DTO: " . json_encode($dto->toArray() ?? [])
            );

            return [
                'success' => false,
                'message' => 'Error al crear el usuario y sus entidades asociadas.',
                'debug' => env('APP_DEBUG') ? $e->getMessage() : null,
            ];
        }
    }
}
