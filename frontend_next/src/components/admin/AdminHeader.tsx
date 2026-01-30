'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminHeader() {
  const pathname = usePathname();

  // Не показываем заголовок на странице логина
  if (pathname === '/admin/login') {
    return null;
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <SidebarTrigger className="hover:cursor-pointer" />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout}
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Выйти
      </Button>
    </div>
  );
}