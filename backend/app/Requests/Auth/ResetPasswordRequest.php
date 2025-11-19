<?php

namespace App\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * 🔒 Autoriza la solicitud.
     * Permite que cualquier usuario intente restablecer su contraseña.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 📋 Reglas de validación para el restablecimiento de contraseña.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:usuarios,email'],
            'token' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * 💬 Mensajes personalizados para los errores de validación.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Debe ingresar un correo electrónico válido.',
            'email.exists' => 'El correo electrónico no se encuentra registrado.',
            
            'token.required' => 'El token de restablecimiento es obligatorio.',
            'token.string' => 'El token debe ser una cadena de texto válida.',
            
            'new_password.required' => 'Debe ingresar una nueva contraseña.',
            'new_password.string' => 'La contraseña debe ser una cadena de texto.',
            'new_password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'new_password.confirmed' => 'La confirmación de la contraseña no coincide.',
        ];
    }
}

