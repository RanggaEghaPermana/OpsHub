@php
    $language = $language ?? 'id';
    $isEnglish = $language === 'en';
    $copy = [
        'cashier' => $isEnglish ? 'Cashier' : 'Kasir',
        'change' => $isEnglish ? 'Change' : 'Kembalian',
        'customer' => $isEnglish ? 'Customer' : 'Pelanggan',
        'discount' => $isEnglish ? 'Discount' : 'Diskon',
        'footer' => $isEnglish
            ? 'This invoice was generated automatically by OpsHub. Keep this document as proof of transaction.'
            : 'Invoice ini dibuat otomatis oleh OpsHub. Simpan dokumen ini sebagai bukti transaksi.',
        'invoiceTitle' => $isEnglish ? 'Sales Invoice' : 'Invoice Penjualan',
        'notes' => $isEnglish ? 'Notes' : 'Catatan',
        'paidAmount' => $isEnglish ? 'Paid' : 'Dibayar',
        'payment' => $isEnglish ? 'Payment' : 'Pembayaran',
        'price' => $isEnglish ? 'Price' : 'Harga',
        'product' => $isEnglish ? 'Product' : 'Produk',
        'subtotal' => 'Subtotal',
        'tax' => $isEnglish ? 'Tax' : 'Pajak',
        'total' => 'Total',
        'walkInCustomer' => $isEnglish ? 'Walk-in customer' : 'Pelanggan umum',
    ];
    $money = fn ($value) => 'Rp '.number_format((float) $value, 0, ',', '.');
    $statusLabels = $isEnglish
        ? [
            'paid' => 'Paid',
            'partial' => 'Partial',
            'unpaid' => 'Unpaid',
            'refunded' => 'Refunded',
        ]
        : [
            'paid' => 'Lunas',
            'partial' => 'Sebagian',
            'unpaid' => 'Belum dibayar',
            'refunded' => 'Dikembalikan',
        ];
    $methodLabels = $isEnglish
        ? [
            'cash' => 'Cash',
            'transfer' => 'Transfer',
            'qris' => 'QRIS',
            'card' => 'Card',
        ]
        : [
            'cash' => 'Tunai',
            'transfer' => 'Transfer',
            'qris' => 'QRIS',
            'card' => 'Kartu',
        ];
    $paymentStatus = $statusLabels[$sale->payment_status] ?? $sale->payment_status;
    $paymentMethod = $methodLabels[$sale->payment_method] ?? strtoupper($sale->payment_method);
    $saleDate = $isEnglish
        ? $sale->sale_date->format('M d, Y H:i')
        : $sale->sale_date->format('d/m/Y H:i');
