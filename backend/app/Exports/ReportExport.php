<?php

namespace App\Exports;

use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class ReportExport
{
    protected $report;
    protected $headingsArray = [];
    protected $currencyColumns = [];

    public function __construct(array $report)
    {
        $this->report = $report;
        $this->detectHeadingsAndCurrencyColumns();
    }

    protected function detectHeadingsAndCurrencyColumns()
    {
        if (empty($this->report)) {
            return;
        }

        $firstRow = reset($this->report);
        if (!is_array($firstRow)) {
            if (is_object($firstRow)) {
                $firstRow = (array)$firstRow;
            } else {
                return;
            }
        }

        $this->headingsArray = array_keys($firstRow);
        
        foreach ($this->headingsArray as $index => $heading) {
            if (stripos($heading, 'precio') !== false || 
                stripos($heading, 'comision') !== false || 
                stripos($heading, 'total') !== false) {
                $this->currencyColumns[] = $index;
            }
        }
    }

    protected function escapeXml($value)
    {
        return htmlspecialchars((string)$value, ENT_XML1, 'UTF-8');
    }

    public function getData(): array
    {
        $result = array_values($this->report);
        
        return array_map(function($item) {
            if (!is_array($item)) {
                if (is_object($item)) {
                    $item = (array)$item;
                } else {
                    return [];
                }
            }
            
            $formatted = [];
            foreach ($item as $key => $value) {
                if (stripos($key, 'fecha') !== false && $value) {
                    if (is_object($value) && method_exists($value, 'format')) {
                        $formatted[$key] = $value->format('Y-m-d');
                    } else {
                        $formatted[$key] = (string)$value;
                    }
                }
                elseif (is_numeric($value)) {
                    $formatted[$key] = is_float($value) ? (float)$value : (int)$value;
                }
                else {
                    $formatted[$key] = (string)($value ?? '');
                }
            }
            
            return $formatted;
        }, $result);
    }

    public function getHeadings(): array
    {
        return $this->headingsArray;
    }

    /**
     * Generar archivo Excel (.xlsx) usando XML directamente
     */
    public function download(string $filename): StreamedResponse
    {
        try {
            $headings = $this->getHeadings();
            $data = $this->getData();

            return new StreamedResponse(function() use ($headings, $data, $filename) {
                // Crear archivo temporal
                $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
                $zip = new ZipArchive();
                
                if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
                    throw new \Exception('No se pudo crear el archivo ZIP');
                }

                // [Content_Types].xml
                $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>';
                $zip->addFromString('[Content_Types].xml', $contentTypes);

                // _rels/.rels
                $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>';
                $zip->addFromString('_rels/.rels', $rels);

                // xl/_rels/workbook.xml.rels
                $workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>';
                $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRels);

                // xl/workbook.xml
                $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Reporte" sheetId="1" r:id="rId1"/>
</sheets>
</workbook>';
                $zip->addFromString('xl/workbook.xml', $workbook);

                // xl/styles.xml
                $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1">
<numFmt numFmtId="164" formatCode="$#,##0.00"/>
</numFmts>
<fonts count="2">
<font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
<font><color rgb="FF000000"/><sz val="11"/><name val="Calibri"/></font>
</fonts>
<fills count="2">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0E99BB"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="1" borderId="0" xfId="0" applyFill="1" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>';
                $zip->addFromString('xl/styles.xml', $styles);

                // xl/worksheets/sheet1.xml
                $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetData>';

                // Encabezados (fila 1)
                $sheetXml .= '<row r="1">';
                foreach ($headings as $index => $heading) {
                    $col = $this->getColumnLetter($index);
                    $sheetXml .= '<c r="' . $col . '1" t="inlineStr" s="1"><is><t>' . $this->escapeXml($heading) . '</t></is></c>';
                }
                $sheetXml .= '</row>';

                // Datos
                $rowNum = 2;
                foreach ($data as $rowData) {
                    $sheetXml .= '<row r="' . $rowNum . '">';
                    foreach ($headings as $index => $heading) {
                        $col = $this->getColumnLetter($index);
                        $value = $rowData[$heading] ?? '';
                        
                        if (in_array($index, $this->currencyColumns) && is_numeric($value)) {
                            // Formato de moneda (estilo 3 = texto negro + formato moneda)
                            $sheetXml .= '<c r="' . $col . $rowNum . '" s="3"><v>' . (float)$value . '</v></c>';
                        } else {
                            // Texto o número normal (estilo 2 = texto negro)
                            if (is_numeric($value)) {
                                $sheetXml .= '<c r="' . $col . $rowNum . '" s="2"><v>' . $value . '</v></c>';
                            } else {
                                $sheetXml .= '<c r="' . $col . $rowNum . '" s="2" t="inlineStr"><is><t>' . $this->escapeXml($value) . '</t></is></c>';
                            }
                        }
                    }
                    $sheetXml .= '</row>';
                    $rowNum++;
                }

                $sheetXml .= '</sheetData></worksheet>';
                $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);

                $zip->close();

                // Enviar archivo
                readfile($tempFile);
                unlink($tempFile);
            }, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                'Cache-Control' => 'max-age=0',
            ]);
            
        } catch (\Throwable $e) {
            Log::error("Error en ReportExport@download: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    protected function getColumnLetter($index)
    {
        $letters = range('A', 'Z');
        $result = '';
        $num = $index;
        
        while ($num >= 0) {
            $result = $letters[$num % 26] . $result;
            $num = floor($num / 26) - 1;
        }
        
        return $result;
    }
}
