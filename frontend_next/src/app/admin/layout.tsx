'use client';

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import ErrorBoundary from "@/components/ErrorBoundary"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useTokenRefresh } from "@/hooks/useTokenRefresh"
import { SWRProvider } from "@/lib/swr-config"

// Принудительно делаем админку динамической для продакшн сборки
export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== '/admin/login'
  
  // Интегрируем hook для автоматического обновления токенов
  // Hook активен только когда пользователь авторизован (есть токен)
  useTokenRefresh()

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/admin/login';
    }
  };

  return (
    <SWRProvider>
      <SidebarProvider>
        {showSidebar && <AppSidebar />}
        <main className={showSidebar ? "flex-1" : "w-full"}>
          {showSidebar && (
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
          )}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </SidebarProvider>
    </SWRProvider>
  )
}