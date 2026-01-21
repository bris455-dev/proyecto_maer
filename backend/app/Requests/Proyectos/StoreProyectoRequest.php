<?php

namespace App\Requests\Proyectos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class StoreProyectoRequest extends FormRequest
{
    public function authorize(): bool
    {
        Log::info("🔐 StoreProyectoRequest::authorize - Verificando autorización");
        return true; // control de permisos a nivel middleware
    }

    /**
     * Preparar datos para validación
     * Si viene FormData con campo 'data', decodificar el JSON y mergearlo
     */
    protected function prepareForValidation(): void
    {
        // Si viene FormData con campo 'data', decodificar el JSON y mergearlo
        if ($this->has('data') && is_string($this->input('data'))) {
            $data = json_decode($this->input('data'), true);
            if (is_array($data)) {
                Log::info("📦 StoreProyectoRequest - Decodificando FormData. Campos: " . json_encode(array_keys($data)));
                // Mergear los datos del JSON al request
                $this->merge($data);
            }
        }
    }

    public function rules(): array
    {
        Log::info("📋 StoreProyectoRequest::rules - Aplicando reglas de validación");
        Log::info("📋 StoreProyectoRequest - Datos recibidos: " . json_encode($this->all()));
        
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
            'tipificacion' => 'nullable|string|in:Pendiente,En Proceso,En HTML,Observado,Devuelto,Aprobado',
            'detalles' => 'nullable|array',
            'detalles.*.pieza' => 'required_with:detalles|string',
            'detalles.*.tratamientoID' => 'required_with:detalles|integer|exists:tratamiento,tratamientoID',
            'detalles.*.precio' => 'nullable|numeric',
            'detalles.*.color' => 'nullable|string|max:50',
            'images' => 'nullable|array',          // ahora no obligatorio
            'images.*' => 'nullable|file|max:10240', // acepta cualquier tipo de archivo, máximo 10MB
            'archivos_iniciales' => 'nullable|array', // Para rutas temporales
            'archivos_iniciales.*' => 'nullable|string',
        ];
    }
    
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        Log::error("❌ StoreProyectoRequest - Validación fallida");
        Log::error("❌ Errores: " . json_encode($validator->errors()->toArray()));
        Log::error("❌ Datos recibidos: " . json_encode($this->all()));
        parent::failedValidation($validator);
    }
}
