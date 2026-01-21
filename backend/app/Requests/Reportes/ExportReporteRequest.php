<?php

namespace App\Requests\Reportes;

use Illuminate\Foundation\Http\FormRequest;

class ExportReporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'clienteID' => 'nullable|integer',
            'empleadoID' => 'nullable|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'fecha_inicio.date' => 'La fecha de inicio debe ser una fecha válida',
            'fecha_fin.date' => 'La fecha fin debe ser una fecha válida',
            'clienteID.integer' => 'El ID del cliente debe ser un número entero',
            'empleadoID.integer' => 'El ID del empleado debe ser un número entero',
        ];
    }
}

