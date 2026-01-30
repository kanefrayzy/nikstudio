import { Metadata } from 'next';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import ProjectDetailClient from './ProjectDetailClient';

interface ProjectData {
  main_title: string;
  projects_page_title?: string;
  description: string;
  main_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
  created_at: string;
  updated_at: string;
  slug: string;
}

interface ApiResponse {
  success: boolean;
  data?: ProjectData;
  message?: string;
}

// Fetch project data with ISR
async function getProjectData(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/projects/${slug}`, {
      next: { revalidate: 1800 } // ISR: Revalidate every 30 minutes
    });

    if (!response.ok) {
      return null;
    }

    const data: ApiResponse = await response.json();
    return data.success && data.data ? data.data : null;
  } catch (error) {
    console.error('Error fetching project data:', error);
    return null;
  }
}

// Generate metadata for project detail page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const projectData = await getProjectData(slug);

    // Fetch global SEO settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

    // Generate metadata using the SEO system
    return SEOMetadataGenerator.generateMetadata({
      content: projectData ? {
        title: projectData.main_title,
        main_title: projectData.main_title,
        description: projectData.projects_page_title || projectData.description,
        main_image: projectData.main_image,
        seo_title: projectData.seo_title,
        seo_description: projectData.seo_description,
        seo_image: projectData.seo_image,
        created_at: projectData.created_at,
        updated_at: projectData.updated_at,
        slug: projectData.slug
      } : null,
      globalSettings,
      pageType: 'project',
      slug: slug
    });
  } catch (error) {
    console.error('Error generating project metadata:', error);

    // Fallback to global settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
    const { slug } = await params;
    return SEOMetadataGenerator.generateMetadata({
      content: null,
      globalSettings,
      pageType: 'project',
      slug: slug
    });
  }
}

export default async function ProjectPage({ params: _params }: { params: Promise<{ slug: string }> }) {
  // Note: ProjectDetailClient still fetches data client-side for now
  // This maintains existing functionality while metadata uses ISR
  // Future optimization: Pass server-fetched data as props to client component
  return <ProjectDetailClient />;
}