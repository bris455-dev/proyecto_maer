<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordCode extends Mailable
{
    use Queueable, SerializesModels;

    public $codigo;

    public function __construct($codigo)
    {
        $this->codigo = $codigo;
    }

    public function build()
    {
        return $this->subject('Restablecimiento de Contraseña - MAER')
                    ->view('emails.resetPasswordCode')
                    ->with(['codigo' => $this->codigo]);
    }
}
