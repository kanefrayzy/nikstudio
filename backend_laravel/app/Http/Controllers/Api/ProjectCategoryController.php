<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProjectCategoryController extends Controller
{
    /**
     * Получить список всех категорий проектов
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            // Получаем категории с сортировкой по sort_order
            $categories = ProjectCategory::orderBy('sort_order', 'asc')->get();
            
            return response()->json([
                'status' => 'success',
                'data' => $categories,
                'message' => 'Категории успешно получены'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при получении категорий',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Создать новую категорию проекта
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:project_categories,name',
        ]);

        try {
            // Получаем максимальный sort_order и увеличиваем на 1
            $maxSortOrder = ProjectCategory::max('sort_order') ?? 0;
            
            $category = new ProjectCategory();
            $category->name = $request->input('name');
            $category->slug = Str::slug($request->input('name'));
            $category->sort_order = $maxSortOrder + 1;
            $category->save();

            return response()->json([
                'status' => 'success',
                'data' => $category,
                'message' => 'Категория успешно создана'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при создании категории',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить категорию проекта
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:project_categories,name,' . $id,
        ]);

        try {
            $category = ProjectCategory::find($id);

            if (!$category) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория не найдена'
                ], 404);
            }

            $category->name = $request->input('name');
            $category->slug = Str::slug($request->input('name'));
            $category->save();

            return response()->json([
                'status' => 'success',
                'data' => $category,
                'message' => 'Категория успешно обновлена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при обновлении категории',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить порядок сортировки категории
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateSortOrder(Request $request, $id): JsonResponse
    {
        $request->validate([
            'sort_order' => 'required|integer|min:0',
        ]);

        try {
            $category = ProjectCategory::find($id);

            if (!$category) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория не найдена'
                ], 404);
            }

            $category->sort_order = $request->input('sort_order');
            $category->save();

            return response()->json([
                'status' => 'success',
                'data' => $category,
                'message' => 'Порядок сортировки обновлен'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при обновлении порядка сортировки',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Массовое обновление порядка сортировки категорий
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateBulkSortOrder(Request $request): JsonResponse
    {
        $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|integer|exists:project_categories,id',
            'categories.*.sort_order' => 'required|integer|min:0',
        ]);

        try {
            $categories = $request->input('categories');
            
            foreach ($categories as $categoryData) {
                ProjectCategory::where('id', $categoryData['id'])
                    ->update(['sort_order' => $categoryData['sort_order']]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Порядок сортировки категорий обновлен'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при массовом обновлении порядка сортировки',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Переместить категорию вверх
     *
     * @param int $id
     * @return JsonResponse
     */
    public function moveUp($id): JsonResponse
    {
        try {
            $category = ProjectCategory::find($id);

            if (!$category) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория не найдена'
                ], 404);
            }

            // Находим категорию с меньшим sort_order
            $previousCategory = ProjectCategory::where('sort_order', '<', $category->sort_order)
                ->orderBy('sort_order', 'desc')
                ->first();

            if (!$previousCategory) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория уже находится на первом месте'
                ], 400);
            }

            // Меняем местами sort_order
            $currentSortOrder = $category->sort_order;
            $category->sort_order = $previousCategory->sort_order;
            $previousCategory->sort_order = $currentSortOrder;

            $category->save();
            $previousCategory->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Категория перемещена вверх'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении категории',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Переместить категорию вниз
     *
     * @param int $id
     * @return JsonResponse
     */
    public function moveDown($id): JsonResponse
    {
        try {
            $category = ProjectCategory::find($id);

            if (!$category) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория не найдена'
                ], 404);
            }

            // Находим категорию с большим sort_order
            $nextCategory = ProjectCategory::where('sort_order', '>', $category->sort_order)
                ->orderBy('sort_order', 'asc')
                ->first();

            if (!$nextCategory) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория уже находится на последнем месте'
                ], 400);
            }

            // Меняем местами sort_order
            $currentSortOrder = $category->sort_order;
            $category->sort_order = $nextCategory->sort_order;
            $nextCategory->sort_order = $currentSortOrder;

            $category->save();
            $nextCategory->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Категория перемещена вниз'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при перемещении категории',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Удалить категорию проекта
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $category = ProjectCategory::find($id);

            if (!$category) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Категория не найдена'
                ], 404);
            }

            $deletedSortOrder = $category->sort_order;
            $category->delete();

            // Обновляем sort_order для остальных категорий
            ProjectCategory::where('sort_order', '>', $deletedSortOrder)
                ->decrement('sort_order');

            return response()->json([
                'status' => 'success',
                'message' => 'Категория успешно удалена'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ошибка при удалении категории',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}