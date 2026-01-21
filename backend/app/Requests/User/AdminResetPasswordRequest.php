<?php

namespace App\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use App\Helpers\RoleHelper;

class AdminResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && RoleHelper::isAdmin($user); // Solo administradores
    }

    public function rules(): array
    {
        return [
            // Puede enviar email o nombre para buscar
            'email' => ['nullable', 'email', 'required_without:name'],
            'name'  => ['nullable', 'string', 'required_without:email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'El correo debe ser válido.',
            'email.required_without' => 'Debe proporcionar el correo o el nombre del usuario.',
            'name.required_without' => 'Debe proporcionar el nombre o el correo del usuario.',
        ];
    }
}
