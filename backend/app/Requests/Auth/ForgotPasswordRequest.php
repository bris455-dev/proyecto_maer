<?php

namespace App\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    /**
     * 🔒 Autoriza la solicitud.
     * Cualquier usuario puede solicitar un restablecimiento de contraseña.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 📋 Reglas de validación para la solicitud de restablecimiento de contraseña.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:usuarios,email'],
        ];
    }

    /**
     * 💬 Mensajes personalizados para errores de validación.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Debe ingresar un correo electrónico válido.',
            'email.exists' => 'No existe ninguna cuenta registrada con este correo electrónico.',
        ];
    }
}
