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
use App\Http\Controllers\Proyectos\ProyectoFileController;
use App\Http\Controllers\Proyectos\ProyectoBillingController;
use App\Http\Controllers\Proyectos\ProyectoSearchController;
use App\Http\Controllers\Clientes\ClienteController;
use App\Http\Controllers\Seguridad\UserStatusController;
use App\Http\Controllers\Seguridad\UserController;
use App\Http\Controllers\Reportes\ReporteController;
use App\Http\Controllers\Reportes\ReporteExportController;
use App\Http\Controllers\Seguridad\ChangePasswordController;
use App\Http\Controllers\Seguridad\AdminResetPasswordController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\PermisoController;
use App\Http\Controllers\Facturacion\FacturacionController;
use App\Http\Controllers\Cursos\CursoController;
use App\Http\Controllers\Cursos\CarritoController;
use App\Http\Controllers\Cursos\MatriculaController;
use App\Http\Controllers\Cursos\PagoController;
use App\Http\Controllers\Cursos\CatalogoController;
use App\Http\Controllers\Auth\ChangeProfileController;
use App\Http\Controllers\Estudiante\EstudiantePerfilController;
use App\Http\Controllers\Inventario\InventarioController;
use App\Http\Controllers\Produccion\ProduccionController;

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
    
    // Cambiar perfil/rol
    Route::post('/auth/change-profile', [ChangeProfileController::class, 'changeProfile']);

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

    Route::delete('/usuarios/{id}', [UserController::class, 'destroy'])
        ->middleware('permission:Gestión de Usuarios,eliminar');

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

    Route::delete('/clientes/{id}', [ClienteController::class, 'destroy'])
        ->middleware('permission:Listado de Clientes,eliminar');

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
    
    // Ruta POST alternativa para FormData con archivos (Laravel tiene problemas con PUT y archivos)
    Route::post('/proyectos/{id}', [ProyectoController::class, 'update'])
        ->middleware('permission:Nuevo Proyecto,editar');

    Route::post('/proyectos/{id}/billing', [ProyectoBillingController::class, 'billing'])
        ->middleware('permission:Listado de Proyectos,ver_facturacion');

    Route::post('/proyectos/{id}/imagenes', [ProyectoFileController::class, 'uploadImages'])
        ->middleware('permission:Nuevo Proyecto,editar');

    Route::get('/proyectos/search', [ProyectoSearchController::class, 'search'])
        ->middleware('permission:Listado de Proyectos,listar');

    // Reportes
    Route::get('/reportes', [ReporteController::class, 'index']);
    Route::get('/reportes/export', [ReporteExportController::class, 'export'])
        ->middleware('permission:Reportes,descargar');

    // Facturación
    Route::get('/facturacion', [FacturacionController::class, 'index'])
        ->middleware('permission:Facturación,Gestionar');
    Route::get('/facturacion/proyectos-disponibles', [FacturacionController::class, 'proyectosDisponibles'])
        ->middleware('permission:Facturación,Gestionar');
    Route::get('/facturacion/{id}', [FacturacionController::class, 'show'])
        ->middleware('permission:Facturación,Gestionar');
    Route::post('/facturacion', [FacturacionController::class, 'store'])
        ->middleware('permission:Facturación,Gestionar');
    Route::put('/facturacion/{id}/estado', [FacturacionController::class, 'updateEstado'])
        ->middleware('permission:Facturación,Gestionar');

    /*
    |--------------------------------------------------------------------------
    | Cursos
    |--------------------------------------------------------------------------
    */
    
    // Cursos
    // Obtener filtros del catálogo (disponible para todos)
    Route::get('/catalogo/filtros', [CatalogoController::class, 'getFiltros'])
        ->middleware('permission:Cursos,visualizar');
    
    // Visualizar cursos (disponible para todos los roles con permiso de visualizar)
    Route::get('/cursos', [CursoController::class, 'index'])
        ->middleware('permission:Cursos,visualizar');
    Route::get('/cursos/{id}', [CursoController::class, 'show'])
        ->middleware('permission:Cursos,visualizar');
    
    // Crear, editar y eliminar cursos (solo administradores)
    Route::post('/cursos', [CursoController::class, 'store'])
        ->middleware('permission:Cursos,Básico'); // Mantener para admin
    Route::put('/cursos/{id}', [CursoController::class, 'update'])
        ->middleware('permission:Cursos,Básico'); // Mantener para admin
    Route::delete('/cursos/{id}', [CursoController::class, 'destroy'])
        ->middleware('permission:Cursos,Básico'); // Mantener para admin
    
    // Sesiones (solo administradores)
    Route::post('/cursos/{cursoID}/sesiones', [CursoController::class, 'crearSesion'])
        ->middleware('permission:Cursos,Básico');
    
    // Archivos (solo administradores)
    Route::post('/cursos/{cursoID}/archivos', [CursoController::class, 'subirArchivos'])
        ->middleware('permission:Cursos,Básico');
    Route::delete('/cursos/{cursoID}/archivos/{archivoID}', [CursoController::class, 'eliminarArchivo'])
        ->middleware('permission:Cursos,Básico');
    
    // Carrito (disponible para usuarios con permiso de visualizar)
    Route::get('/carrito', [CarritoController::class, 'index'])
        ->middleware('permission:Cursos,visualizar');
    Route::post('/carrito', [CarritoController::class, 'store'])
        ->middleware('permission:Cursos,visualizar');
    Route::delete('/carrito/{id}', [CarritoController::class, 'destroy'])
        ->middleware('permission:Cursos,visualizar');
    Route::post('/carrito/vaciar', [CarritoController::class, 'vaciar'])
        ->middleware('permission:Cursos,visualizar');
    
    // Matrículas (disponible para usuarios con permiso de visualizar)
    Route::get('/matriculas', [MatriculaController::class, 'index'])
        ->middleware('permission:Cursos,visualizar');
    Route::post('/matriculas', [MatriculaController::class, 'store'])
        ->middleware('permission:Cursos,visualizar');
    Route::get('/matriculas/verificar-acceso/{cursoID}', [MatriculaController::class, 'verificarAcceso'])
        ->middleware('permission:Cursos,visualizar');
    
    // Pagos (disponible para usuarios con permiso de visualizar)
    Route::get('/pagos', [PagoController::class, 'index'])
        ->middleware('permission:Cursos,visualizar');
    Route::post('/pagos/procesar', [PagoController::class, 'procesarPago'])
        ->middleware('permission:Cursos,visualizar');
    
    // Dashboard de Cursos (solo administradores)
    Route::get('/cursos/dashboard/kpis', [\App\Http\Controllers\Cursos\CursoDashboardController::class, 'getKPIs'])
        ->middleware('permission:Cursos,Dashboard');
    Route::get('/cursos/dashboard/list', [\App\Http\Controllers\Cursos\CursoDashboardController::class, 'getCursosList'])
        ->middleware('permission:Cursos,Dashboard');
    Route::get('/cursos/dashboard/resumen-nivel', [\App\Http\Controllers\Cursos\CursoDashboardController::class, 'getResumenPorNivel'])
        ->middleware('permission:Cursos,Dashboard');
    Route::get('/cursos/dashboard/ultimos-cursos', [\App\Http\Controllers\Cursos\CursoDashboardController::class, 'getUltimosCursos'])
        ->middleware('permission:Cursos,Dashboard');
    
    // Gestión de Metadatos (solo administradores)
    Route::get('/cursos/metadata', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'index'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::post('/cursos/metadata/software', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'createSoftware'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::put('/cursos/metadata/software/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'updateSoftware'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::delete('/cursos/metadata/software/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'deleteSoftware'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::post('/cursos/metadata/aplicacion', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'createAplicacion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::put('/cursos/metadata/aplicacion/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'updateAplicacion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::delete('/cursos/metadata/aplicacion/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'deleteAplicacion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::post('/cursos/metadata/nivel', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'createNivel'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::put('/cursos/metadata/nivel/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'updateNivel'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::delete('/cursos/metadata/nivel/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'deleteNivel'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::post('/cursos/metadata/produccion', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'createProduccion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::put('/cursos/metadata/produccion/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'updateProduccion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    Route::delete('/cursos/metadata/produccion/{id}', [\App\Http\Controllers\Cursos\CursoMetadataController::class, 'deleteProduccion'])
        ->middleware('permission:Cursos,Gestión de Metadatos');
    
    // Reportes de Contenido (solo administradores)
    Route::get('/cursos/reportes', [\App\Http\Controllers\Cursos\CursoReporteController::class, 'getReportes'])
        ->middleware('permission:Cursos,Reportes de Contenido');
    Route::get('/cursos/reportes/{cursoID}/analiticas', [\App\Http\Controllers\Cursos\CursoReporteController::class, 'getAnaliticasCurso'])
        ->middleware('permission:Cursos,Reportes de Contenido');

    // 📍 PERMISOS
    Route::get('permisos',       [PermisoController::class,'index']);
    Route::post('permisos',      [PermisoController::class,'store']);
    Route::put('permisos/{id}',  [PermisoController::class,'update']);
    Route::delete('permisos/{id}',[PermisoController::class,'destroy']);

    // 📍 ASIGNAR PERMISOS A ROL
    Route::post('roles/{rolID}/permisos/sync', [RoleController::class,'syncPermisos']);

    // Roles
    Route::get('/roles', [RoleController::class,'index']);
    Route::post('/roles', [RoleController::class,'store']);
    Route::get('/roles/{rolID}', [RoleController::class,'permisos']); // permisos de un rol
    Route::put('/roles/{rolID}', [RoleController::class,'update']);   // si implementas actualización
    Route::delete('/roles/{rolID}', [RoleController::class,'destroy']); // si implementas eliminación


    // Reset de contraseña desde seguridad (listado de usuarios)
    // Todos los usuarios pueden ver su propio usuario, admins ven todos
    // El controlador maneja la lógica de acceso según el rol
    Route::get('/admin/reset-password/users', [AdminResetPasswordController::class, 'index']);
    
    // Todos los usuarios pueden resetear su propia contraseña, admins pueden resetear cualquiera
    // El controlador maneja la lógica de acceso según el rol
    Route::post('/admin/reset-password/{userID}', [AdminResetPasswordController::class, 'resetPassword']);

    // Rutas del Estudiante - Perfil y Configuración
    Route::prefix('estudiante')->group(function () {
        Route::get('/perfil', [EstudiantePerfilController::class, 'getPerfil']);
        Route::put('/perfil', [EstudiantePerfilController::class, 'updatePerfil']);
        Route::post('/perfil/cambiar-contrasena', [EstudiantePerfilController::class, 'cambiarContrasena']);
        Route::put('/perfil/notificaciones', [EstudiantePerfilController::class, 'updateNotificaciones']);
    });

    /*
    |--------------------------------------------------------------------------
    | Inventario
    |--------------------------------------------------------------------------
    */
    Route::prefix('inventario')->group(function () {
        Route::get('/', [InventarioController::class, 'index'])
            ->middleware('permission:Inventario,listar');
        Route::get('/categorias', [InventarioController::class, 'categorias'])
            ->middleware('permission:Inventario,listar');
        Route::post('/', [InventarioController::class, 'store'])
            ->middleware('permission:Inventario,crear');
        Route::get('/{id}', [InventarioController::class, 'show'])
            ->middleware('permission:Inventario,listar');
        Route::put('/{id}', [InventarioController::class, 'update'])
            ->middleware('permission:Inventario,editar');
        Route::post('/movimiento', [InventarioController::class, 'movimiento'])
            ->middleware('permission:Inventario,editar');
        Route::get('/{id}/movimientos', [InventarioController::class, 'movimientos'])
            ->middleware('permission:Inventario,listar');
    });

    /*
    |--------------------------------------------------------------------------
    | Producción
    |--------------------------------------------------------------------------
    */
    Route::prefix('produccion')->group(function () {
        Route::get('/', [ProduccionController::class, 'index'])
            ->middleware('permission:Producción,listar');
        Route::post('/', [ProduccionController::class, 'store'])
            ->middleware('permission:Producción,crear');
        Route::get('/{id}', [ProduccionController::class, 'show'])
            ->middleware('permission:Producción,listar');
        Route::post('/{id}/procesar', [ProduccionController::class, 'procesar'])
            ->middleware('permission:Producción,editar');
        Route::post('/{id}/cancelar', [ProduccionController::class, 'cancelar'])
            ->middleware('permission:Producción,editar');
    });




});
