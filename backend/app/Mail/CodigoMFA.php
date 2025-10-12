<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CodigoMFA extends Mailable
{
    use Queueable, SerializesModels;

    public $codigo;

    public function __construct($codigo)
    {
        $this->codigo = $codigo;
    }

    // Aquí va la línea que preguntaste
    public function build()
    {
        return $this->subject('Código MFA MAER')   // Asunto del correo
                    ->view('emails.codigoMFA')    // Nombre de la vista que creaste
                    ->with(['codigo' => $this->codigo]); // Datos que se pasan a la vista
    }
}
