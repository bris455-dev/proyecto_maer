<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nombre',
        'email',
        'password',
        'mfa_code',
        'mfa_expires_at',
        'password_changed',
        'rol',
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

    public $timestamps = false; // tienes created_at
}


