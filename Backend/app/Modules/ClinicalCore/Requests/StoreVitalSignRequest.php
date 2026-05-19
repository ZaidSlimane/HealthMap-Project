<?php

namespace App\Modules\ClinicalCore\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVitalSignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'vital_sign_type_id' => ['required', 'integer', 'exists:vital_sign_types,id'],
            'admission_id'       => ['required', 'integer', 'exists:admissions,id'],
            'patient_id'         => ['nullable', 'integer', 'exists:patients,id'],
            'value'              => ['required', 'numeric'],
            'measured_at'        => ['nullable', 'date'],
        ];
    }
}
