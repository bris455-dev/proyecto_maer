<?php

namespace App\Http\Controllers\Clientes;

use App\Http\Controllers\Controller;

class ClienteConsultaController extends Controller
{
    public function index()
    {
        return response()->json(['status' => 'success', 'message' => 'Consulta clientes placeholder']);
    }
}
