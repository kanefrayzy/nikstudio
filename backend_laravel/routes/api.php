<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\VideoStreamController;
use App\Http\Controllers\Api\BlogPostController;

// Video streaming with Range support - ПЕРВЫЙ РОУТ
Route::get('/video/{path}', [VideoStreamController::class, 'stream'])
    ->where('path', '.*')
    ->name('api.video.stream');
use App\Http\Controllers\Api\BlogBlockController;
use App\Http\Controllers\Api\ProjectCategoryController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\SEOController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ServiceVideoController;
use App\Http\Controllers\Api\MediaPageController;
use App\Http\Controllers\Api\MediaServicesController;
use App\Http\Controllers\Api\MediaServiceFeaturesController;
use App\Http\Controllers\Api\MediaServiceMediaController;
use App\Http\Controllers\Api\MediaTestimonialsController;
use App\Http\Controllers\Api\MediaProcessStepsController;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Http\Controllers\Api\HomepageContentController;
use App\Http\Controllers\Api\AuthController;

// Authentication routes
Route::middleware(['throttle:3,5'])->post('/login', [AuthController::class, 'login']);
Route::middleware(['auth:sanctum', 'refresh.token'])->post('/logout', [AuthController::class, 'logout']);
Route::middleware(['auth:sanctum', 'refresh.token'])->get('/me', [AuthController::class, 'me']);
Route::middleware(['auth:sanctum', 'refresh.token', 'throttle:5,1'])->post('/admin/change-password', [AuthController::class, 'changePassword']);

Route::middleware(['auth:sanctum', 'refresh.token'])->get('/user', function (Request $request) {
    return $request->user();
});

// Маршруты для блога
Route::get('/blog-posts', [BlogPostController::class, 'index']); 
Route::get('/blog-posts/{slug}', [BlogPostController::class, 'show']);
Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
    Route::post('/blog-posts', [BlogPostController::class, 'store']);
    Route::post('/blog-posts/update', [BlogPostController::class, 'update']);
    Route::delete('/blog-posts/{id}', [BlogPostController::class, 'destroy']);
    Route::patch('/blog-posts/{id}/status', [BlogPostController::class, 'updateStatus']);
    Route::patch('/blog-posts/{id}/sort-order', [BlogPostController::class, 'updateSortOrder']);
    Route::post('/blog-posts/{slug}/blocks', [BlogBlockController::class, 'store']);
    Route::put('/blog-posts/blocks/{id}', [BlogBlockController::class, 'update']);
    Route::delete('/blog-posts/blocks/{id}', [BlogBlockController::class, 'destroy']);
});

// Маршруты для категорий проектов
Route::prefix('project-categories')->group(function () {
    Route::get('/', [ProjectCategoryController::class, 'index']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [ProjectCategoryController::class, 'store']);
        Route::put('/{id}', [ProjectCategoryController::class, 'update']);
        Route::delete('/{id}', [ProjectCategoryController::class, 'destroy']);
        Route::put('/{id}/sort-order', [ProjectCategoryController::class, 'updateSortOrder']);
        Route::put('/{id}/move-up', [ProjectCategoryController::class, 'moveUp']);
        Route::put('/{id}/move-down', [ProjectCategoryController::class, 'moveDown']);
        Route::put('/bulk-sort-order', [ProjectCategoryController::class, 'updateBulkSortOrder']);
    });
});

// Маршруты для проектов
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);

Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

    // Маршруты для деталей проекта (основная информация и Hero медиа)
    Route::post('/projects/{slug}/detail', [ProjectController::class, 'createDetail']);
    Route::put('/projects/{slug}/detail', [ProjectController::class, 'updateDetail']); // Для обновления текстовых полей
    Route::post('/projects/{slug}/detail/update-media', [ProjectController::class, 'updateDetail']); // Для обновления медиа (используем POST для FormData)
    Route::delete('/projects/{slug}/detail/hero-media/{groupId}', [ProjectController::class, 'destroyHeroGroup']);

    // --- НОВЫЕ И ИЗМЕНЕННЫЕ МАРШРУТЫ ДЛЯ БЛОКОВ И ИХ МЕДИА ---

    // Маршрут для создания нового блока (только текст)
    Route::post('projects/{slug}/blocks', [ProjectController::class, 'storeBlock']);
    // Маршрут для обновления текстового содержимого блока
    Route::put('projects/{slug}/blocks/{blockId}', [ProjectController::class, 'updateBlockText']);
    // Маршрут для удаления всего блока
    Route::delete('projects/{slug}/blocks/{blockId}', [ProjectController::class, 'destroyBlock']);

    // Вложенные маршруты для управления медиа ВНУТРИ конкретного блока
    Route::prefix('projects/{slug}/blocks/{blockId}/media')->group(function () {
        // Создание новой медиа-группы
        Route::post('/', [ProjectController::class, 'storeBlockMediaGroup']);
        // Обновление существующей медиа-группы (POST для FormData с _method=PUT)
        Route::post('/{groupId}', [ProjectController::class, 'updateBlockMediaGroup']);
        // Также добавляем PUT маршрут для обновления
        Route::put('/{groupId}', [ProjectController::class, 'updateBlockMediaGroup']); 
        // Удаление медиа-группы
        Route::delete('/{groupId}', [ProjectController::class, 'destroyBlockMediaGroup']);
    });
});

