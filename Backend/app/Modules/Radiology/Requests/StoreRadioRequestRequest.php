<?php

namespace App\Modules\Radiology\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRadioRequestRequest extends FormRequest
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
            'radiology_exam_type_ids' => ['required', 'array', 'min:1'],
            'radiology_exam_type_ids.*' => ['integer', 'exists:radiology_exam_types,id'],
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
