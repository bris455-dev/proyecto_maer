<?php

namespace App\DTOs\Auth;

class MFADTO
{
    public int $user_id;
    public string $code;

    public function __construct(array $data)
    {
        $this->user_id = (int) ($data['user_id'] ?? 0);
        $this->code = $data['code'] ?? '';
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->user_id,
            'code' => $this->code,
        ];
    }
}
