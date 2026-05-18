<?php

namespace App\Modules\ChefService\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBoxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label_ar' => ['required', 'string', 'min:1'],
            'label_fr' => ['required', 'string', 'min:1'],
            'type' => ['required', 'in:consultation,observation,urgence'],
            'is_active' => ['boolean'],
        ];
    }
}
