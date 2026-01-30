'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  image: string;
  position: string;
  slug: string;
}

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visiblePosts = isMobile && !showAll ? posts.slice(0, 3) : posts;

  return (
    <>
      <section className="w-full flex flex-wrap -mt-14 sm:mt-0">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/3 group">
              <article className="relative bg-[#0E1011] transition-colors duration-300 group-hover:bg-white h-full">
                <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={post.image || '/images/blog/blog_img1.jpg'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    quality={85}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : undefined}
                  />
                </div>
                <div className="px-[20px] sm:px-0 pb-[78px] sm:pb-0 pt-[38px] sm:pt-0 sm:p-8 md:p-20 3xl:p-[120px] flex flex-col gap-12 3xl:gap-16 bg-inherit">
                  <span className="text-white/60 group-hover:text-black/60 text-[20px] sm:text-xl md:text-[30px] 3xl:text-[40px] font-geometria font-light sm:font-normal leading-none transition-colors duration-300">
                    {post.position || 'Блог'}
                  </span>
                  <div className="flex flex-col gap-4 3xl:gap-6">
                    <h2 className="-mt-7 sm:mt-0 text-white group-hover:text-black text-[24px] sm:text-3xl xl:text-[36px] 2xl:text-[48px] 3xl:text-[60px] font-geometria font-bold uppercase leading-[1.3] transition-colors duration-300">
                      {post.title}
                    </h2>
                    <p className="text-white group-hover:text-black text-[16px] sm:text-lg md:text-[22px] 3xl:text-[28px] font-inter font-normal leading-[1.7] transition-colors duration-300">
                      {post.description}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          ))
        ) : (
          <Link href="/blog/pochemu-produmannyj-dizajn-prodaet" className="w-full md:w-1/2 lg:w-1/3 xl:w-1/3 group">
            <article className="relative bg-[#0E1011] transition-colors duration-300 group-hover:bg-white h-full">
              <div className="relative w-full aspect-square overflow-hidden">
                <Image
                  src="/images/blog/blog_img1.jpg"
                  alt="Почему продуманный дизайн продает"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  quality={85}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
              <div className="p-8 md:p-20 3xl:p-[120px] flex flex-col gap-12 3xl:gap-16 bg-inherit">
                <span className="text-white/60 group-hover:text-black/60 text-xl md:text-[30px] 3xl:text-[40px] font-geometria font-normal leading-none transition-colors duration-300">
                  (Креативный директор)
                </span>
                <div className="flex flex-col gap-4 3xl:gap-6">
                  <h2 className="text-white group-hover:text-black text-3xl xl:text-[36px] 2xl:text-[48px] 3xl:text-[60px] font-geometria font-bold uppercase leading-[1.3] transition-colors duration-300">
                    ПОЧЕМУ ПРОДУМАННЫЙ ДИЗАЙН ПРОДАЕТ
                  </h2>
                  <p className="text-white group-hover:text-black text-lg md:text-[22px] 3xl:text-[28px] font-inter font-normal leading-[1.7] transition-colors duration-300">
                    Discover key strategies to create a memorable and impactful brand for your small business.
                  </p>
                </div>
              </div>
            </article>
          </Link>
        )}
      </section>

      {isMobile && posts.length > 3 && (
        <div className="w-full flex justify-center mt-0 sm:hidden mb-15">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex flex-row items-center justify-between gap-2 px-4 w-[173px] h-[40px] text-white border-2 border-white rounded-full font-inter font-semibold text-[16px] hover:bg-white hover:text-[#0E1011] transition-colors duration-300"
          >
            {showAll ? 'скрыть' : 'смотреть все'}
            <Image
              src={showAll ? '/images/blog/arrow-up.svg' : '/images/blog/arrow.svg'}
              alt="Arrow"
              width={12}
              height={6}
              loading="lazy"
            />
          </button>
        </div>
      )}
    </>
  );
}
