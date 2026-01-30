export interface ProjectDetail {
  id: number;
  project_id: number;
  title: string;
  subtitle: string;
  client: string;
  year: number;
  created_at: string;
  updated_at: string;
  blocks?: ProjectDetailBlock[];
  hero_media_items?: ProjectDetailHeroMedia[]; // Добавить это поле
}

export interface ProjectDetailBlock {
  id: number;
  project_detail_id: number;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  order: number;
  created_at: string;
  updated_at: string;
  media_items?: ProjectDetailBlockMedia[]; // Используем mediaItems как в Laravel модели
}

export interface ProjectDetailHeroMedia {
  id: number;
  project_detail_id: number;
  group_id: number;
  group_type: 'single' | 'double';
  file_path: string;
  file_type: 'image' | 'video';
  alt_text: string;
  poster_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetailBlockMedia {
  id: number;
  project_detail_block_id: number;
  group_id: number; // Добавлено недостающее поле
  group_type: 'single' | 'double'; // Добавлено недостающее поле
  file_path: string; // Изменено с url на file_path
  file_type: 'image' | 'video'; // Изменено с type на file_type
  alt_text: string;
  poster_path: string | null; // Добавлено недостающее поле
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  main_image: string;
  projects_page_image: string;
  logo: string;
  main_title: string;
  projects_page_title: string;
  year: number;
  slug: string;
  created_at: string;
  updated_at: string;
  categories: ProjectCategory[];
  detail?: ProjectDetail;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}