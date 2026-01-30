<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoStreamController extends Controller
{
    public function stream(Request $request, $path)
    {
        // Логируем для отладки
        \Log::info('VideoStreamController called for path: ' . $path);
        
        // Декодируем путь и защищаемся от Path Traversal
        $filePath = urldecode($path);
        $filePath = str_replace(['../', '..\\', '..'], '', $filePath);
        
        // Проверяем существование файла
        if (!Storage::disk('public')->exists($filePath)) {
            \Log::error('File not found: ' . $filePath);
            abort(404);
        }
        
        // Дополнительная проверка: файл должен быть внутри storage/app/public
        $fullPath = Storage::disk('public')->path($filePath);
        $basePath = storage_path('app/public');
        $realPath = realpath($fullPath);
        
        if (!$realPath || !str_starts_with($realPath, realpath($basePath))) {
            \Log::error('Path traversal attempt detected: ' . $filePath);
            abort(403, 'Access denied');
        }

        $fileSize = filesize($realPath);
        $mimeType = mime_content_type($realPath);

        // Получаем Range заголовок
        $range = $request->header('Range');
        
        if ($range) {
            // Парсим Range заголовок
            list($param, $range) = explode('=', $range);
            
            if (strtolower(trim($param)) != 'bytes') {
                header('HTTP/1.1 400 Bad Request');
                exit;
            }

            $range = explode('-', $range);
            $start = intval($range[0]);
            $end = isset($range[1]) && is_numeric($range[1]) ? intval($range[1]) : $fileSize - 1;
            
            if ($start > $end || $start > $fileSize - 1 || $end >= $fileSize) {
                header('HTTP/1.1 416 Requested Range Not Satisfiable');
                header("Content-Range: bytes */$fileSize");
                exit;
            }

            $length = $end - $start + 1;

            return response()->stream(function() use ($realPath, $start, $length) {
                $stream = fopen($realPath, 'rb');
                fseek($stream, $start);
                
                $buffer = 1024 * 8;
                $bytesRead = 0;
                
                while (!feof($stream) && $bytesRead < $length) {
                    $chunkSize = min($buffer, $length - $bytesRead);
                    echo fread($stream, $chunkSize);
                    $bytesRead += $chunkSize;
                    flush();
                }
                
                fclose($stream);
            }, 206, [
                'Content-Type' => $mimeType,
                'Content-Length' => $length,
                'Content-Range' => "bytes $start-$end/$fileSize",
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Если нет Range заголовка, отдаём весь файл
        return response()->stream(function() use ($realPath) {
            $stream = fopen($realPath, 'rb');
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}
