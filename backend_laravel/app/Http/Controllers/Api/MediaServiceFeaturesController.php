<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Models\MediaService;
use App\Models\MediaServiceFeature;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class MediaServiceFeaturesController extends Controller
{
    /**
     * Получить список всех функций медиа услуги
     *
     * @param int $serviceId
     * @return JsonResponse
     */
    public function index($serviceId): JsonResponse
    {
        try {
            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $features = $service->features()->ordered()->get();
            
            return response()->json([
                'status' => 'success',
                'data' => $features,
                'message' => 'Функции медиа услуги успешно получены'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении функций медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить конкретную функцию медиа услуги
     *
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function show($serviceId, $id): JsonResponse
    {
        try {
            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $feature,
                'message' => 'Функция медиа услуги успешно получена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Создать новую функцию медиа услуги
     *
     * @param Request $request
     * @param int $serviceId
     * @return JsonResponse
     */
    public function store(Request $request, $serviceId): JsonResponse
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|array',
                'description.*' => 'required|string'
            ]);

            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            // Получаем максимальный order для функций этой услуги и увеличиваем на 1
            $maxOrder = $service->features()->max('order') ?? 0;
            
            $feature = MediaServiceFeature::create([
                'service_id' => $serviceId,
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'order' => $maxOrder + 1
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $feature,
                'message' => 'Функция медиа услуги успешно создана'
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
                'message' => 'Ошибка при создании функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }    /*
*
     * Обновить функцию медиа услуги
     *
     * @param Request $request
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $serviceId, $id): JsonResponse
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|array',
                'description.*' => 'required|string'
            ]);

            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            $feature->update([
                'title' => $request->input('title'),
                'description' => $request->input('description')
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $feature,
                'message' => 'Функция медиа услуги успешно обновлена'
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
                'message' => 'Ошибка при обновлении функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить порядок сортировки функции медиа услуги
     *
     * @param Request $request
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function updateOrder(Request $request, $serviceId, $id): JsonResponse
    {
        try {
            $request->validate([
                'order' => 'required|integer|min:1',
            ]);

            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            $newOrder = $request->input('order');
            $currentOrder = $feature->order;

            // Проверяем, что новый порядок не превышает максимальное количество функций
            $maxOrder = $service->features()->count();
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
                    'data' => $feature,
                    'message' => 'Порядок сортировки не изменился'
                ], 200);
            }

            // Обновляем порядок других функций в рамках этой услуги
            if ($newOrder < $currentOrder) {
                // Перемещение вверх - увеличиваем order у функций между новой и текущей позицией
                $service->features()
                    ->where('order', '>=', $newOrder)
                    ->where('order', '<', $currentOrder)
                    ->increment('order');
            } else {
                // Перемещение вниз - уменьшаем order у функций между текущей и новой позицией
                $service->features()
                    ->where('order', '>', $currentOrder)
                    ->where('order', '<=', $newOrder)
                    ->decrement('order');
            }

            // Устанавливаем новый порядок для текущей функции
            $feature->order = $newOrder;
            $feature->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'data' => $feature,
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
     * Массовое обновление порядка сортировки функций медиа услуги
     *
     * @param Request $request
     * @param int $serviceId
     * @return JsonResponse
     */
    public function updateBulkOrder(Request $request, $serviceId): JsonResponse
    {
        try {
            $request->validate([
                'features' => 'required|array',
                'features.*.id' => 'required|integer|exists:media_service_features,id',
                'features.*.order' => 'required|integer|min:1',
            ]);

            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $features = $request->input('features');
            
            // Проверяем, что все порядковые номера уникальны
            $orders = array_column($features, 'order');
            if (count($orders) !== count(array_unique($orders))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Порядковые номера должны быть уникальными'
                ], 422);
            }

            // Проверяем, что все функции принадлежат данной услуге
            $featureIds = array_column($features, 'id');
            $serviceFeatureIds = $service->features()->pluck('id')->toArray();
            $invalidIds = array_diff($featureIds, $serviceFeatureIds);
            
            if (!empty($invalidIds)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Некоторые функции не принадлежат данной услуге'
                ], 422);
            }

            // Обновляем порядок для каждой функции
            foreach ($features as $featureData) {
                MediaServiceFeature::where('id', $featureData['id'])
                    ->update(['order' => $featureData['order']]);
            }

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Порядок сортировки функций медиа услуги обновлен'
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
    }    /**

     * Переместить функцию медиа услуги вверх
     *
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function moveUp($serviceId, $id): JsonResponse
    {
        try {
            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            // Находим функцию с меньшим order в рамках этой услуги
            $previousFeature = $service->features()
                ->where('order', '<', $feature->order)
                ->orderBy('order', 'desc')
                ->first();

            if (!$previousFeature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция уже находится на первом месте'
                ], 400);
            }

            // Меняем местами order
            $currentOrder = $feature->order;
            $feature->order = $previousFeature->order;
            $previousFeature->order = $currentOrder;

            $feature->save();
            $previousFeature->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Функция медиа услуги перемещена вверх'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Переместить функцию медиа услуги вниз
     *
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function moveDown($serviceId, $id): JsonResponse
    {
        try {
            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            // Находим функцию с большим order в рамках этой услуги
            $nextFeature = $service->features()
                ->where('order', '>', $feature->order)
                ->orderBy('order', 'asc')
                ->first();

            if (!$nextFeature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция уже находится на последнем месте'
                ], 400);
            }

            // Меняем местами order
            $currentOrder = $feature->order;
            $feature->order = $nextFeature->order;
            $nextFeature->order = $currentOrder;

            $feature->save();
            $nextFeature->save();

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Функция медиа услуги перемещена вниз'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Удалить функцию медиа услуги
     *
     * @param int $serviceId
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($serviceId, $id): JsonResponse
    {
        try {
            $service = MediaService::find($serviceId);

            if (!$service) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $feature = $service->features()->find($id);

            if (!$feature) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Функция медиа услуги не найдена'
                ], 404);
            }

            $deletedOrder = $feature->order;
            $feature->delete();

            // Обновляем order для остальных функций этой услуги
            $service->features()
                ->where('order', '>', $deletedOrder)
                ->decrement('order');

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'status' => 'success',
                'message' => 'Функция медиа услуги успешно удалена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при удалении функции медиа услуги',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}