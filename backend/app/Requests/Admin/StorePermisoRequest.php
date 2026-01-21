<?php

namespace App\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermisoRequest extends FormRequest
{
    public function rules()
    {
        return [
            'nombreModulo'     => 'required|string|max:100',
            'nombreSubmodulo'  => 'required|string|max:150',
        ];
    }
}
