#!/bin/bash
echo "Ejecutando migraciones de Cursos solamente..."
echo

php artisan migrate --path=database/migrations/2025_12_20_000007_create_cursos_table.php
php artisan migrate --path=database/migrations/2025_12_20_000008_create_curso_sesiones_table.php
php artisan migrate --path=database/migrations/2025_12_20_000009_create_curso_archivos_table.php
php artisan migrate --path=database/migrations/2025_12_20_000010_create_matriculas_table.php
php artisan migrate --path=database/migrations/2025_12_20_000011_create_pagos_table.php
php artisan migrate --path=database/migrations/2025_12_20_000012_create_carrito_table.php
php artisan migrate --path=database/migrations/2025_12_20_000013_create_rol_estudiante_and_permisos.php

echo
echo "Migraciones de Cursos completadas!"

