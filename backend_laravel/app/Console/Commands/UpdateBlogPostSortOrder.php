<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BlogPost;

class UpdateBlogPostSortOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'blog:update-sort-order';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Обновляет порядковые номера для существующих постов блога';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Обновление порядковых номеров постов блога...');

        // Получаем все посты, отсортированные по дате создания (новые первыми)
        $posts = BlogPost::orderBy('created_at', 'desc')->get();

        if ($posts->isEmpty()) {
            $this->info('Посты не найдены.');
            return;
        }

        $this->info("Найдено постов: {$posts->count()}");

        // Присваиваем порядковые номера начиная с 0
        foreach ($posts as $index => $post) {
            if ($post->sort_order === null || $post->sort_order === 0) {
                $post->sort_order = $index;
                $post->save();
                $this->line("Пост '{$post->title}' - установлен порядок: {$index}");
            } else {
                $this->line("Пост '{$post->title}' - порядок уже установлен: {$post->sort_order}");
            }
        }

        $this->info('Обновление завершено!');
    }
}
