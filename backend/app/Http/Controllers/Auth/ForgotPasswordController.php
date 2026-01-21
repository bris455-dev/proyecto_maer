<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Bitacora;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class ForgotPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'No existe un usuario con ese correo.'
            ], 404);
        }

        // ✅ Código de 6 dígitos
        $codigo = random_int(100000, 999999);

        $user->update([
            'password_reset_token' => $codigo,
            'password_reset_expires_at' => Carbon::now()->addMinutes(30),
        ]);

        // ✅ Enviar correo simple
        $body = "Tu código de recuperación es: {$codigo}\n\nExpira en 30 minutos.";
        Mail::raw($body, function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Recuperación de contraseña - Plataforma MAER');
        });

        // ✅ Registrar en bitácora
        Bitacora::create([
            'user_id' => $user->id,
            'accion' => 'Solicitud de recuperación de contraseña',
            'descripcion' => 'Se envió un código de recuperación al correo del usuario.',
            'ip' => request()->ip(),
            'fecha_hora' => now(), // Añadido para consistencia con otros controladores
        ]);

        Log::info("Código de recuperación enviado a {$user->email}");

        return response()->json([
            'status' => 'success',
            'message' => 'El código fue enviado correctamente a tu correo.'
        ], 200);
    }
}

