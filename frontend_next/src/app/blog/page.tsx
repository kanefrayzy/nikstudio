import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import Header from '@/components/Header';
import Header_mobile from '@/components/Header_mobile';
import Footer from '@/components/Footer';
import FooterMobile from "@/components/Footer_mobile";
import BlogList from './BlogList';

const inter = Inter({
  weight: ['400', '600'],
  subsets: ['cyrillic', 'latin'],
  variable: '--font-inter',
  display: 'swap',
});

interface BlogPost {
  id: number;
  title: string;
  description: string;
  image: string;
  position: string;
  created_at: string;
  updated_at: string;
  slug: string;
  status: boolean | string | number;
}

interface ApiResponse {
  status: string;
  data: BlogPost[];
}

function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return '/images/blog/blog_img1.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/storage/')) return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
  if (imagePath.startsWith('/images/')) return imagePath;
  return `${process.env.NEXT_PUBLIC_API_URL}/storage/blog/${imagePath}`;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog-posts`, {
      next: { revalidate: 3600 }, // ISR: Revalidate every hour
    });

    if (!res.ok) throw new Error('Failed to fetch blog posts');

    const data: ApiResponse = await res.json();
    return data.data?.filter(post => post.status === true).map(post => ({
      ...post,
      image: getImageUrl(post.image),
    })) || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Generate metadata for blog listing page
export async function generateMetadata(): Promise<Metadata> {
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
  const pageSettings = await SEOMetadataGenerator.fetchPageSettings('blog_list');

  return SEOMetadataGenerator.generateMetadata({
    content: null,
    globalSettings,
    pageSettings,
    pageType: 'blog_list'
  });
}

export default async function Page() {
  const blogPosts = await getBlogPosts();

  return (
    <main className={`relative flex flex-col min-h-screen bg-[#0E1011] max-w-[2560px] w-full mx-auto ${inter.variable}`}>
      <Header />
      <Header_mobile />

      <section className="w-full pt-1 sm:pt-38 pb-24 px-6 sm:px-12 lg:px-24 3xl:px-[120px] 3xl:pt-[200px] 3xl:pb-[100px]">
        <div className="flex flex-col">
          <h1 className="text-white text-[60px] sm:text-[200px] 2xl:text-[280px] 3xl:text-[320px] font-geometria font-extrabold uppercase leading-[100%]">
            БЛОГ
          </h1>
          <p className="mt-[29px] sm:mt-[10px] text-white text-[32px] sm:text-4xl md:text-6xl lg:text-[80px] 3xl:text-[100px] font-geometria font-medium sm:font-semibold leading-[100%] sm:leading-[1.2] tracking-[-0.025em] max-w-[1400px]">
            Новости и тенденции, которые помогут усовершенствовать стратегию вашего бренда.
          </p>
        </div>
      </section>

      <BlogList posts={blogPosts} />

      <Footer />
      <FooterMobile />
    </main>
  );
}
