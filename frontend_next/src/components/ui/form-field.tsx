import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  description?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

interface FileFieldProps extends BaseFieldProps {
  accept: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: string;
  allowedFormats?: string;
}

// Компонент для текстовых полей
export const FormInputField: React.FC<InputFieldProps> = ({
  label,
  error,
  required = false,
  className = '',
  description,
  type = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
  minLength,
  disabled = false
}) => {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      
      <Input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        disabled={disabled}
        className={error ? "border-red-500 focus:border-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
      />
      
      {description && !error && (
        <p id={`${fieldId}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {value.length}/{maxLength}
        </p>
      )}
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id={`${fieldId}-error`}>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Компонент для многострочных текстовых полей
export const FormTextareaField: React.FC<TextareaFieldProps> = ({
  label,
  error,
  required = false,
  className = '',
  description,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  disabled = false
}) => {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      
      <Textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={error ? "border-red-500 focus:border-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
      />
      
      {description && !error && (
        <p id={`${fieldId}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {value.length}/{maxLength}
        </p>
      )}
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id={`${fieldId}-error`}>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Компонент для загрузки файлов
export const FormFileField: React.FC<FileFieldProps> = ({
  label,
  error,
  required = false,
  className = '',
  description,
  accept,
  onChange,
  disabled = false,
  maxSize,
  allowedFormats
}) => {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      
      <Input
        id={fieldId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className={error ? "border-red-500 focus:border-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
      />
      
      {(description || maxSize || allowedFormats) && !error && (
        <div id={`${fieldId}-description`} className="text-sm text-muted-foreground space-y-1">
          {description && <p>{description}</p>}
          {maxSize && <p>Максимальный размер: {maxSize}</p>}
          {allowedFormats && <p>Разрешенные форматы: {allowedFormats}</p>}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id={`${fieldId}-error`}>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};