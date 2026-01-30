import Link from "next/link";

export default function Header_mini() {
  return (
    <header className="hidden sm:flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-center px-6 sm:px-12 lg:px-24 pt-8 lg:pt-16 pb-0 w-full">
      <nav className="flex items-center gap-4 sm:gap-8">
        <Link
          href="/about"
          className="text-white font-inter font-semibold text-lg sm:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300 whitespace-nowrap"
        >
          О нас
        </Link>
        <Link
          href="/projects"
          className="text-white font-inter font-semibold text-lg sm:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Проекты
        </Link>
        <Link
          href="/media"
          className="text-white font-inter font-semibold text-lg sm:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Медиа
        </Link>
        <Link
          href="/blog"
          className="text-white font-inter font-semibold text-lg sm:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Блог
        </Link>
      </nav>
      <div className="flex flex-col gap-0.5 justify-center mt-4 sm:mt-0 lg:mt-4 xl:mt-0 xl:mr-0 2xl:-mr-[21px]">
        <Link
          href="/contact"
          className="text-white font-inter font-semibold text-lg sm:text-[22px] leading-none underline underline-offset-5 decoration-2 hover:text-[#DE063A] transition-colors duration-300"
        >
          Связаться
        </Link>
      </div>
    </header>
  );
} 