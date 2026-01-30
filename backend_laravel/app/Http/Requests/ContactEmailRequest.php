<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactEmailRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:50',
            'email' => 'required|email|max:255',
            'company' => 'nullable|string|max:100',
            'message' => 'required|string|min:10|max:1000',
            'source' => 'required|in:project,contact',
            'project_title' => 'nullable|string|max:255'
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Поле "Имя" обязательно для заполнения',
            'name.string' => 'Поле "Имя" должно быть строкой',
            'name.min' => 'Имя должно содержать минимум 2 символа',
            'name.max' => 'Имя не должно превышать 50 символов',
            
            'email.required' => 'Поле "Email" обязательно для заполнения',
            'email.email' => 'Введите корректный email адрес',
            'email.max' => 'Email не должен превышать 255 символов',
            
            'company.string' => 'Поле "Компания" должно быть строкой',
            'company.max' => 'Название компании не должно превышать 100 символов',
            
            'message.required' => 'Поле "Сообщение" обязательно для заполнения',
            'message.string' => 'Поле "Сообщение" должно быть строкой',
            'message.min' => 'Сообщение должно содержать минимум 10 символов',
            'message.max' => 'Сообщение не должно превышать 1000 символов',
            
            'source.required' => 'Поле "Источник" обязательно для заполнения',
            'source.in' => 'Источник должен быть "project" или "contact"',
            
            'project_title.string' => 'Название проекта должно быть строкой',
            'project_title.max' => 'Название проекта не должно превышать 255 символов'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'имя',
            'email' => 'email',
            'company' => 'компания',
            'message' => 'сообщение',
            'source' => 'источник',
            'project_title' => 'название проекта'
        ];
    }
}