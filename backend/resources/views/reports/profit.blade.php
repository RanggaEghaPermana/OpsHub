<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Laba Rugi</title>
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
        .header {
            margin-bottom: 24px;
            width: 100%;
        }
        .header td {
            vertical-align: top;
        }
        .logo {
            height: 42px;
            width: auto;
        }
        h1 {
            font-size: 23px;
            margin: 0 0 7px;
            text-align: right;
        }
        .muted {
            color: #607797;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        .summary th {
            background: #e8f3ff;
            color: #23466f;
            font-size: 10px;
            letter-spacing: .7px;
            padding: 10px 9px;
            text-align: left;
            text-transform: uppercase;
        }
        .summary td {
            border-bottom: 1px solid #edf4fb;
            padding: 11px 9px;
        }
        .right {
            text-align: right;
        }
        .net td {
            background: #0b78e3;
            color: #ffffff;
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
                    <h1>Laporan Laba Rugi</h1>
                    <div class="muted right">{{ $dateFrom }} - {{ $dateTo }}</div>
                </td>
            </tr>
        </table>
        <table class="summary">
            <thead>
                <tr>
                    <th>Metrik</th>
                    <th class="right">Nilai</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($summary as $label => $value)
                    <tr class="{{ $label === 'laba_bersih' ? 'net' : '' }}">
                        <td>{{ str_replace('_', ' ', ucfirst($label)) }}</td>
                        <td class="right">Rp {{ number_format((float) $value, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>
