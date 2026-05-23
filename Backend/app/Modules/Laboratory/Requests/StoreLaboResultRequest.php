<?php

namespace App\Modules\Laboratory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLaboResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'results' => ['required', 'array', 'min:1'],
            'results.*.sub_analysis_name' => ['required', 'string'],
            'results.*.numeric_value' => ['nullable', 'numeric'],
            'results.*.text_value' => ['nullable', 'string'],
            'results.*.unit' => ['nullable', 'string'],
            'results.*.reference_range' => ['nullable', 'string'],
            'results.*.labo_demande_item_id' => ['nullable', 'integer', 'exists:labo_demande_item,id'],
        ];
    }
}
