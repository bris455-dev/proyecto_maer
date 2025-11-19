<?php

namespace App\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RoleRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'user_id' => 'required|integer|exists:usuarios,id',
            'rolID' => 'required|integer|min:1',
        ];
    }

    public function messages()
    {
        return [
            'user_id.required' => 'El ID del usuario es obligatorio.',
            'rolID.required' => 'Debe indicar un rol válido.',
        ];
    }
}
