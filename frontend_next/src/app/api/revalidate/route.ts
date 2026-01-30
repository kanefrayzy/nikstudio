import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route для ревалидации главной страницы
 * Вызывается после успешного обновления контента в админке
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем путь для ревалидации из тела запроса
    const body = await request.json();
    const path = body.path || '/';

    // Выполняем ревалидацию указанного пути
    revalidatePath(path);

    return NextResponse.json(
      {
        success: true,
        message: 'Страница успешно обновлена',
        revalidated: true,
        path,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка ревалидации:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Ошибка обновления страницы',
        revalidated: false,
      },
      { status: 500 }
    );
  }
}