// Маршруты для управления контентом главной страницы
Route::get('/home', [HomeController::class, 'index']);
Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
    Route::post('/home/hero-video', [HomeController::class, 'uploadHeroVideo']);
    Route::delete('/home/hero-video', [HomeController::class, 'deleteHeroVideo']);
    Route::post('/home/fallback-image', [HomeController::class, 'uploadFallbackImage']);
});

// Маршруты для управления контентом главной страницы (CMS)
// Публичные маршруты с базовым rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/homepage-content', [HomepageContentController::class, 'index']);
    Route::get('/homepage-content/{section}', [HomepageContentController::class, 'getBySection']);
});

// Защищенные маршруты для обновления контента главной страницы
// Более строгий rate limiting для операций изменения данных
Route::middleware(['auth:sanctum', 'refresh.token', 'throttle:30,1'])->group(function () {
    Route::post('/homepage-content', [HomepageContentController::class, 'bulkUpdate']);
    Route::put('/homepage-content/{id}', [HomepageContentController::class, 'update']);
    Route::post('/homepage-content/upload-image', [HomepageContentController::class, 'uploadImage']);
});

// Маршруты для управления видео услуг
Route::get('/services/{serviceName}/video', [ServiceVideoController::class, 'show']);
Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
    Route::post('/services/{serviceName}/video', [ServiceVideoController::class, 'upload']);
    Route::delete('/services/{serviceName}/video', [ServiceVideoController::class, 'delete']);
});

// Маршруты для управления контентом медиа страницы
Route::prefix('admin/media-page')->group(function () {
    Route::get('/', [MediaPageController::class, 'index']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::put('/hero', [MediaPageController::class, 'updateHero']);
        Route::put('/testimonials-header', [MediaPageController::class, 'updateTestimonialsHeader']);
        Route::put('/process-header', [MediaPageController::class, 'updateProcessHeader']);
    });
});

// Маршруты для управления медиа услугами
Route::prefix('media-services')->group(function () {
    Route::get('/', [MediaServicesController::class, 'index']);
    Route::get('/{id}', [MediaServicesController::class, 'show']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [MediaServicesController::class, 'store']);
        Route::put('/{id}', [MediaServicesController::class, 'update']);
        Route::delete('/{id}', [MediaServicesController::class, 'destroy']);
        Route::put('/{id}/order', [MediaServicesController::class, 'updateOrder']);
        Route::put('/{id}/move-up', [MediaServicesController::class, 'moveUp']);
        Route::put('/{id}/move-down', [MediaServicesController::class, 'moveDown']);
        Route::put('/bulk-order', [MediaServicesController::class, 'updateBulkOrder']);
    });
});

// Маршруты для управления функциями медиа услуг
Route::prefix('media-services/{serviceId}/features')->group(function () {
    Route::get('/', [MediaServiceFeaturesController::class, 'index']);
    Route::get('/{id}', [MediaServiceFeaturesController::class, 'show']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [MediaServiceFeaturesController::class, 'store']);
        Route::put('/{id}', [MediaServiceFeaturesController::class, 'update']);
        Route::delete('/{id}', [MediaServiceFeaturesController::class, 'destroy']);
        Route::put('/{id}/order', [MediaServiceFeaturesController::class, 'updateOrder']);
        Route::put('/{id}/move-up', [MediaServiceFeaturesController::class, 'moveUp']);
        Route::put('/{id}/move-down', [MediaServiceFeaturesController::class, 'moveDown']);
        Route::put('/bulk-order', [MediaServiceFeaturesController::class, 'updateBulkOrder']);
    });
});

// Маршруты для управления медиа файлами медиа услуг
Route::prefix('media-services/{serviceId}/media')->group(function () {
    Route::get('/', [MediaServiceMediaController::class, 'index']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [MediaServiceMediaController::class, 'store']);
        Route::post('/{groupId}', [MediaServiceMediaController::class, 'update']); // POST для FormData с _method=PUT
        Route::put('/{groupId}', [MediaServiceMediaController::class, 'update']);
        Route::delete('/{groupId}', [MediaServiceMediaController::class, 'destroy']);
        Route::post('/reorder', [MediaServiceMediaController::class, 'reorder']);
    });
});

