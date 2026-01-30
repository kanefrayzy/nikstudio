"use client"

/**
 * Admin Interface Compatibility Demo Page
 * Demonstrates cross-browser compatibility features for admin components
 */

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/CompatibleDialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/CompatibleSelect"
import { CompatibleFileInput } from "@/components/ui/CompatibleFileInput"
import { 
  CompatibleSpinner, 
  CompatibleLoadingButton, 
  CompatibleLoadingOverlay, 
  CompatibleProgress,
  CompatibleSkeleton 
} from "@/components/ui/CompatibleLoader"
import { 
  AdminCompatibilityProvider, 
  useAdminCompatibility, 
  AdminCompatibilityWarnings 
} from "@/components/AdminCompatibilityProvider"
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Upload, 
  Settings, 
  FileText,
  Loader2
} from "lucide-react"

// Demo component that uses compatibility features
const CompatibilityDemoContent: React.FC = () => {
  const { capabilities, utils: _utils, warnings: _warnings } = useAdminCompatibility();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectValue, setSelectValue] = React.useState("");
  const [files, setFiles] = React.useState<File[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("dialogs");

  // Simulate loading process
  const handleSimulateLoading = () => {
    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Simulate overlay loading
  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Демонстрация совместимости админ-интерфейса</h1>
        <p className="text-gray-600">
          Эта страница демонстрирует кроссбраузерную совместимость компонентов админ-интерфейса
        </p>
      </div>

      {/* Compatibility warnings */}
      <AdminCompatibilityWarnings />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dialogs">Диалоги</TabsTrigger>
          <TabsTrigger value="selects">Селекты</TabsTrigger>
          <TabsTrigger value="files">Файлы</TabsTrigger>
          <TabsTrigger value="loading">Загрузка</TabsTrigger>
        </TabsList>

        {/* Dialog Compatibility Demo */}
        <TabsContent value="dialogs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Совместимость диалогов
              </CardTitle>
              <CardDescription>
                Демонстрация кроссбраузерных диалогов с полифиллами для старых браузеров
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Поддержка браузера:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {capabilities.dialog.supportsNativeDialog ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        Нативные диалоги: {capabilities.dialog.supportsNativeDialog ? 'Поддерживаются' : 'Используется полифилл'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Тест диалога:</h4>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Открыть диалог</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Тестовый диалог</DialogTitle>
                        <DialogDescription>
                          Этот диалог работает во всех поддерживаемых браузерах с автоматическими полифиллами.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="test-input">Тестовое поле</Label>
                          <Input id="test-input" placeholder="Введите текст..." />
                        </div>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Диалог поддерживает навигацию с клавиатуры и автофокус.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button onClick={() => setDialogOpen(false)}>
                          Сохранить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Select Compatibility Demo */}
        <TabsContent value="selects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Совместимость селектов
              </CardTitle>
              <CardDescription>
                Демонстрация кроссбраузерных выпадающих списков с фоллбэками
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Поддержка браузера:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {capabilities.select.supportsCustomSelect ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        Кастомные селекты: {capabilities.select.supportsCustomSelect ? 'Поддерживаются' : 'Используется фоллбэк'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {capabilities.select.supportsMultiple ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        Множественный выбор: {capabilities.select.supportsMultiple ? 'Поддерживается' : 'Ограничено'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Тест селекта:</h4>
                  <div className="space-y-2">
                    <Label htmlFor="test-select">Выберите опцию</Label>
                    <Select value={selectValue} onValueChange={setSelectValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите значение..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Опция 1</SelectItem>
                        <SelectItem value="option2">Опция 2</SelectItem>
                        <SelectItem value="option3">Опция 3</SelectItem>
                        <SelectItem value="option4">Опция 4</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectValue && (
                      <p className="text-sm text-gray-600">
                        Выбрано: {selectValue}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Input Compatibility Demo */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Совместимость загрузки файлов
              </CardTitle>
              <CardDescription>
                Демонстрация кроссбраузерной загрузки файлов с различными вариантами интерфейса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Поддержка браузера:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {capabilities.fileInput.supportsFileApi ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        File API: {capabilities.fileInput.supportsFileApi ? 'Поддерживается' : 'Ограничено'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {capabilities.fileInput.supportsDragDrop ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        Drag & Drop: {capabilities.fileInput.supportsDragDrop ? 'Поддерживается' : 'Недоступно'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {capabilities.fileInput.supportsMultiple ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        Множественные файлы: {capabilities.fileInput.supportsMultiple ? 'Поддерживается' : 'Ограничено'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Информация о файлах:</h4>
                  {files && files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-gray-600">
                            {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Файлы не выбраны</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Стандартный инпут:</h4>
                  <CompatibleFileInput
                    accept="image/*"
                    multiple
                    maxSize={2 * 1024 * 1024} // 2MB
                    onChange={(files) => setFiles(files ? Array.from(files) : null)}
                    showPreview
                    variant="default"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Кнопка загрузки:</h4>
                  <CompatibleFileInput
                    accept="image/*"
                    multiple
                    maxSize={2 * 1024 * 1024} // 2MB
                    onChange={(files) => setFiles(files ? Array.from(files) : null)}
                    showPreview
                    variant="button"
                    buttonText="Выбрать изображения"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Drag & Drop зона:</h4>
                  <CompatibleFileInput
                    accept="image/*"
                    multiple
                    maxSize={2 * 1024 * 1024} // 2MB
                    onChange={(files) => setFiles(files ? Array.from(files) : null)}
                    showPreview
                    variant="drag"
                    dragText="Перетащите изображения сюда или нажмите для выбора"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loading Animation Compatibility Demo */}
        <TabsContent value="loading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5" />
                Совместимость анимаций загрузки
              </CardTitle>
              <CardDescription>
                Демонстрация кроссбраузерных анимаций загрузки с фоллбэками для старых браузеров
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Поддержка браузера:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {capabilities.animations.supportsCSSAnimations ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        CSS анимации: {capabilities.animations.supportsCSSAnimations ? 'Поддерживаются' : 'Используется JS фоллбэк'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {capabilities.animations.supportsTransforms ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>
                        CSS трансформы: {capabilities.animations.supportsTransforms ? 'Поддерживаются' : 'Ограничено'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Тест анимаций:</h4>
                  <div className="space-y-2">
                    <Button onClick={handleSimulateLoading} disabled={loading}>
                      Симулировать загрузку
                    </Button>
                    <Button onClick={handleOverlayDemo}>
                      Показать оверлей
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Спиннеры:</h4>
                  <div className="flex items-center gap-4">
                    <CompatibleSpinner size="sm" />
                    <CompatibleSpinner size="default" />
                    <CompatibleSpinner size="lg" />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Кнопки с загрузкой:</h4>
                  <div className="space-y-2">
                    <CompatibleLoadingButton loading={loading} variant="primary">
                      Сохранить
                    </CompatibleLoadingButton>
                    <CompatibleLoadingButton loading={loading} variant="outline">
                      Отмена
                    </CompatibleLoadingButton>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Прогресс бар:</h4>
                  <CompatibleProgress 
                    value={progress} 
                    showPercentage 
                    animated 
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Скелетон загрузчики:</h4>
                <div className="space-y-2">
                  <CompatibleSkeleton className="h-4 w-full" />
                  <CompatibleSkeleton className="h-4 w-3/4" />
                  <CompatibleSkeleton className="h-4 w-1/2" />
                </div>
              </div>

              <CompatibleLoadingOverlay loading={showOverlay} text="Загрузка данных...">
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-600">Контент под оверлеем</p>
                </div>
              </CompatibleLoadingOverlay>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Browser Information */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о браузере</CardTitle>
          <CardDescription>
            Детальная информация о возможностях вашего браузера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Общая информация:</h4>
              <ul className="space-y-1">
                <li>IE: {capabilities.general.isIE ? 'Да' : 'Нет'}</li>
                <li>Edge Legacy: {capabilities.general.isEdgeLegacy ? 'Да' : 'Нет'}</li>
                <li>Safari: {capabilities.general.isSafari ? 'Да' : 'Нет'}</li>
                <li>Firefox: {capabilities.general.isFirefox ? 'Да' : 'Нет'}</li>
                <li>Chrome: {capabilities.general.isChrome ? 'Да' : 'Нет'}</li>
                <li>Мобильный: {capabilities.general.isMobile ? 'Да' : 'Нет'}</li>
                <li>Версия: {capabilities.general.version || 'Неизвестно'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Диалоги:</h4>
              <ul className="space-y-1">
                <li>Нативная поддержка: {capabilities.dialog.supportsNativeDialog ? 'Да' : 'Нет'}</li>
                <li>Нужен полифилл: {capabilities.dialog.needsPolyfill ? 'Да' : 'Нет'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Селекты:</h4>
              <ul className="space-y-1">
                <li>Кастомные стили: {capabilities.select.supportsCustomSelect ? 'Да' : 'Нет'}</li>
                <li>Множественный выбор: {capabilities.select.supportsMultiple ? 'Да' : 'Нет'}</li>
                <li>Нужен полифилл: {capabilities.select.needsPolyfill ? 'Да' : 'Нет'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Файлы:</h4>
              <ul className="space-y-1">
                <li>File API: {capabilities.fileInput.supportsFileApi ? 'Да' : 'Нет'}</li>
                <li>Множественные файлы: {capabilities.fileInput.supportsMultiple ? 'Да' : 'Нет'}</li>
                <li>Drag & Drop: {capabilities.fileInput.supportsDragDrop ? 'Да' : 'Нет'}</li>
                <li>Кастомные стили: {capabilities.fileInput.supportsCustomStyling ? 'Да' : 'Нет'}</li>
                <li>Нужен полифилл: {capabilities.fileInput.needsPolyfill ? 'Да' : 'Нет'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Анимации:</h4>
              <ul className="space-y-1">
                <li>CSS анимации: {capabilities.animations.supportsCSSAnimations ? 'Да' : 'Нет'}</li>
                <li>CSS трансформы: {capabilities.animations.supportsTransforms ? 'Да' : 'Нет'}</li>
                <li>Keyframes: {capabilities.animations.supportsKeyframes ? 'Да' : 'Нет'}</li>
                <li>Нужен фоллбэк: {capabilities.animations.needsFallback ? 'Да' : 'Нет'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main page component
export default function AdminCompatibilityDemoPage() {
  return (
    <AdminCompatibilityProvider showWarnings>
      <CompatibilityDemoContent />
    </AdminCompatibilityProvider>
  );
}