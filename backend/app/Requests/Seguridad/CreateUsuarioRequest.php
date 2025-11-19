<?php

namespace App\Requests\Seguridad;

use Illuminate\Foundation\Http\FormRequest;

class CreateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|in:empleado,cliente',

            // Común
            'email' => 'required|email|unique:usuarios,email',
            'rolID' => 'required|integer',

            // Campos para EMPLEADO
            'nombre' => 'required_if:tipo,empleado|string',
            'dni'    => 'required_if:tipo,empleado|string',
            'cargo'  => 'required_if:tipo,empleado|string',

            // Campos para CLIENTE
            'nombre_cliente' => 'required_if:tipo,cliente|string',
            'dni_ruc'        => 'required_if:tipo,cliente|string',
            'direccion'      => 'required_if:tipo,cliente|string',
            'pais'           => 'required_if:tipo,cliente|string',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required_if' => 'El nombre del empleado es obligatorio.',
            'dni.required_if' => 'El DNI del empleado es obligatorio.',
            'cargo.required_if' => 'El cargo del empleado es obligatorio.',

            'nombre_cliente.required_if' => 'El nombre del cliente es obligatorio.',
            'dni_ruc.required_if' => 'El DNI/RUC del cliente es obligatorio.',
            'direccion.required_if' => 'La dirección del cliente es obligatoria.',
            'pais.required_if' => 'El país del cliente es obligatorio.',
        ];
    }
}
