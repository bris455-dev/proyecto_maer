<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_mfa_code_exitoso()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'mfa_code' => '123456',
            'mfa_expires_at' => now()->addMinutes(5),
        ]);

        $service = new AuthService();

        $result = $service->verifyMfaCode([
            'email' => 'test@example.com',
            'mfa_code' => '123456'
        ], '127.0.0.1');

        $this->assertTrue($result['success']);
        $this->assertEquals('Inicio de sesión exitoso.', $result['message']);
    }
}