// Маршруты для управления отзывами медиа страницы
Route::prefix('admin/media-testimonials')->group(function () {
    Route::get('/', [MediaTestimonialsController::class, 'index']);
    Route::get('/{id}', [MediaTestimonialsController::class, 'show']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [MediaTestimonialsController::class, 'store']);
        Route::post('/reorder', [MediaTestimonialsController::class, 'reorder']);
        Route::post('/{id}', [MediaTestimonialsController::class, 'update']); // POST для FormData с _method=PUT
        Route::put('/{id}', [MediaTestimonialsController::class, 'update']);
        Route::delete('/{id}', [MediaTestimonialsController::class, 'destroy']);
    });
});

// Маршруты для управления шагами процесса медиа страницы
Route::prefix('admin/media-process-steps')->group(function () {
    Route::get('/', [MediaProcessStepsController::class, 'index']);
    Route::get('/{id}', [MediaProcessStepsController::class, 'show']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/', [MediaProcessStepsController::class, 'store']);
        Route::post('/reorder', [MediaProcessStepsController::class, 'reorder']);
        Route::post('/{id}', [MediaProcessStepsController::class, 'update']); // POST для FormData с _method=PUT
        Route::put('/{id}', [MediaProcessStepsController::class, 'update']);
        Route::delete('/{id}', [MediaProcessStepsController::class, 'destroy']);
    });
});

// Маршруты для SEO управления
Route::prefix('seo')->group(function () {
    // Глобальные SEO настройки
    Route::get('/settings', [SEOController::class, 'getGlobalSettings']);
    Route::get('/pages', [SEOController::class, 'getPageSettings']);
    Route::get('/projects/{slug}', [SEOController::class, 'getProjectSeo']);
    Route::get('/blog/{slug}', [SEOController::class, 'getBlogPostSeo']);
    Route::get('/overview', [SEOController::class, 'getSeoOverview']);
    Route::get('/test', [SEOController::class, 'test']);
    
    // Тестовый эндпоинт для проверки авторизации
    Route::middleware(['auth:sanctum'])->post('/test-auth', function (Request $request) {
        \Log::info('[SEO Test Auth] Request received', [
            'user' => $request->user() ? $request->user()->id : 'not authenticated',
            'bearer_token' => $request->bearerToken() ? substr($request->bearerToken(), 0, 20) . '...' : 'none',
            'headers' => $request->headers->all()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Authenticated successfully',
            'user' => $request->user()
        ]);
    });
    
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/settings', [SEOController::class, 'updateGlobalSettings']);
        Route::post('/pages/{pageType}', [SEOController::class, 'updatePageSettings']);
        Route::post('/projects/{slug}', [SEOController::class, 'updateProjectSeo']);
        Route::post('/blog/{slug}', [SEOController::class, 'updateBlogPostSeo']);
    });
});

// Image optimization routes
Route::prefix('images')->group(function () {
    Route::get('/optimize', [App\Http\Controllers\Api\ImageOptimizationController::class, 'optimize']);
    Route::get('/stats', [App\Http\Controllers\Api\ImageOptimizationController::class, 'getStats']);
    Route::middleware(['auth:sanctum', 'refresh.token'])->group(function () {
        Route::post('/clear-cache', [App\Http\Controllers\Api\ImageOptimizationController::class, 'clearCache']);
    });
});

// SEO метаданные для проектов
Route::get('/projects/{slug}/seo', [ProjectController::class, 'getSEOMetadata']);
Route::middleware(['auth:sanctum', 'refresh.token'])->post('/projects/{slug}/seo', [ProjectController::class, 'updateSEOMetadata']);

// SEO метаданные для постов блога
Route::get('/blog-posts/{slug}/seo', [BlogPostController::class, 'getSEOMetadata']);
Route::middleware(['auth:sanctum', 'refresh.token'])->post('/blog-posts/{slug}/seo', [BlogPostController::class, 'updateSEOMetadata']);

// Публичный API для медиа страницы
Route::get('/public/media-page', [MediaPagePublicController::class, 'index']);
Route::post('/public/media-page/refresh-cache', [MediaPagePublicController::class, 'refreshCache'])->middleware(['throttle:5,1']);

// Маршруты для контактной формы
Route::prefix('contact')->middleware(['throttle:3,1'])->group(function () {
    Route::post('/send', [ContactController::class, 'sendContactEmail'])->name('contact.send');
    Route::post('/project', [ContactController::class, 'sendProjectInquiry'])->name('contact.project');
});
