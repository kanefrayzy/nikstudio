import Image from "next/image";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Header_mini from "@/components/Header_mini";
import Header_mobile from "@/components/Header_mobile";
import Footer from "@/components/Footer";
import FooterMobile from "@/components/Footer_mobile";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredDataScript } from "@/components/StructuredDataComponent";
import { SEOMetadataGenerator } from "@/lib/seo-metadata";

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // Fetch blog post data for SEO metadata
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/blog-posts/${slug}`, {
      next: { revalidate: 3600 } // ISR: Revalidate every hour
    });

    let blogPostData = null;
    if (response.ok) {
      const data: ApiResponse = await response.json();
      if (data.status === 'success' && data.data) {
        blogPostData = data.data;
      }
    }

    // Fetch global SEO settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

    // Generate metadata using the SEO system
    return SEOMetadataGenerator.generateMetadata({
      content: blogPostData ? {
        title: blogPostData.title,
        main_title: blogPostData.title,
        description: blogPostData.description,
        main_image: blogPostData.image,
        seo_title: blogPostData.seo_title,
        seo_description: blogPostData.seo_description,
        seo_image: blogPostData.seo_image,
        created_at: blogPostData.created_at,
        updated_at: blogPostData.updated_at,
        slug: blogPostData.slug
      } : null,
      globalSettings,
      pageType: 'blog',
      slug: slug
    });
  } catch (error) {
    console.error('Error generating blog metadata:', error);
    
    // Fallback to global settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
    return SEOMetadataGenerator.generateMetadata({
      content: null,
      globalSettings,
      pageType: 'blog',
      slug: slug
    });
  }
}

// Типы данных для блога
interface BlogPostBlock {
  title: string;
  paragraph_1: string;
  paragraph_2: string;
  paragraph_3: string;
}

interface BlogPost {
  image: string;
  title: string;
  description: string;
  blocks: BlogPostBlock[];
  slug?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BlogPosts {
  status: string;
  data: BlogPost[];
}

interface ApiResponse {
  status: string;
  data: BlogPost;
}

// Функция для формирования корректного URL изображения
function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return "/images/blog/blog_img1.jpg";

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  if (imagePath.startsWith("/storage/")) {
    return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
  }

  if (imagePath.startsWith("/images/")) {
    return imagePath;
  }

  return `${process.env.NEXT_PUBLIC_API_URL}/storage/blog/${imagePath}`;
}

// Функция для загрузки поста с API
async function getBlogPost(slug: string): Promise<BlogPost> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blog-posts/${slug}`,
      { next: { revalidate: 3600 } } // ISR: Revalidate every hour
    );

    if (!res.ok) {
      throw new Error("Failed to fetch blog post");
    }

    const data: ApiResponse = await res.json();

    return {
      ...data.data,
      image: getImageUrl(data.data.image),
    };
  } catch (error) {
    console.error("Error fetching blog post:", error);
    notFound();
  }
}

