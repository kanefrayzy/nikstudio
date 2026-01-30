'use client';

import React from "react";
import { FileText, BriefcaseBusiness, LayoutGrid, Settings, Monitor, LogOut, FileEdit, Key } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation'; // Импортируем хуки

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Главная страница",
    url: "/admin/homepage-editor",
    icon: FileEdit,
  },
  {
    title: "Блог",
    url: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Категории",
    url: "/admin/category",
    icon: LayoutGrid,
  },
  {
    title: "Проекты",
    url: "/admin/projects",
    icon: BriefcaseBusiness,
  },
  {
    title: "Медиа-страница",
    url: "/admin/media-page",
    icon: Monitor,
  },
  {
    title: "SEO управление",
    url: "/admin/seo",
    icon: Settings,
  },
];

export function AppSidebar() {
  // Получаем текущий путь и роутер
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  // Функция выхода из системы
  const handleLogout = () => {
    // Удаляем токен из cookies
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Перенаправляем на страницу входа
    router.push('/admin/login');
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Если компонент еще не смонтирован, рендерим без активных состояний
  if (!mounted) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <Link href="/" target="_blank" className="block p-4">
              <Image
                src="/images/footer/logo_footer.svg"
                alt="Логотип"
                width={120}
                height={40}
                priority
              />
            </Link>
            <SidebarGroupLabel>Приложение</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className="hover:!text-[#DE063A]"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Настройки */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Настройки</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/admin/settings/change-password"
                      className="hover:!text-[#DE063A]"
                    >
                      <Key />
                      <span>Сменить пароль</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Кнопка выхода */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} className="hover:!text-[#DE063A] cursor-pointer">
                    <LogOut />
                    <span>Выйти</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <Link href="/" target="_blank" className="block p-4">
            <Image
              src="/images/footer/logo_footer.svg"
              alt="Логотип"
              width={120}
              height={40}
              priority
            />
          </Link>
          <SidebarGroupLabel>Приложение</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                // Определяем, является ли текущий пункт меню активным.
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`${isActive ? "text-[#DE063A]" : ""
                          } hover:!text-[#DE063A]`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Настройки */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Настройки</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/admin/settings/change-password"
                    className={`${pathname === '/admin/settings/change-password' ? "text-[#DE063A]" : ""
                      } hover:!text-[#DE063A]`}
                  >
                    <Key />
                    <span>Сменить пароль</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Кнопка выхода */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="hover:!text-[#DE063A] cursor-pointer">
                  <LogOut />
                  <span>Выйти</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}