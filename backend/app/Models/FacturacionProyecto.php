<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacturacionProyecto extends Model
{
    protected $table = 'facturacion_proyectos';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'facturacionID',
        'proyectoID',
    ];

    /**
     * Relación con facturación
     */
    public function facturacion()
    {
        return $this->belongsTo(Facturacion::class, 'facturacionID', 'facturacionID');
    }

    /**
     * Relación con proyecto
     */
    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'proyectoID', 'proyectoID');
    }
}