// Функция для загрузки всех постов блога с API
async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blog-posts`,
      { next: { revalidate: 3600 } } // ISR: Revalidate every hour
    );

    if (!res.ok) {
      throw new Error("Failed to fetch blog posts");
    }

    const data: BlogPosts = await res.json();

    return (
      data.data?.map((post) => ({
        ...post,
        image: getImageUrl(post.image),
      })) || []
    );
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

// Сам компонент страницы, правильный тип props

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getBlogPost(slug);
  const allPosts = await getAllBlogPosts();
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

  const relatedPosts = allPosts.filter((relatedPost) => relatedPost.slug !== slug).slice(0, 3);

  // Transform blog post data for SEO
  const seoContent = {
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    seo_image: post.seo_image,
    title: post.title,
    main_title: post.title,
    description: post.description,
    main_image: post.image,
    created_at: post.created_at,
    updated_at: post.updated_at,
    slug: post.slug
  };

  return (
    <main
      className={`relative flex flex-col min-h-screen bg-[#0E1011] max-w-[2560px] w-full mx-auto ${inter.variable}`}
    >
      {/* Structured Data */}
      <StructuredDataScript
        contentType="blog"
        content={seoContent}
        globalSettings={globalSettings}
        slug={slug}
      />

      {/* Header */}
      <Header_mobile />
      <div className="absolute top-0 right-0 w-full lg:w-1/2 z-10">
        <Header_mini />
      </div>

      <div className="flex flex-col lg:flex-row justify-center w-full relative">
        {/* Left Side - Image */}
        <div className="w-full lg:w-1/2 bg-white relative h-[360px] sm:h-[540px] md:h-[720px] lg:h-[1080px] 3xl:h-[1440px]">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={post.image || "/images/blog/blog_img1.jpg"}
              alt={post.title}
              className="object-cover object-center w-full h-full"
              width={1787}
              height={1810}
              priority
            />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-end">
          <div className="flex flex-col p-5 sm:p-12 lg:p-24 3xl:p-[120px] gap-12 3xl:gap-16 lg:pt-[564px] 3xl:pt-[700px] lg:pb-[64px] 3xl:pb-[80px] h-full">
            <div className="flex flex-col gap-4 3xl:gap-6">
              <h1 className="text-white text-[32px] sm:text-5xl md:text-6xl lg:text-[44px] xl:text-[56px] 2xl:text-[80px] 3xl:text-[100px] font-bold uppercase leading-[120%] sm:leading-[110%] font-geometria">
                {post.title}
              </h1>
              <p className="text-white text-[20px] sm:text-lg lg:text-[24px] 3xl:text-[32px] leading-[100%] sm:leading-[170%] font-inter mt-[5px] sm:mt-2 3xl:mt-4">
                {post.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-1/2 ml-auto">
        <div className="flex flex-col p-5 sm:p-12 lg:p-24 3xl:p-[120px] lg:py-[96px] 3xl:py-[120px] gap-16 lg:gap-[64px] 3xl:gap-[80px] -mt-[10px]">
          {post.blocks.map((block, index) => (
            <div key={index} className="flex flex-col gap-2 3xl:gap-4">
              <h2 className="text-white text-2xl sm:text-3xl lg:text-[48px] 3xl:text-[60px] font-bold uppercase leading-[130%] font-geometria">
                {block.title}
              </h2>
              <div className="text-white/60 text-base sm:text-lg lg:text-[20px] 3xl:text-[28px] leading-[180%] font-inter space-y-10 3xl:space-y-[60px]">
                {block.paragraph_1 && <p>{block.paragraph_1}</p>}
                {block.paragraph_2 && <p>{block.paragraph_2}</p>}
                {block.paragraph_3 && <p>{block.paragraph_3}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related News Section */}
      <div className="w-full">
        <div className="flex flex-col bg-[#181A1B] p-5 sm:p-12 lg:p-24 3xl:p-[120px] lg:pt-[150px] 3xl:pt-[200px] lg:pb-[96px] 3xl:pb-[120px] mt-[25px]">
          <h2 className="text-white text-6xl sm:text-8xl xl:text-[200px] 2xl:text-[280px] 3xl:text-[320px] font-bold uppercase leading-[100%] font-geometria">
            ЕЩЁ НОВОСТИ
          </h2>
          <p className="text-white text-2xl sm:text-4xl lg:text-[80px] 3xl:text-[100px] font-semibold leading-[120%] font-inter max-w-[1400px] max-w-full-3xl mt-6 sm:mt-8 lg:mt-2 3xl:mt-4">
            Опыт работы с большими компаниями даёт понимание основных рабочих инструментов
          </p>
        </div>
      </div>

      {/* Related Posts Grid */}
      <div className="w-full">
        <div className="flex flex-col w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {relatedPosts.map((relatedPost, index) => (
              <Link key={index} href={`/blog/${relatedPost.slug}`} className="group h-full">
                <article
                  className={`${
                    index % 2 === 0 ? "bg-[#181A1B]" : "bg-[#1F2122]"
                  } transition-colors duration-300 group-hover:bg-white h-full flex flex-col`}
                >
                  <div className="relative w-full aspect-square overflow-hidden flex-shrink-0">
                    <Image
                      src={relatedPost.image || "/images/blog/blog_img1.jpg"}
                      alt={relatedPost.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      width={640}
                      height={640}
                    />
                  </div>
                  <div className="flex flex-col p-6 sm:p-10 lg:p-20 3xl:p-[120px] gap-6 sm:gap-10 lg:gap-12 3xl:gap-16 bg-inherit flex-grow">
                    <span className="text-white/60 group-hover:text-black/60 text-xl lg:text-[30px] 3xl:text-[40px] font-normal font-geometria transition-colors duration-300">
                      (Креативный директор)
                    </span>
                    <div className="flex flex-col gap-4 3xl:gap-6">
                      <h3 className="text-white group-hover:text-black text-2xl sm:text-3xl xl:text-[40px] 2xl:text-[48px] 3xl:text-[60px] font-bold uppercase leading-[130%] font-geometria transition-colors duration-300">
                        {relatedPost.title}
                      </h3>
                      <p className="text-white/60 group-hover:text-black/60 text-base sm:text-lg lg:text-[22px] 3xl:text-[28px] leading-[170%] font-inter transition-colors duration-300">
                        {relatedPost.description}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      <FooterMobile />
    </main>
  );
}
