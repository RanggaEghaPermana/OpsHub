<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = [
        'store_name',
        'phone',
        'address',
        'default_tax_rate',
        'invoice_prefix',
        'logo_path',
    ];

    protected $casts = [
        'default_tax_rate' => 'decimal:2',
    ];
}