@endphp
<!doctype html>
<html lang="{{ $language }}">
<head>
    <meta charset="utf-8">
    <title>{{ $sale->invoice_number }}</title>
    <style>
        @page { margin: 28px; }
        body {
            background: #f4f9ff;
            color: #0f213d;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.45;
        }
        .page {
            background: #ffffff;
            border-top: 5px solid #0b78e3;
            padding: 26px 28px 22px;
        }
        table { border-collapse: collapse; width: 100%; }
        .header { margin-bottom: 24px; }
        .header td { border: 0; padding: 0; vertical-align: top; }
        .logo { height: 42px; width: auto; }
        .brand-fallback { color: #0f213d; font-size: 24px; font-weight: 700; margin: 0; }
        .tagline {
            color: #607797;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 3px;
            margin-top: 8px;
            text-transform: uppercase;
        }
        .invoice-title {
            color: #0f213d;
            font-size: 23px;
            font-weight: 700;
            margin: 0 0 7px;
            text-align: right;
        }
        .invoice-number {
            color: #0757c9;
            font-size: 12px;
            font-weight: 700;
            text-align: right;
        }
        .pill {
            background: #e8f3ff;
            border: 1px solid #cfe4fb;
            color: #0757c9;
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            margin-top: 9px;
            padding: 5px 10px;
            text-transform: uppercase;
        }
        .muted { color: #607797; }
        .section-table { margin-bottom: 18px; }
        .section-table td {
            background: #f7fbff;
            border: 1px solid #d8e6f6;
            padding: 13px 14px;
            vertical-align: top;
            width: 50%;
        }
        .section-table .gap { background: transparent; border: 0; width: 16px; }
        .label {
            color: #607797;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .value { color: #0f213d; font-size: 13px; font-weight: 700; }
        .items th {
            background: #e8f3ff;
            border-bottom: 1px solid #cfe4fb;
            color: #23466f;
            font-size: 10px;
            letter-spacing: .7px;
            padding: 10px 8px;
            text-align: left;
            text-transform: uppercase;
        }
        .items td {
            border-bottom: 1px solid #edf4fb;
            padding: 11px 8px;
            vertical-align: top;
        }
        .items {
            table-layout: fixed;
        }
        .col-product { width: 38%; }
        .col-qty { width: 10%; }
        .col-price { width: 18%; }
        .col-discount { width: 16%; }
        .col-total { width: 18%; }
        .right { text-align: right; }
        .amount, .qty {
            white-space: nowrap;
        }
        .product-name { color: #0f213d; font-weight: 700; }
        .product-sku {
            color: #607797;
            font-size: 11px;
            margin-top: 3px;
            word-break: break-word;
        }
        .totals {
            margin-left: auto;
            margin-top: 18px;
            width: 330px;
        }
        .totals td {
            border: 0;
            color: #607797;
            padding: 6px 0;
        }
        .totals .amount { color: #0f213d; font-weight: 700; text-align: right; }
        .totals .grand td {
            background: #0b78e3;
            color: #ffffff;
            font-size: 15px;
            font-weight: 700;
            padding: 11px 12px;
        }
        .totals .grand .amount { color: #ffffff; }
        .totals .change .amount { color: #047857; }
        .notes {
            background: #f7fbff;
            border-left: 4px solid #38bdf8;
            color: #23466f;
            margin-top: 20px;
            padding: 11px 13px;
        }
        .footer {
            border-top: 1px solid #d8e6f6;
            color: #607797;
            font-size: 10px;
            margin-top: 28px;
            padding-top: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="page">
        <table class="header">
            <tr>
                <td>
                    @if ($logoData)
                        <img class="logo" src="{{ $logoData }}" alt="OpsHub">
                    @else
                        <p class="brand-fallback">OpsHub</p>
                    @endif
                    <div class="tagline">manage track grow</div>
                </td>
                <td class="right">
                    <h1 class="invoice-title">{{ $copy['invoiceTitle'] }}</h1>
                    <div class="invoice-number">{{ $sale->invoice_number }}</div>
                    <div class="muted">{{ $saleDate }}</div>
                    <span class="pill">{{ $paymentStatus }}</span>
                </td>
            </tr>
        </table>

        <table class="section-table">
            <tr>
                <td>
                    <div class="label">{{ $copy['customer'] }}</div>
                    <div class="value">{{ $sale->customer?->name ?? $copy['walkInCustomer'] }}</div>
                    <div class="muted">{{ $sale->customer?->phone ?? '-' }}</div>
                </td>
                <td class="gap"></td>
                <td>
                    <div class="label">{{ $copy['payment'] }}</div>
                    <div class="value">{{ $paymentMethod }}</div>
                    <div class="muted">{{ $copy['cashier'] }}: {{ $sale->user?->name ?? '-' }}</div>
                </td>
            </tr>
        </table>

        <table class="items">
            <colgroup>
                <col class="col-product">
                <col class="col-qty">
                <col class="col-price">
                <col class="col-discount">
                <col class="col-total">
            </colgroup>
            <thead>
                <tr>
                    <th>{{ $copy['product'] }}</th>
                    <th class="right">Qty</th>
                    <th class="right">{{ $copy['price'] }}</th>
                    <th class="right">{{ $copy['discount'] }}</th>
                    <th class="right">{{ $copy['total'] }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sale->items as $item)
                    <tr>
                        <td>
                            <div class="product-name">{{ $item->product_name }}</div>
                            <div class="product-sku">{{ $item->product_sku }}</div>
                        </td>
                        <td class="right qty">{{ $item->quantity }}</td>
                        <td class="right amount">{{ $money($item->unit_price) }}</td>
                        <td class="right amount">{{ $money($item->discount_amount) }}</td>
                        <td class="right amount">{{ $money($item->line_total) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <table class="totals">
            <tr>
                <td>{{ $copy['subtotal'] }}</td>
                <td class="amount">{{ $money($sale->subtotal) }}</td>
            </tr>
            <tr>
                <td>{{ $copy['discount'] }}</td>
                <td class="amount">{{ $money($sale->discount_amount) }}</td>
            </tr>
            <tr>
                <td>{{ $copy['tax'] }}</td>
                <td class="amount">{{ $money($sale->tax_amount) }}</td>
            </tr>
            <tr class="grand">
                <td>{{ $copy['total'] }}</td>
                <td class="amount">{{ $money($sale->grand_total) }}</td>
            </tr>
            <tr>
                <td>{{ $copy['paidAmount'] }}</td>
                <td class="amount">{{ $money($sale->paid_amount) }}</td>
            </tr>
            <tr class="change">
                <td>{{ $copy['change'] }}</td>
                <td class="amount">{{ $money($sale->change_amount) }}</td>
            </tr>
        </table>

        @if ($sale->notes)
            <div class="notes"><strong>{{ $copy['notes'] }}:</strong> {{ $sale->notes }}</div>
        @endif

        <div class="footer">
            {{ $copy['footer'] }}
        </div>
    </div>
</body>
</html>
