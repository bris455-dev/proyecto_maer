<?php

namespace App\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermisoRequest extends FormRequest
{
    public function rules()
    {
        return [
            'nombreModulo'     => 'sometimes|string|max:100',
            'nombreSubmodulo'  => 'sometimes|string|max:150',
        ];
    }
}
