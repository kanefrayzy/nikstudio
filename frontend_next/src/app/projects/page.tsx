import { Metadata } from 'next';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import Header from "@/components/Header";
import Header_mobile from "@/components/Header_mobile";
import Footer from "@/components/Footer";
import FooterMobile from "@/components/Footer_mobile";
import ProjectCategories from '@/components/ProjectCategories';
import StructuredDataComponent from '@/components/StructuredDataComponent';
import ProjectsList from './ProjectsList';

interface Project {
  id: number;
  slug: string;
  projects_page_image?: string;
  projects_page_title?: string;
  main_title: string;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
}

// Fetch projects with ISR
async function getProjects(categoryId?: string | null) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let url = `${apiUrl}/api/projects`;

    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 5 } // ISR: Revalidate every 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Ошибка при загрузке проектов: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Ошибка при загрузке проектов:', error);
    return [];
  }
}

// Generate metadata for projects listing page
export async function generateMetadata(): Promise<Metadata> {
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
  const pageSettings = await SEOMetadataGenerator.fetchPageSettings('projects_list');

  return SEOMetadataGenerator.generateMetadata({
    content: null,
    globalSettings,
    pageSettings,
    pageType: 'projects_list'
  });
}

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ category_id?: string }>
}) {
  const params = await searchParams;
  const categoryId = params.category_id;

  const projects = await getProjects(categoryId);
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

  return (
    <main className="min-h-screen bg-[#0E1011] overflow-x-hidden">
      {/* Structured Data */}
      <StructuredDataComponent
        contentType="project"
        globalSettings={globalSettings}
      />

      {/* Header */}
      <Header />
      <Header_mobile />

      {/* Main Content */}
      <div className="pt-0 sm:pt-20 lg:pt-32">
        {/* Hero Section */}
        <section className="px-5 sm:px-12 lg:px-24 mb-12 lg:mb-24">
          <div className="flex flex-col gap-8 lg:gap-16">
            <div className="flex flex-col gap-4">
              <h1 className="text-[60px] sm:text-[96px] md:text-[96px] lg:text-[150px] xl:text-[200px] 2xl:text-[280px] 3xl:text-[320px] font-geometria font-extrabold uppercase text-white leading-none">
                Проекты
              </h1>
              <p className="text-white text-[32px] sm:text-4xl lg:text-[80px] 3xl:text-[100px] font-inter font-medium sm:font-semibold leading-[100%] sm:leading-[120%] sm:tracking-[-2px] max-w-[1400px] max-w-full-3xl mt-[25px] sm:mt-2 3xl:mt-4">
                Весь визуальный посыл в едином ключе создаёт сильный бренд и надежную репутацию
              </p>
            </div>

            {/* Project Categories */}
            <ProjectCategories
              selectedCategory={categoryId ? parseInt(categoryId) : null}
            />
          </div>
        </section>

        {/* Projects Grid */}
        <ProjectsList projects={projects} />
      </div>

      {/* Footer */}
      <Footer />
      <FooterMobile />
    </main>
  );
}
