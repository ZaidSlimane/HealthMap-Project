<?php

namespace App\Modules\Laboratory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLaboRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'consultation_id' => ['nullable', 'integer', 'exists:consultations,id', 'required_without:admission_id'],
            'admission_id' => ['nullable', 'integer', 'exists:admissions,id', 'required_without:consultation_id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', 'in:panel,analysis'],
            'items.*.item_id' => ['required', 'integer'],
            'urgency' => ['sometimes', 'in:normale,urgente'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('consultation_id') && $this->filled('admission_id')) {
                $validator->errors()->add('context', 'Cannot set both consultation_id and admission_id. Use one or the other.');
            }
        });
    }
}
