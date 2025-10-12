<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí se definen las rutas públicas y protegidas de la API.
|
*/

// ============================================================
// 🔹 RUTAS PÚBLICAS (sin autenticación requerida)
// ============================================================

// 🔸 Autenticación
Route::post('/login', [AuthController::class, 'login']);              // Login + envío de código MFA
Route::post('/verify-code', [AuthController::class, 'verifyCode']);   // Verificación de código MFA

// 🔸 Cambio de contraseña en el primer acceso
Route::post('/set-initial-password', [AuthController::class, 'setInitialPassword']);

// 🔸 Recuperar contraseña (flujo de "olvidé mi contraseña")
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);   // Solicitar enlace de recuperación
Route::post('/reset-password', [AuthController::class, 'resetPassword']);     // Restablecer contraseña con token

// ============================================================
// 🔹 RUTAS PROTEGIDAS (requieren autenticación Sanctum)
// ============================================================

Route::middleware(['auth:sanctum'])->group(function () {

    // 🔸 Gestión de usuarios (solo administrador)
    Route::middleware('role:Administrador')->group(function () {
        Route::post('/usuarios', [UserController::class, 'store']);      // Crear usuario
        Route::delete('/usuarios/{id}', [UserController::class, 'destroy']);  // Eliminar usuario
    });

    // 🔸 Gestión de proyectos (administrador y diseñador)
    Route::middleware('role:Administrador,Diseñador')->group(function () {
        Route::post('/proyectos', [ProyectoController::class, 'store']);   // Crear proyecto
        Route::put('/proyectos/{id}', [ProyectoController::class, 'update']); // Editar proyecto
    });

    // 🔸 Aprobación o devolución de proyectos (administrador o cliente)
    Route::middleware('role:Administrador,Cliente')->group(function () {
        Route::post('/proyectos/{id}/aprobar', [ProyectoController::class, 'aprobar']);  // Aprobar
        Route::post('/proyectos/{id}/devolver', [ProyectoController::class, 'devolver']); // Devolver
    });

    // 🔸 Datos del usuario autenticado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
