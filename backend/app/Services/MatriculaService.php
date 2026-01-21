<?php

namespace App\Services;

use App\Models\Matricula;
use App\Models\Curso;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MatriculaService
{
    /**
     * Verificar si usuario está matriculado y tiene acceso
     */
    public function tieneAcceso(int $cursoID, int $usuarioID): bool
    {
        try {
            $matricula = Matricula::where('cursoID', $cursoID)
                ->where('usuarioID', $usuarioID)
                ->where('estado', 'Pagado')
                ->first();

            if (!$matricula) {
                return false;
            }

            // Verificar si no ha expirado
            if ($matricula->fecha_expiracion && $matricula->fecha_expiracion < now()->toDateString()) {
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("Error MatriculaService@tieneAcceso: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Crear matrícula
     */
    public function create(int $cursoID, int $usuarioID, array $data = []): array
    {
        DB::beginTransaction();
        try {
            $curso = Curso::find($cursoID);
            
            if (!$curso) {
                return [
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ];
            }

            // Verificar si ya está matriculado
            $matriculaExistente = Matricula::where('cursoID', $cursoID)
                ->where('usuarioID', $usuarioID)
                ->first();

            if ($matriculaExistente) {
                return [
                    'success' => false,
                    'message' => 'Ya está matriculado en este curso',
                    'data' => $matriculaExistente
                ];
            }

            $matricula = Matricula::create([
                'cursoID' => $cursoID,
                'usuarioID' => $usuarioID,
                'estado' => 'Pendiente',
                'precio_pagado' => $curso->precio,
                'fecha_matricula' => now()->toDateString(),
                'fecha_expiracion' => isset($data['fecha_expiracion']) ? $data['fecha_expiracion'] : null,
                'notas' => $data['notas'] ?? null,
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => $matricula->load(['curso', 'usuario'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error MatriculaService@create: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear matrícula: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar estado de matrícula
     */
    public function updateEstado(int $matriculaID, string $nuevoEstado): array
    {
        DB::beginTransaction();
        try {
            $matricula = Matricula::find($matriculaID);
            
            if (!$matricula) {
                return [
                    'success' => false,
                    'message' => 'Matrícula no encontrada'
                ];
            }

            $matricula->estado = $nuevoEstado;
            if ($nuevoEstado === 'Pagado' && !$matricula->fecha_matricula) {
                $matricula->fecha_matricula = now()->toDateString();
            }
            $matricula->save();

            DB::commit();

            return [
                'success' => true,
                'data' => $matricula->load(['curso', 'usuario'])
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error MatriculaService@updateEstado: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar estado: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener matrículas del usuario con información completa del curso
     */
    public function getByUsuario(int $usuarioID): array
    {
        try {
            $matriculas = Matricula::with([
                'curso.sesiones.archivos',
                'curso.archivos',
                'pagos'
            ])
                ->where('usuarioID', $usuarioID)
                ->orderBy('created_at', 'desc')
                ->get();

            return [
                'success' => true,
                'data' => $matriculas
            ];
        } catch (\Throwable $e) {
            Log::error("Error MatriculaService@getByUsuario: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener matrículas: ' . $e->getMessage()
            ];
        }
    }
}

