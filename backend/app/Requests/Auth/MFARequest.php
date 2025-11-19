<?php

namespace App\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class MFARequest extends FormRequest
{
    /**
     * 🔒 Autoriza la solicitud.
     * Permite que cualquier usuario complete la verificación MFA.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 📋 Reglas de validación para la verificación MFA.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:usuarios,email'],
            'mfa_code' => ['required', 'digits:6'],
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
            'email.exists' => 'El correo electrónico no se encuentra registrado.',
            'mfa_code.required' => 'Debe ingresar el código MFA.',
            'mfa_code.digits' => 'El código MFA debe tener exactamente 6 dígitos.',
        ];
    }
}

