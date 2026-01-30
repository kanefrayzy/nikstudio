<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BlogPost;
use App\Models\BlogPostBlock;
use Illuminate\Http\JsonResponse;

class BlogBlockController extends Controller
{
    public function store(Request $request, $slug): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'paragraph_1' => 'required|string',
            'paragraph_2' => 'nullable|string',
            'paragraph_3' => 'nullable|string',
        ]);

        $post = BlogPost::where('slug', $slug)->first();

        if (!$post) {
            return response()->json(['status' => 'error', 'message' => 'Пост не найден'], 404);
        }

        $block = new BlogPostBlock();
        $block->title = $request->input('title');
        $block->paragraph_1 = $request->input('paragraph_1');
        $block->paragraph_2 = $request->input('paragraph_2');
        $block->paragraph_3 = $request->input('paragraph_3');
        $block->blog_post_id = $post->id;
        $block->save();

        return response()->json(['status' => 'success', 'data' => $block]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'paragraph_1' => 'required|string',
            'paragraph_2' => 'nullable|string',
            'paragraph_3' => 'nullable|string',
        ]);

        $block = BlogPostBlock::find($id);

        if (!$block) {
            return response()->json(['status' => 'error', 'message' => 'Блок не найден'], 404);
        }

        $block->title = $request->input('title');
        $block->paragraph_1 = $request->input('paragraph_1');
        $block->paragraph_2 = $request->input('paragraph_2');
        $block->paragraph_3 = $request->input('paragraph_3');
        $block->save();

        return response()->json(['status' => 'success', 'data' => $block]);
    }

    public function destroy($id): JsonResponse
    {
        $block = BlogPostBlock::find($id);

        if (!$block) {
            return response()->json(['status' => 'error', 'message' => 'Блок не найден'], 404);
        }

        $block->delete();

        return response()->json(['status' => 'success', 'message' => 'Блок успешно удалён']);
    }
}