<?php

use Illuminate\Support\Facades\Mail;
use App\Mail\CodigoMFA;

Route::get('/', function() {
    return "Servidor Laravel funcionando ✅";
});

Route::get('/test-mail', function() {
    try {
        $codigo = rand(100000, 999999);
        Mail::to('matheo.eyzaguirre@nsl.edu.pe')->send(new CodigoMFA($codigo));
        return '✅ Correo enviado correctamente';
    } catch (\Exception $e) {
        return '❌ Error al enviar correo: ' . $e->getMessage();
    }
});
