<?php

namespace App\Modules\Radiology\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRadioResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,dcm', 'max:51200'],
            'compte_rendu' => ['nullable', 'string'],
        ];
    }
}
