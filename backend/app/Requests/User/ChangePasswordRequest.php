<?php

namespace App\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],

            // Nueva contraseña
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],

            // Confirmación (new_password_confirmation)
            'new_password_confirmation' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Debe ingresar su contraseña actual.',
            'new_password.required' => 'Debe ingresar una nueva contraseña.',
            'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'new_password.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
            'new_password_confirmation.required' => 'Debe confirmar su nueva contraseña.',
        ];
    }
}
