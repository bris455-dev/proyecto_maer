<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Services\MFAService;
use App\Services\BitacoraService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MFAServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_and_verify_mfa_code()
    {
        $user = User::factory()->create([
            'email' => 'usuario@test.com'
        ]);

        $bitacora = $this->createMock(BitacoraService::class);
        $bitacora->method('registrar')->willReturn(true);

        $service = new MFAService($bitacora);

        // Generar código MFA
        $resultGen = $service->generateAndSendCode($user, '127.0.0.1');
        $this->assertTrue($resultGen['success']);

        // Verificar código MFA
        $code = $user->fresh()->mfa_code;
        $resultVerif = $service->verifyCode($user, $code, '127.0.0.1');

        $this->assertTrue($resultVerif['success']);
        $this->assertEquals('MFA verificado correctamente.', $resultVerif['message']);
    }
}
