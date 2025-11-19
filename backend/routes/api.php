<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// AUTH
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\MFAController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\ForgotPasswordController;

// Módulos del sistema
use App\Http\Controllers\Proyectos\ProyectoController;
use App\Http\Controllers\Clientes\ClienteController;
use App\Http\Controllers\Seguridad\UserStatusController;
use App\Http\Controllers\Seguridad\UserController;
use App\Http\Controllers\Reportes\ReporteController;
use App\Http\Controllers\Seguridad\ChangePasswordController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/verify-mfa', [MFAController::class, 'verifyMfa']);
    Route::post('/set-initial-password', [PasswordController::class, 'setInitialPassword']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
    Route::post('/reset-password', [ResetPasswordController::class, 'resetPassword']);
});

/*
|--------------------------------------------------------------------------
| RUTAS PRIVADAS (AUTH SANCTUM)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Usuario autenticado
    Route::get('/user', fn(Request $request) => response()->json($request->user()));

    // Logout
    Route::post('/auth/logout', [LogoutController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Seguridad → Cambio de contraseña
    |--------------------------------------------------------------------------
    */

    // Cambio de contraseña del propio usuario
    Route::post('/user/change-password', [ChangePasswordController::class, 'update']);

    // Reset de contraseña (solo rol 1)
    Route::post('/admin/reset-password', [ChangePasswordController::class, 'adminReset']);

    // Buscar usuarios por nombre (solo admins)
    Route::get('/admin/users/search', [ChangePasswordController::class, 'searchUsersByName'])
    ->middleware('permission:Gestión de Usuarios,listar');

    /*
    |--------------------------------------------------------------------------
    | Usuarios (ADMIN)
    |--------------------------------------------------------------------------
    */
    Route::post('/CrearUsuarios', [UserController::class, 'store'])
        ->middleware('permission:Gestión de Usuarios,crear');

    Route::get('/usuarios', [UserController::class, 'index'])
        ->middleware('permission:Gestión de Usuarios,listar');

    Route::put('/usuarios/{id}', [UserController::class, 'update'])
        ->middleware('permission:Gestión de Usuarios,editar');

    Route::patch('/usuarios/{id}/toggle-estado', [UserStatusController::class, 'toggleEstado'])
        ->middleware('permission:Gestión de Usuarios,desactivar');

    /*
    |--------------------------------------------------------------------------
    | Clientes
    |--------------------------------------------------------------------------
    */
    Route::get('/clientes', [ClienteController::class, 'all'])
        ->middleware('permission:Listado de Clientes,listar');

    Route::post('/clientes', [ClienteController::class, 'store'])
        ->middleware('permission:Registrar Cliente,crear');

    Route::put('/clientes/{id}', [ClienteController::class, 'update'])
        ->middleware('permission:Listado de Clientes,editar');

    Route::put('/clientes/{id}/toggle-estado', [ClienteController::class, 'toggleEstado'])
        ->middleware('permission:Listado de Clientes,desactivar');

    /*
    |--------------------------------------------------------------------------
    | Proyectos
    |--------------------------------------------------------------------------
    */
   
    Route::get('/proyectos', [ProyectoController::class, 'index'])
        ->middleware('permission:Listado de Proyectos,listar');

    Route::get('/proyectos/{id}', [ProyectoController::class, 'show'])
        ->middleware('permission:Listado de Proyectos,listar');

    Route::post('/proyectos', [ProyectoController::class, 'store'])
        ->middleware('permission:Nuevo Proyecto,crear');

    Route::put('/proyectos/{id}', [ProyectoController::class, 'update'])
        ->middleware('permission:Nuevo Proyecto,editar');

    Route::post('/proyectos/{id}/billing', [ProyectoController::class, 'billing'])
        ->middleware('permission:Listado de Proyectos,ver_facturacion');

    Route::post('/proyectos/{id}/imagenes', [ProyectoController::class, 'uploadImages'])
        ->middleware('permission:Nuevo Proyecto,editar');

    // Reportes
    Route::get('/reportes', [ReporteController::class, 'index']);
    Route::get('/reportes/export', [ReporteController::class, 'export']);


});
