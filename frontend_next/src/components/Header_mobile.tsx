'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О нас" },
  { href: "/projects", label: "Проекты" },
  { href: "/media", label: "Медиа" },
  { href: "/blog", label: "Блог" },
  { href: "/contact", label: "Связаться" },
];

export default function Header_mobile() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="flex sm:hidden justify-between items-center pl-5 pr-7 pt-5 pb-7 w-full bg-[#0E1011] relative z-50">
      {/* Логотип слева */}
      <div className="flex-shrink-0">
        <Link href="/">
          <Image
            src="/images/header/logo_header.svg"
            alt="Логотип"
            width={163.33}
            height={60}
            priority
            quality={100}
          />
        </Link>
      </div>

      {/* Иконка бургера справа */}
      <button
        onClick={toggleMenu}
        aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
        className="focus:outline-none"
      >
        <Image
          src={menuOpen ? "/images/header/close.svg" : "/images/header/burger.svg"}
          alt={menuOpen ? "Закрыть меню" : "Открыть меню"}
          width={24}
          height={24}
          priority
        />
      </button>

      {/* Затемнение фона при открытом меню */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-[#0E1011] bg-opacity-50 z-40"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Выдвижное меню справа */}
      <nav
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Мобильное меню"
      >
        <div className="flex flex-col h-full p-6">
          {/* Кнопка закрытия внутри меню */}
          <button
            onClick={toggleMenu}
            aria-label="Закрыть меню"
            className="self-end mb-8 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1011" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-x-icon lucide-square-x"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </button>

          {/* Список навигационных ссылок */}
          <ul className="flex flex-col space-y-6 text-lg">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={() => setMenuOpen(false)} className="block text-gray-800 hover:text-blue-600">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Дополнительное пространство внизу меню */}
          <div className="flex-grow" />
        </div>
      </nav>
    </header>
  );
}