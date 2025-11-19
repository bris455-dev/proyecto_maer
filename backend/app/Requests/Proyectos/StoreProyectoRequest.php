<?php

namespace App\Requests\Proyectos;

use Illuminate\Foundation\Http\FormRequest;

class StoreProyectoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // control de permisos a nivel middleware
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:120',
            'numero_proyecto' => 'nullable|string|max:20',
            'clienteID' => 'nullable|integer|exists:cliente,clienteID',
            'empleadoID' => 'nullable|integer|exists:empleado,empleadoID',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'fecha_entrega' => 'nullable|date',
            'notas' => 'nullable|string',
            'estado' => 'nullable|integer',
            'detalles' => 'nullable|array',
            'detalles.*.pieza' => 'required_with:detalles|string',
            'detalles.*.tratamientoID' => 'required_with:detalles|integer|exists:tratamiento,tratamientoID',
            'detalles.*.precio' => 'nullable|numeric',
            'detalles.*.color' => 'nullable|string|max:50',
            'images' => 'nullable|array',          // ahora no obligatorio
            'images.*' => 'nullable|file|mimes:jpg,jpeg,png', // valida solo si se envían
        ];
    }
}
