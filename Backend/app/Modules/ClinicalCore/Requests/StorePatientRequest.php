<?php

namespace App\Modules\ClinicalCore\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
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
            'patient_matricule'    => ['nullable', 'string', 'max:64', Rule::unique('patients', 'patient_matricule')],
            'nin'                  => ['required', 'string', 'max:32'],
            'name'                 => ['nullable', 'string', 'max:120'],
            'first_name'           => ['nullable', 'string', 'max:120'],
            'name_ar'              => ['nullable', 'string', 'max:120'],
            'first_name_ar'        => ['nullable', 'string', 'max:120'],
            'gender'               => ['nullable', Rule::in(['M', 'F'])],
            'date_of_birth'        => ['nullable', 'date'],
            'birth_place_id'       => ['nullable', Rule::exists('municipalities', 'id')],
            'father_first_name'    => ['nullable', 'string', 'max:120'],
            'mother_name'          => ['nullable', 'string', 'max:120'],
            'mother_first_name'    => ['nullable', 'string', 'max:120'],
            'father_first_name_ar' => ['nullable', 'string', 'max:120'],
            'mother_name_ar'       => ['nullable', 'string', 'max:120'],
            'mother_first_name_ar' => ['nullable', 'string', 'max:120'],
            'nationality_id'       => ['nullable', Rule::exists('countries', 'id')],
            'marital_status_id'    => ['required', Rule::exists('marital_statuses', 'id')],
            // spouse_id must be a patient of the same tenant.
            'spouse_id' => [
                'nullable',
                Rule::exists('patients', 'id')->where(function ($q) {
                    $q->where('establishment_id', $this->user()->establishment_id);
                }),
            ],
            'ins' => ['required', 'string', 'max:64'],
        ];
    }
}
