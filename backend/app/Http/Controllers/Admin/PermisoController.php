<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Requests\StorePermisoRequest;
use App\Requests\UpdatePermisoRequest;
use App\Services\PermisoService;

class PermisoController extends Controller
{
    protected $service;

    public function __construct(PermisoService $service)
    {
        $this->service = $service;
    }

    /** 🟢 GET: /api/permisos */
    public function index()
    {
        return response()->json([
            'status'=>'success',
            'data'=>$this->service->getAll()
        ]);
    }

    /** 🟢 POST: /api/permisos */
    public function store(StorePermisoRequest $request)
    {
        $result = $this->service->create($request->validated());
        return response()->json($result,$result['success']?201:400);
    }

    /** 🟡 PUT: /api/permisos/{id} */
    public function update(UpdatePermisoRequest $request,$id)
    {
        $result = $this->service->update($id,$request->validated());
        return response()->json($result,$result['success']?200:400);
    }

    /** 🔴 DELETE: /api/permisos/{id} */
    public function destroy($id)
    {
        $result = $this->service->delete($id);
        return response()->json($result,$result['success']?200:400);
    }
}
