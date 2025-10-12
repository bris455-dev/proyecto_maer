<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    // =======================================
    // 🔹 LOGIN CON BLOQUEO TRAS 3 INTENTOS
    // =======================================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // 🔸 Verificar si está bloqueado
        if ($user->is_locked && Carbon::now()->lessThan($user->lock_expires_at)) {
            return response()->json([
                'error' => 'Cuenta bloqueada temporalmente. Intente más tarde.'
            ], 403);
        }

        // 🔸 Verificar contraseña
        if (!Hash::check($request->password, $user->password)) {
            $user->failed_attempts = $user->failed_attempts + 1;

            if ($user->failed_attempts >= 3) {
                $user->is_locked = 1;
                $user->lock_expires_at = Carbon::now()->addMinutes(5);
                $user->failed_attempts = 0;
            }

            $user->save();
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        // 🔹 Reiniciar intentos fallidos al ingresar correctamente
        $user->failed_attempts = 0;
        $user->is_locked = 0;
        $user->lock_expires_at = null;
        $user->save();

        // 🔹 Primer acceso → debe cambiar contraseña
        if (!$user->password_changed) {
            return response()->json([
                'message' => 'Debe cambiar su contraseña en el primer acceso',
                'user' => [
                    'nombre' => $user->nombre,
                    'email' => $user->email
                ],
                'first_access' => true
            ], 200);
        }

        // 🔹 Generar código MFA de 6 dígitos
        $codigoMFA = rand(100000, 999999);
        $user->mfa_code = $codigoMFA;
        $user->mfa_expires_at = Carbon::now()->addMinutes(5);
        $user->save();

        // 🔹 Enviar correo con el código
        Mail::raw("Tu código de autenticación es: $codigoMFA", function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Código de verificación - MAER Plataforma');
        });

        return response()->json([
            'message' => 'Código MFA enviado al correo',
            'user' => [
                'nombre' => $user->nombre,
                'email' => $user->email,
                'password_changed' => $user->password_changed
            ],
            'first_access' => false
        ], 200);
    }

    // =======================================
    // 🔹 VERIFICAR CÓDIGO MFA
    // =======================================
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'codigo' => 'required|digits:6',
        ]);

        $user = User::where('email', $request->email)
                    ->where('mfa_code', $request->codigo)
                    ->first();

        if (!$user) {
            return response()->json(['error' => 'Código incorrecto o usuario no encontrado'], 401);
        }

        if (Carbon::now()->greaterThan($user->mfa_expires_at)) {
            return response()->json(['error' => 'Código expirado'], 401);
        }

        // 🔹 Limpiar MFA
        $user->mfa_code = null;
        $user->mfa_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Autenticación exitosa',
            'user' => [
                'nombre' => $user->nombre,
                'email' => $user->email
            ]
        ], 200);
    }

    // =======================================
    // 🔹 CAMBIO DE CONTRASEÑA INICIAL
    // =======================================
    public function setInitialPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password_nuevo' => [
                'required',
                'confirmed',
                'min:8',
                'regex:/[A-Z]/', // mayúscula
                'regex:/[a-z]/', // minúscula
                'regex:/[0-9]/', // número
                'regex:/[@$!%*#?&]/' // carácter especial
            ],
        ], [
            'password_nuevo.regex' => 'La contraseña debe tener mayúscula, minúscula, número y símbolo especial.'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->password = Hash::make($request->password_nuevo);
        $user->password_changed = 1;

        // 🔹 Generar nuevo MFA
        $codigoMFA = rand(100000, 999999);
        $user->mfa_code = $codigoMFA;
        $user->mfa_expires_at = Carbon::now()->addMinutes(5);
        $user->save();

        Mail::raw("Tu nuevo código de verificación es: $codigoMFA", function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Código de verificación - MAER Plataforma');
        });

        return response()->json([
            'message' => 'Contraseña cambiada exitosamente y código MFA enviado',
            'user' => [
                'nombre' => $user->nombre,
                'email' => $user->email
            ]
        ], 200);
    }

    // =======================================
    // 🔹 OLVIDÉ MI CONTRASEÑA (ENVÍA ENLACE)
    // =======================================
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'El correo no está registrado.'], 404);
        }

        // Generar un código de 6 dígitos
        $token = rand(100000, 999999);
        $user->password_reset_token = $token;
        $user->password_reset_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // 📩 Enviar el código al correo
        try {
            Mail::raw(
                "Tu código para restablecer la contraseña es: {$token}. 
                 Este código expirará en 10 minutos.",
                function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Código de recuperación de contraseña');
                }
            );
        } catch (\Exception $e) {
            // Si no hay conexión a internet, puedes dejar esto como backup temporal:
            return response()->json([
                'message' => 'Modo local: correo no enviado, muestra el código en pantalla.',
                'code' => $token
            ]);
        }

        return response()->json(['message' => 'Código de recuperación enviado correctamente.']);
    }

     // ✅ Paso 2 — Restablecer contraseña usando el código recibido
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password_nuevo' => 'required|confirmed|min:8'
        ]);

        $user = User::where('email', $request->email)
            ->where('password_reset_token', $request->token)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Código o correo inválido.'], 400);
        }

        if (Carbon::now()->greaterThan($user->password_reset_expires_at)) {
            return response()->json(['error' => 'El código ha expirado.'], 400);
        }

        // Cambiar la contraseña
        $user->password = Hash::make($request->password_nuevo);
        $user->password_reset_token = null;
        $user->password_reset_expires_at = null;
        $user->save();

        return response()->json(['message' => 'Contraseña restablecida correctamente.']);
    }
}
