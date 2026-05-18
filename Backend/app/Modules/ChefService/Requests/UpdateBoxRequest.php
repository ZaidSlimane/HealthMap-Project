<?php

namespace App\Modules\ChefService\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBoxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label_ar' => ['sometimes', 'string', 'min:1'],
            'label_fr' => ['sometimes', 'string', 'min:1'],
            'type' => ['sometimes', 'in:consultation,observation,urgence'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
