<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Restablecer tu contraseña - MAER</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px;">
    <div style="max-width: 600px; background-color: #fff; margin: auto; padding: 30px; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Solicitud de Restablecimiento de Contraseña</h2>

        <p>Hola,</p>

        <p>Hemos recibido una solicitud para restablecer tu contraseña en la <strong>Plataforma MAER</strong>.</p>

        <p>Tu código de restablecimiento es:</p>

        <p style="text-align: center; font-size: 26px; font-weight: bold; color: #2c3e50;">
            {{ $codigo }}
        </p>

        <p>Este código tiene una validez de <strong>30 minutos</strong>.</p>

        <p>Si tú no realizaste esta solicitud, puedes ignorar este correo.</p>

        <p style="margin-top: 40px; color: #888; font-size: 14px;">— Equipo de Seguridad MAER</p>
    </div>
</body>
</html>
