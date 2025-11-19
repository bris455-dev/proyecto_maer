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

    // 🔹 Relación con rol
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rolID', 'rolID');
    }
}
