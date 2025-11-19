<?php

namespace App\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // ID del usuario que se está actualizando
        $userId = $this->route('id') ?? null;

        return [
            'nombre' => 'sometimes|string|max:100',

            // Validar email ignorando al usuario actual
            'email' => [
                'sometimes',
                'email',
                Rule::unique('usuarios', 'email')->ignore($userId, 'id'),
            ],

            'rolID'     => 'sometimes|integer|min:1',
            'is_locked' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Ya existe otro usuario con este correo.',
        ];
    }
}
