<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SEOSettings;
use App\Models\PageSeoSetting;
use App\Models\Project;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SEOController extends Controller
{
    /**
     * Получить глобальные SEO-настройки
     */
    public function getGlobalSettings(): JsonResponse
    {
        try {
            $settings = SEOSettings::first();

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении глобальных SEO-настроек',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить глобальные SEO-настройки
     */
    public function updateGlobalSettings(Request $request): JsonResponse
    {
        try {
            \Log::info('[SEOController] updateGlobalSettings called', [
                'user' => $request->user() ? $request->user()->id : 'not authenticated',
                'has_bearer_token' => $request->bearerToken() ? 'yes' : 'no',
                'token_preview' => $request->bearerToken() ? substr($request->bearerToken(), 0, 20) . '...' : 'none',
                'headers' => $request->headers->all()
            ]);

            $validator = Validator::make($request->all(), [
                'site_title' => 'required|string|max:255',
                'site_description' => 'required|string|max:500',
                'twitter_card_type' => 'required|in:summary,summary_large_image',
                'facebook_app_id' => 'nullable|string|max:255',
                'default_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['site_title', 'site_description', 'twitter_card_type', 'facebook_app_id']);

            // Обработка загрузки изображения
            if ($request->hasFile('default_image')) {
                $file = $request->file('default_image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('seo', $filename, 'public');
                $data['default_image'] = $path;
            }

            $settings = SEOSettings::first();
            if ($settings) {
                $settings->update($data);
            } else {
                $settings = SEOSettings::create($data);
            }

            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'Глобальные SEO-настройки успешно обновлены'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении глобальных SEO-настроек',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить SEO-настройки для страниц списков
     */
    public function getPageSettings(): JsonResponse
    {
        try {
            $settings = [];

            foreach (PageSeoSetting::PAGE_TYPES as $type => $name) {
                $settings[$type] = PageSeoSetting::getForPageType($type);
            }

            return response()->json([
                'success' => true,
                'data' => $settings,
                'page_types' => PageSeoSetting::PAGE_TYPES
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении SEO-настроек страниц',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить SEO-настройки для конкретной страницы
     */
    public function updatePageSettings(Request $request, string $pageType): JsonResponse
    {
        try {
            \Log::info('[SEOController] updatePageSettings called', [
                'page_type' => $pageType,
                'user' => $request->user() ? $request->user()->id : 'not authenticated',
                'has_bearer_token' => $request->bearerToken() ? 'yes' : 'no'
            ]);

            if (!array_key_exists($pageType, PageSeoSetting::PAGE_TYPES)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Неверный тип страницы'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:500',
                'seo_keywords' => 'nullable|array',
                'seo_keywords.*' => 'string|max:100',
                'canonical_url' => 'nullable|url|max:255',
                'seo_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
                'is_active' => 'nullable|in:true,false,1,0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['seo_title', 'seo_description', 'seo_keywords', 'canonical_url', 'is_active']);
            $data['page_type'] = $pageType;

            // Преобразуем is_active в булевое значение
            if (isset($data['is_active'])) {
                $data['is_active'] = in_array($data['is_active'], ['true', '1', 1, true], true);
            }

            // Обработка загрузки изображения
            if ($request->hasFile('seo_image')) {
                $file = $request->file('seo_image');
                $filename = time() . '_' . $pageType . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('seo/pages', $filename, 'public');
                $data['seo_image'] = $path;
            }

            $settings = PageSeoSetting::updateForPageType($pageType, $data);

            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'SEO-настройки страницы успешно обновлены'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении SEO-настроек страницы',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить SEO-данные для конкретного проекта
     */
    public function getProjectSeo(string $slug): JsonResponse
    {
        try {
            $project = Project::where('slug', $slug)->first();

            if (!$project) {
                return response()->json([
                    'success' => false,
                    'message' => 'Проект не найден'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $project->id,
                    'title' => $project->main_title,
                    'seo_title' => $project->seo_title,
                    'seo_description' => $project->seo_description,
                    'seo_image' => $project->seo_image,
                    'main_image' => $project->main_image,
                    'slug' => $project->slug,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении SEO-данных проекта',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить SEO-данные проекта
     */
    public function updateProjectSeo(Request $request, string $slug): JsonResponse
    {
        try {
            $project = Project::where('slug', $slug)->first();

            if (!$project) {
                return response()->json([
                    'success' => false,
                    'message' => 'Проект не найден'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:500',
                'seo_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['seo_title', 'seo_description']);

            // Обработка загрузки изображения
            if ($request->hasFile('seo_image')) {
                $file = $request->file('seo_image');
                $filename = time() . '_project_' . $project->id . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('seo/projects', $filename, 'public');
                $data['seo_image'] = $path;
            }

            $project->update($data);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $project->id,
                    'title' => $project->main_title,
                    'seo_title' => $project->seo_title,
                    'seo_description' => $project->seo_description,
                    'seo_image' => $project->seo_image,
                    'main_image' => $project->main_image,
                    'slug' => $project->slug,
                ],
                'message' => 'SEO-данные проекта успешно обновлены'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении SEO-данных проекта',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить SEO-данные для конкретного поста блога
     */
    public function getBlogPostSeo(string $slug): JsonResponse
    {
        try {
            $post = BlogPost::where('slug', $slug)->first();

            if (!$post) {
                return response()->json([
                    'success' => false,
                    'message' => 'Пост не найден'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'seo_title' => $post->seo_title,
                    'seo_description' => $post->seo_description,
                    'seo_image' => $post->seo_image,
                    'image' => $post->image,
                    'slug' => $post->slug,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении SEO-данных поста',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Обновить SEO-данные поста блога
     */
    public function updateBlogPostSeo(Request $request, string $slug): JsonResponse
    {
        try {
            $post = BlogPost::where('slug', $slug)->first();

            if (!$post) {
                return response()->json([
                    'success' => false,
                    'message' => 'Пост не найден'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:500',
                'seo_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['seo_title', 'seo_description']);

            // Обработка загрузки изображения
            if ($request->hasFile('seo_image')) {
                $file = $request->file('seo_image');
                $filename = time() . '_blog_' . $post->id . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('seo/blog', $filename, 'public');
                $data['seo_image'] = $path;
            }

            $post->update($data);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'seo_title' => $post->seo_title,
                    'seo_description' => $post->seo_description,
                    'seo_image' => $post->seo_image,
                    'image' => $post->image,
                    'slug' => $post->slug,
                ],
                'message' => 'SEO-данные поста успешно обновлены'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении SEO-данных поста',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить все SEO-данные для админки (обзор)
     */
    public function getSeoOverview(): JsonResponse
    {
        try {
            // Глобальные настройки
            $globalSettings = SEOSettings::first();

            // Настройки страниц
            $pageSettings = [];
            foreach (PageSeoSetting::PAGE_TYPES as $type => $name) {
                $pageSettings[$type] = PageSeoSetting::getForPageType($type);
            }

            // Проекты без SEO
            $projectsWithoutSeo = Project::whereNull('seo_title')
                ->whereNull('seo_description')
                ->count();

            // Посты без SEO
            $postsWithoutSeo = BlogPost::whereNull('seo_title')
                ->whereNull('seo_description')
                ->count();

            // Статистика
            $stats = [
                'total_projects' => Project::count(),
                'projects_with_seo' => Project::where(function($query) {
                    $query->whereNotNull('seo_title')
                          ->orWhereNotNull('seo_description');
                })->count(),
                'projects_without_seo' => $projectsWithoutSeo,
                'total_blog_posts' => BlogPost::count(),
                'blog_posts_with_seo' => BlogPost::where(function($query) {
                    $query->whereNotNull('seo_title')
                          ->orWhereNotNull('seo_description');
                })->count(),
                'blog_posts_without_seo' => $postsWithoutSeo,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'global_settings' => $globalSettings,
                    'page_settings' => $pageSettings,
                    'stats' => $stats,
                    'page_types' => PageSeoSetting::PAGE_TYPES
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('SEO Overview Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при получении обзора SEO',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Тестовый эндпоинт для проверки подключения
     */
    public function test(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'SEO API работает корректно',
            'timestamp' => now()
        ]);
    }
}
