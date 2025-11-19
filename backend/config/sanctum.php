<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | 🚫 No usamos dominios stateful porque el frontend (React) y backend (Laravel)
    | se comunican únicamente mediante tokens personales (Bearer).
    | Esto evita el uso de cookies y el problema del token CSRF.
    |
    */

    'stateful' => [],

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | Solo dejamos el guard "web" activo por compatibilidad,
    | aunque las rutas protegidas usan auth:sanctum.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | Define el tiempo de expiración de los tokens personales.
    | Si quieres que el token no expire automáticamente, usa null.
    |
    | Ejemplo:
    | - 30  → expira en 30 minutos
    | - null → no expira automáticamente
    |
    */

    'expiration' => 30,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | Aquí definimos los middlewares usados para cookies y CSRF.
    | Como tu API trabaja con tokens Bearer, deshabilitamos ambos.
    |
    */

    'middleware' => [
        // ❌ No necesitamos cookies ni CSRF para tokens personales
        // 'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        // 'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
