<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Http\Controllers\Api\PaginationTrait;
use App\Models\MediaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Cache;

class MediaServicesController extends Controller
{
    use PaginationTrait;
    

    /**
     * Получить список всех медиа услуг с поддержкой пагинации
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if pagination is requested
            $paginate = $request->boolean('paginate', false);
            
            if ($paginate) {
                // Build query with optimized eager loading
                $query = MediaService::with([
                    'features' => function ($query) {
                        $query->orderBy('order');
                    },
                    'mediaItems' => function ($query) {
                        $query->orderBy('group_id')->orderBy('order');
                    }
                ]);
                
                // Apply search if provided
                $query = $this->applySearch($query, $request, ['title', 'description']);
                
                // Apply sorting
                $query = $this->applySorting($query, $request, ['title', 'order', 'created_at'], 'order', 'asc');
                
                // Get paginated results with caching
                $cacheKey = 'media_services_paginated_' . $this->getPaginationCacheKey($request);
                MediaPagePublicController::registerCacheKey($cacheKey);
                $services = Cache::remember($cacheKey, 10, function () use ($query, $request) {
                    return $this->paginateQuery($query, $request, 10);
                });
                
                return response()->json($this->formatPaginatedResponse($services, 'Медиа услуги успешно получены'));
            } else {
                // Return all services without pagination (for admin interface)
                $services = Cache::remember('media_services_all', 30, function () {
                    return MediaService::with([
                        'features' => function ($query) {
                            $query->orderBy('order');
                        },
                        'mediaItems' => function ($query) {
                            $query->orderBy('group_id')->orderBy('order');
                        }
                    ])
                    ->ordered()
                    ->get();
                });
                
                return response()->json([
                    'status' => 'success',
                    'data' => $services,
                    'message' => 'Медиа услуги успешно получены'
                ], 200);
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении медиа услуг',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить конкретную медиа услугу
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $service = MediaService::with(['features', 'mediaItems'])->find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $service,
                'message' => 'Медиа услуга успешно получена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Создать новую медиа услугу
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'dark_background' => 'boolean'
            ]);

            // Получаем максимальный order и увеличиваем на 1
            $maxOrder = MediaService::max('order') ?? 0;
            
            $service = MediaService::create([
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'order' => $maxOrder + 1,
                'dark_background' => $request->input('dark_background', false)
            ]);

            // Загружаем связанные данные для ответа
            $service->load(['features', 'mediaItems']);

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $service,
                'message' => 'Медиа услуга успешно создана'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при создании медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить медиа услугу
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'dark_background' => 'boolean'
            ]);

            $service = MediaService::find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $service->update([
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'dark_background' => $request->input('dark_background', false)
            ]);

            // Загружаем связанные данные для ответа
            $service->load(['features', 'mediaItems']);

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $service,
                'message' => 'Медиа услуга успешно обновлена'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при обновлении медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }
   
 /**
     * Обновить порядок сортировки медиа услуги
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateOrder(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'order' => 'required|integer|min:1',
            ]);

            $service = MediaService::find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $newOrder = $request->input('order');
            $currentOrder = $service->order;

            // Проверяем, что новый порядок не превышает максимальное количество услуг
            $maxOrder = MediaService::count();
            if ($newOrder > $maxOrder) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Неверный порядок сортировки'
                ], 422);
            }

            // Если порядок не изменился, ничего не делаем
            if ($newOrder == $currentOrder) {
                return response()->json([
                    'status' => 'success',
                    'data' => $service,
                    'message' => 'Порядок сортировки не изменился'
                ], 200);
            }

            // Обновляем порядок других услуг
            if ($newOrder < $currentOrder) {
                // Перемещение вверх - увеличиваем order у услуг между новой и текущей позицией
                MediaService::where('order', '>=', $newOrder)
                    ->where('order', '<', $currentOrder)
                    ->increment('order');
            } else {
                // Перемещение вниз - уменьшаем order у услуг между текущей и новой позицией
                MediaService::where('order', '>', $currentOrder)
                    ->where('order', '<=', $newOrder)
                    ->decrement('order');
            }

            // Устанавливаем новый порядок для текущей услуги
            $service->order = $newOrder;
            $service->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $service,
                'message' => 'Порядок сортировки обновлен'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при обновлении порядка сортировки',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Массовое обновление порядка сортировки медиа услуг
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateBulkOrder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'services' => 'required|array',
                'services.*.id' => 'required|integer|exists:media_services,id',
                'services.*.order' => 'required|integer|min:1',
            ]);

            $services = $request->input('services');
            
            // Проверяем, что все порядковые номера уникальны и последовательны
            $orders = array_column($services, 'order');
            if (count($orders) !== count(array_unique($orders))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Порядковые номера должны быть уникальными'
                ], 422);
            }

            // Обновляем порядок для каждой услуги
            foreach ($services as $serviceData) {
                MediaService::where('id', $serviceData['id'])
                    ->update(['order' => $serviceData['order']]);
            }

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Порядок сортировки медиа услуг обновлен'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка валидации данных',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при массовом обновлении порядка сортировки',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Переместить медиа услугу вверх
     *
     * @param int $id
     * @return JsonResponse
     */
    public function moveUp($id): JsonResponse
    {
        try {
            $service = MediaService::find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            // Находим услугу с меньшим order
            $previousService = MediaService::where('order', '<', $service->order)
                ->orderBy('order', 'desc')
                ->first();

            if (!$previousService) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга уже находится на первом месте'
                ], 400);
            }

            // Меняем местами order
            $currentOrder = $service->order;
            $service->order = $previousService->order;
            $previousService->order = $currentOrder;

            $service->save();
            $previousService->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Медиа услуга перемещена вверх'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Переместить медиа услугу вниз
     *
     * @param int $id
     * @return JsonResponse
     */
    public function moveDown($id): JsonResponse
    {
        try {
            $service = MediaService::find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            // Находим услугу с большим order
            $nextService = MediaService::where('order', '>', $service->order)
                ->orderBy('order', 'asc')
                ->first();

            if (!$nextService) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга уже находится на последнем месте'
                ], 400);
            }

            // Меняем местами order
            $currentOrder = $service->order;
            $service->order = $nextService->order;
            $nextService->order = $currentOrder;

            $service->save();
            $nextService->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Медиа услуга перемещена вниз'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Удалить медиа услугу
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $service = MediaService::find($id);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $deletedOrder = $service->order;
            $service->delete();

            // Обновляем order для остальных услуг
            MediaService::where('order', '>', $deletedOrder)
                ->decrement('order');

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Медиа услуга успешно удалена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при удалении медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}