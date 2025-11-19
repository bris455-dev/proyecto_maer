<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tratamiento extends Model
{
    protected $table = 'tratamiento';
    protected $primaryKey = 'tratamientoID';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'precio',
        'color',
    ];
}
