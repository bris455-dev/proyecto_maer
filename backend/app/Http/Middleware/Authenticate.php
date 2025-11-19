<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // Si es una petición API, no redirigir, simplemente devolver 401
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // Para peticiones web normales, puede redirigir a login
        return route('login');
    }
}
