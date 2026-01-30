# ImageUpload Component

## Overview
Reusable component for uploading images in the homepage CMS editor. Provides validation, preview, loading states, and error handling with Russian language messages.

## Features

### ✅ Task Requirements Completed

1. **Reusable Component** - Can be used across different sections (Hero, Services, Testimonials, etc.)
2. **Image Preview** - Shows current image with Next.js Image optimization
3. **Client-side File Size Validation** - Validates max 2MB before upload
4. **File Type Validation** - Only accepts JPG, PNG, WEBP formats
5. **Loading State** - Shows spinner and disables button during upload
6. **Russian Error Messages** - All user-facing text in Russian

### Component Props

```typescript
interface ImageUploadProps {
  currentImage?: string;        // Current image URL to display
  onUpload: (file: File) => Promise<string>;  // Upload handler function
  label?: string;               // Optional label for the upload field
  maxSize?: number;             // Max file size in bytes (default: 2MB)
  disabled?: boolean;           // Disable the upload functionality
}
```

## Validation Rules

### File Size
- **Maximum**: 2MB (2,097,152 bytes)
- **Configurable**: Can be overridden via `maxSize` prop
- **Error Message**: "Размер файла не должен превышать 2.0 МБ (текущий размер: X.X МБ)"

### File Types
- **Accepted MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Accepted Extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Error Message**: "Неподдерживаемый тип файла. Разрешены только: JPG, PNG, WEBP"

## Usage Examples

### Basic Usage
```tsx
import { ImageUpload } from '@/components/admin/ImageUpload';

function MyComponent() {
  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.path;
  };

  return (
    <ImageUpload
      onUpload={handleUpload}
      label="Загрузить изображение"
    />
  );
}
```

### With Current Image
```tsx
<ImageUpload
  currentImage="/images/logo.png"
  onUpload={handleUpload}
  label="Логотип"
/>
```

### With Custom Max Size
```tsx
<ImageUpload
  onUpload={handleUpload}
  maxSize={1 * 1024 * 1024} // 1MB
  label="Аватар"
/>
```

### Disabled State
```tsx
<ImageUpload
  onUpload={handleUpload}
  disabled={isSaving}
  label="Изображение"
/>
```

## Error Handling

The component handles various error scenarios:

1. **File Too Large**: Shows error with current and max file size
2. **Invalid File Type**: Shows error with accepted formats
3. **Upload Failure**: Displays error message from upload handler
4. **Invalid File**: Handles corrupted or empty files

All errors are displayed in Russian with clear, user-friendly messages.

## Success Feedback

- Success message: "Изображение успешно загружено"
- Auto-dismisses after 3 seconds
- Green alert with checkmark icon

## Loading State

During upload:
- Button shows "Загрузка..." with spinner
- Button is disabled
- Clear button is hidden
- File input is disabled

## Preview Functionality

- Shows current image if provided
- Updates preview immediately after file selection
- Displays image using Next.js Image component with `object-contain`
- Clear button (X) in top-right corner to remove preview
- Reverts to previous image if upload fails

## Accessibility

- Proper label association
- Hidden file input with accessible button trigger
- Clear error messages
- Disabled state properly communicated
- Keyboard accessible

## Integration with Homepage CMS

This component is designed to work with the homepage content API:

```typescript
const handleUpload = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/homepage-content/upload-image`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }
  );

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Размер файла превышает допустимый лимит (2 МБ)');
    }
    throw new Error('Ошибка загрузки изображения');
  }

  const data = await response.json();
  return data.data.path;
};
```

## Testing

Unit tests are provided in `__tests__/ImageUpload.test.tsx` covering:
- Rendering with label
- File size validation
- File type validation
- Loading state
- Success message
- Disabled state
- Current image preview

Run tests with:
```bash
npm test ImageUpload.test.tsx
```

## Requirements Mapping

- **Requirement 4.3**: Image upload with preview ✅
- **Requirement 4.4**: File size validation (max 2MB) ✅
- **Requirement 4.5**: Error messages in Russian ✅
- **Requirement 6.4**: Client-side file validation ✅

## Files Created

1. `ImageUpload.tsx` - Main component
2. `ImageUpload.example.tsx` - Usage examples
3. `__tests__/ImageUpload.test.tsx` - Unit tests
4. `ImageUpload.README.md` - This documentation
