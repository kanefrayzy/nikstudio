import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="hidden sm:flex flex-col sm:flex-row justify-between items-center px-6 sm:px-12 lg:px-24 pt-16 w-full absolute top-0 left-0 right-0 z-10">
      {/* Logo */}
      <Link href="/">
        <Image
          src="/images/header/logo_header.svg"
          alt="NIK Studio Logo"
          width={82}
          height={30}
          className="text-[#DE063A]"
          priority
        />
      </Link>

      {/* Navigation */}
      <nav className="flex sm:flex-row flex-col items-center gap-6 md:gap-12 -ml-[10px] sm:mt-0 mt-4">
        <Link
          href="/about"
          className="text-white font-inter font-semibold text-lg md:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          О нас
        </Link>
        <Link
          href="/projects"
          className="text-white font-inter font-semibold text-lg md:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Проекты
        </Link>
        <Link
          href="/media"
          className="text-white font-inter font-semibold text-lg md:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Медиа
        </Link>
        <Link
          href="/blog"
          className="text-white font-inter font-semibold text-lg md:text-[22px] leading-none hover:text-[#DE063A] transition-colors duration-300"
        >
          Блог
        </Link>
      </nav>

      {/* CTA Button */}
      <div className="flex flex-col gap-0.5 justify-center 2xl:-mr-[21px] sm:mt-0 mt-4">
        <Link
          href="/contact"
          className="text-white font-inter font-semibold text-lg md:text-[22px] leading-none underline underline-offset-5 decoration-2 hover:text-[#DE063A] transition-colors duration-300"
        >
          Связаться
        </Link>
      </div>
    </header>
  );
} 