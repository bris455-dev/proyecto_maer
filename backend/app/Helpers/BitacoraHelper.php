<?php

namespace App\Helpers;

use App\Models\Bitacora;
use Illuminate\Support\Facades\Auth;

class BitacoraHelper
{
    public static function registrar($accion, $detalle = null)
    {
        Bitacora::create([
            'user_id' => Auth::id(),
            'accion' => $accion,
            'detalle' => $detalle,
            'ip' => request()->ip(),
        ]);
    }
}
