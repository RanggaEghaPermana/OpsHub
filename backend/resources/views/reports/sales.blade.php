<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        @page { margin: 24px; }
        body {
            background: #f4f9ff;
            color: #0f213d;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.45;
        }
        .page {
            background: #ffffff;
            border-top: 5px solid #0b78e3;
            padding: 24px 26px 20px;
        }
        .header {
            margin-bottom: 22px;
            width: 100%;
        }
        .header td {
            vertical-align: top;
        }
        .logo {
            height: 38px;
            width: auto;
        }
        h1 {
            font-size: 22px;
            margin: 0 0 7px;
            text-align: right;
        }
        .muted {
            color: #607797;
        }
        .right {
            text-align: right;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        .sales th {
            background: #e8f3ff;
            color: #23466f;
            font-size: 9px;
            letter-spacing: .7px;
            padding: 9px 7px;
            text-align: left;
            text-transform: uppercase;
        }
        .sales td {
            border-bottom: 1px solid #edf4fb;
            padding: 9px 7px;
        }
        .total {
            color: #0757c9;
            font-weight: 700;
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
                        <strong>OpsHub</strong>
                    @endif
                    <div class="muted">manage track grow</div>
                </td>
                <td>
                    <h1>Laporan Penjualan</h1>
                    <div class="muted right">{{ $dateFrom }} - {{ $dateTo }}</div>
                    <div class="right total">Rp {{ number_format((float) $sales->sum('grand_total'), 0, ',', '.') }}</div>
                </td>
            </tr>
        </table>
        <table class="sales">
            <thead>
                <tr>
                    <th>Faktur</th>
                    <th>Tanggal</th>
                    <th>Pelanggan</th>
                    <th>Kasir</th>
                    <th class="right">Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sales as $sale)
                    <tr>
                        <td>{{ $sale->invoice_number }}</td>
                        <td>{{ $sale->sale_date->format('d/m/Y H:i') }}</td>
                        <td>{{ $sale->customer?->name ?? 'Pelanggan umum' }}</td>
                        <td>{{ $sale->user?->name ?? '-' }}</td>
                        <td class="right">Rp {{ number_format((float) $sale->grand_total, 0, ',', '.') }}</td>
                        <td>{{ $sale->payment_status }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>
