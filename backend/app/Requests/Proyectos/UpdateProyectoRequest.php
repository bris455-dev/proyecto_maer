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
            'tipificacion' => 'sometimes|nullable|string|in:Pendiente,En Proceso,En HTML,Observado,Devuelto,Aprobado',
            'nueva_nota' => 'sometimes|nullable|string',
            'archivos_nota' => 'sometimes|nullable|array',
            'detalles' => 'sometimes|nullable|array',
            'detalles.*.pieza' => 'required_with:detalles|string',
            'detalles.*.tratamientoID' => 'required_with:detalles|integer|exists:tratamiento,tratamientoID',
            'detalles.*.precio' => 'nullable|numeric',
            'detalles.*.color' => 'nullable|string|max:50',
            'images' => 'sometimes|nullable|array',          // ahora no obligatorio
            'images.*' => 'nullable|file|max:10240', // acepta cualquier tipo de archivo, máximo 10MB
        ];
    }
    
    protected function prepareForValidation()
    {
        // Si viene data como JSON string en FormData, parsearlo
        if ($this->has('data') && is_string($this->input('data'))) {
            $data = json_decode($this->input('data'), true);
            if (is_array($data)) {
                \Log::info("📋 UpdateProyectoRequest - Parseando FormData. nueva_nota: " . ($data['nueva_nota'] ?? 'NO EXISTE'));
                $this->merge($data);
            }
        } else {
            // Si viene como JSON normal, también loguear
            \Log::info("📋 UpdateProyectoRequest - Datos JSON normales. nueva_nota: " . ($this->input('nueva_nota') ?? 'NO EXISTE'));
        }
    }
}
