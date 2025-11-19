<?php

namespace App\Requests\Proyectos;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProyectoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'sometimes|string|max:120',
            'numero_proyecto' => 'sometimes|nullable|string|max:20',
            'clienteID' => 'sometimes|nullable|integer|exists:cliente,clienteID',
            'empleadoID' => 'sometimes|nullable|integer|exists:empleado,empleadoID',
            'fecha_inicio' => 'sometimes|nullable|date',
            'fecha_fin' => 'sometimes|nullable|date',
            'fecha_entrega' => 'sometimes|nullable|date',
            'notas' => 'sometimes|nullable|string',
            'estado' => 'sometimes|nullable|integer',
            'detalles' => 'sometimes|nullable|array',
            'detalles.*.pieza' => 'required_with:detalles|string',
            'detalles.*.tratamientoID' => 'required_with:detalles|integer|exists:tratamiento,tratamientoID',
            'detalles.*.precio' => 'nullable|numeric',
            'detalles.*.color' => 'nullable|string|max:50',
            'images' => 'sometimes|nullable|array',          // ahora no obligatorio
            'images.*' => 'nullable|file|mimes:jpg,jpeg,png', // valida solo si se envían
        ];
    }
}
