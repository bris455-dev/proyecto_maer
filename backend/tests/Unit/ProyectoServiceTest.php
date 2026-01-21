<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Proyecto;
use App\Models\Tratamiento;
use App\Services\ProyectoService;
use App\Services\BitacoraService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProyectoServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_project_with_details()
    {
        $user = User::factory()->create();
        $tratamiento = Tratamiento::factory()->create(['nombre' => 'encerado']);

        $bitacora = $this->createMock(BitacoraService::class);
        $bitacora->method('registrar')->willReturn(true);

        $service = new ProyectoService($bitacora);

        $data = [
            'nombre' => 'Proyecto Test',
            'detalles' => [
                ['pieza' => 'Pieza1', 'tratamientoID' => $tratamiento->id, 'color' => 'Blanco']
            ]
        ];

        $result = $service->create($data, $user, '127.0.0.1');

        $this->assertTrue($result['success']);
        $this->assertEquals('Proyecto Test', $result['data']->nombre);
        $this->assertEquals(8.0, $result['data']->total); // precio de encerado
    }
}
