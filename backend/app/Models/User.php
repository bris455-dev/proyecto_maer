<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'email',
        'password',
        'empleadoID',
        'clienteID',
        'rolID', // 🔹 enlazamos directamente con Rol
        'estado',
        'mfa_code',
        'mfa_expires_at',
        'password_changed',
        'failed_attempts',
        'is_locked',
        'lock_expires_at',
        'password_reset_token',
        'password_reset_expires_at',
        // Preferencias del usuario
        'idioma',
        'tema',
        'notificaciones_email',
        'notificaciones_nuevos_cursos',
        'notificaciones_recordatorios',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_code',
        'mfa_expires_at',
        'password_reset_token',
    ];

    protected $casts = [
        'mfa_expires_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    // 🔹 Relación con rol (mantener para compatibilidad)
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rolID', 'rolID');
    }

    // 🔹 Relación con múltiples roles/perfiles
    public function roles()
    {
        return $this->hasMany(UsuarioRol::class, 'usuarioID', 'id')
            ->where('activo', true);
    }

    // 🔹 Obtener todos los roles activos del usuario
    public function getRolesActivos()
    {
        return $this->roles()->with('rol')->get();
    }
}
