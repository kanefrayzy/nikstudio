<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Models\MediaTestimonial;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MediaTestimonialsController extends Controller
{
    /**
     * Получить список всех отзывов
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $testimonials = MediaTestimonial::ordered()->get();
            
            // Нормализуем пути к изображениям (убираем /storage/ префикс)
            $testimonials->transform(function ($testimonial) {
                if ($testimonial->image_path) {
                    $testimonial->image_path = str_replace('/storage/', '', $testimonial->image_path);
                }
                return $testimonial;
            });
            
            return response()->json([
                'status' => 'success',
                'data' => $testimonials,
                'message' => 'Отзывы успешно получены'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching testimonials: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении отзывов',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить конкретный отзыв
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $testimonial = MediaTestimonial::find($id);

            if (!$testimonial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Отзыв не найден'
                ], 404);
            }

            // Нормализуем путь к изображению
            if ($testimonial->image_path) {
                $testimonial->image_path = str_replace('/storage/', '', $testimonial->image_path);
            }

            return response()->json([
                'status' => 'success',
                'data' => $testimonial,
                'message' => 'Отзыв успешно получен'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching testimonial: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении отзыва',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Создать новый отзыв
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'company' => 'required|string|max:255',
                'quote' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'image' => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:2048', // 2MB max
            ], [
                'company.required' => 'Название компании обязательно для заполнения',
                'company.max' => 'Название компании не должно превышать 255 символов',
                'quote.required' => 'Цитата обязательна для заполнения',
                'quote.max' => 'Цитата не должна превышать 500 символов',
                'description.required' => 'Описание обязательно для заполнения',
                'description.max' => 'Описание не должно превышать 1000 символов',
                'image.required' => 'Изображение обязательно для загрузки',
                'image.image' => 'Файл должен быть изображением',
                'image.mimes' => 'Изображение должно быть в формате: jpg, jpeg, png, webp, svg',
                'image.max' => 'Размер изображения не должен превышать 2MB',
            ]);

            // Получаем максимальный order и увеличиваем на 1
            $maxOrder = MediaTestimonial::max('order') ?? 0;
            
            // Обрабатываем загрузку изображения
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                
                // Проверяем размер файла (2MB = 2048KB)
                if ($image->getSize() > 2048 * 1024) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Размер изображения превышает 2MB'
                    ], 413);
                }
                
                // Сохраняем файл
                $imagePath = $image->store('testimonials', 'public');
            }

            $testimonial = MediaTestimonial::create([
                'company' => $request->input('company'),
                'quote' => $request->input('quote'),
                'description' => $request->input('description'),
                'image_path' => $imagePath,
                'order' => $maxOrder + 1
            ]);

            // Нормализуем путь к изображению для ответа
            if ($testimonial->image_path) {
                $testimonial->image_path = str_replace('/storage/', '', $testimonial->image_path);
            }

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $testimonial,
                'message' => 'Отзыв успешно создан'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating testimonial: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при создании отзыва',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить отзыв
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'company' => 'required|string|max:255',
                'quote' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:2048', // 2MB max
            ], [
                'company.required' => 'Название компании обязательно для заполнения',
                'company.max' => 'Название компании не должно превышать 255 символов',
                'quote.required' => 'Цитата обязательна для заполнения',
                'quote.max' => 'Цитата не должна превышать 500 символов',
                'description.required' => 'Описание обязательно для заполнения',
                'description.max' => 'Описание не должно превышать 1000 символов',
                'image.image' => 'Файл должен быть изображением',
                'image.mimes' => 'Изображение должно быть в формате: jpg, jpeg, png, webp, svg',
                'image.max' => 'Размер изображения не должен превышать 2MB',
            ]);

            $testimonial = MediaTestimonial::find($id);

            if (!$testimonial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Отзыв не найден'
                ], 404);
            }

            // Обрабатываем загрузку нового изображения
            $imagePath = $testimonial->image_path;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                
                // Проверяем размер файла (2MB = 2048KB)
                if ($image->getSize() > 2048 * 1024) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Размер изображения превышает 2MB'
                    ], 413);
                }
                
                // Удаляем старое изображение
                if ($testimonial->image_path && Storage::disk('public')->exists($testimonial->image_path)) {
                    Storage::disk('public')->delete($testimonial->image_path);
                }
                
                // Сохраняем новое изображение
                $imagePath = $image->store('testimonials', 'public');
            }

            $testimonial->update([
                'company' => $request->input('company'),
                'quote' => $request->input('quote'),
                'description' => $request->input('description'),
                'image_path' => $imagePath
            ]);

            // Нормализуем путь к изображению для ответа
            if ($testimonial->image_path) {
                $testimonial->image_path = str_replace('/storage/', '', $testimonial->image_path);
            }

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $testimonial,
                'message' => 'Отзыв успешно обновлен'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating testimonial: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при обновлении отзыва',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Удалить отзыв
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $testimonial = MediaTestimonial::find($id);

            if (!$testimonial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Отзыв не найден'
                ], 404);
            }

            $deletedOrder = $testimonial->order;
            
            // Удаляем изображение из хранилища
            if ($testimonial->image_path && Storage::disk('public')->exists($testimonial->image_path)) {
                Storage::disk('public')->delete($testimonial->image_path);
            }

            $testimonial->delete();

            // Обновляем order для остальных отзывов
            MediaTestimonial::where('order', '>', $deletedOrder)
                ->decrement('order');

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Отзыв успешно удален'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error deleting testimonial: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при удалении отзыва',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Изменить порядок отзывов
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'testimonials' => 'required|array',
                'testimonials.*.id' => 'required|integer|exists:media_testimonials,id',
                'testimonials.*.order' => 'required|integer|min:1',
            ], [
                'testimonials.required' => 'Список отзывов обязателен',
                'testimonials.array' => 'Список отзывов должен быть массивом',
                'testimonials.*.id.required' => 'ID отзыва обязателен',
                'testimonials.*.id.exists' => 'Отзыв с указанным ID не найден',
                'testimonials.*.order.required' => 'Порядок отзыва обязателен',
                'testimonials.*.order.min' => 'Порядок отзыва должен быть больше 0',
            ]);

            $testimonials = $request->input('testimonials');
            
            // Проверяем, что все порядковые номера уникальны
            $orders = array_column($testimonials, 'order');
            if (count($orders) !== count(array_unique($orders))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Порядковые номера должны быть уникальными'
                ], 422);
            }

            // Обновляем порядок для каждого отзыва
            foreach ($testimonials as $testimonialData) {
                MediaTestimonial::where('id', $testimonialData['id'])
                    ->update(['order' => $testimonialData['order']]);
            }

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Порядок отзывов успешно обновлен'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error reordering testimonials: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при изменении порядка отзывов',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}