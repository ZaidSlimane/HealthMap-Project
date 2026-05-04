<?php

namespace App\Modules\ClinicalCore\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
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
        $id = $this->route('patient') ?? $this->route('id');

        return [
            'patient_matricule' => [
                'sometimes', 'nullable', 'string', 'max:64',
                Rule::unique('patients', 'patient_matricule')->ignore($id),
            ],
            'nin'                  => ['sometimes', 'string', 'max:32'],
            'name'                 => ['sometimes', 'nullable', 'string', 'max:120'],
            'first_name'           => ['sometimes', 'nullable', 'string', 'max:120'],
            'name_ar'              => ['sometimes', 'nullable', 'string', 'max:120'],
            'first_name_ar'        => ['sometimes', 'nullable', 'string', 'max:120'],
            'gender'               => ['sometimes', 'nullable', Rule::in(['M', 'F'])],
            'date_of_birth'        => ['sometimes', 'nullable', 'date'],
            'birth_place_id'       => ['sometimes', 'nullable', Rule::exists('municipalities', 'id')],
            'father_first_name'    => ['sometimes', 'nullable', 'string', 'max:120'],
            'mother_name'          => ['sometimes', 'nullable', 'string', 'max:120'],
            'mother_first_name'    => ['sometimes', 'nullable', 'string', 'max:120'],
            'father_first_name_ar' => ['sometimes', 'nullable', 'string', 'max:120'],
            'mother_name_ar'       => ['sometimes', 'nullable', 'string', 'max:120'],
            'mother_first_name_ar' => ['sometimes', 'nullable', 'string', 'max:120'],
            'nationality_id'       => ['sometimes', 'nullable', Rule::exists('countries', 'id')],
            'marital_status_id'    => ['sometimes', Rule::exists('marital_statuses', 'id')],
            'spouse_id' => [
                'sometimes', 'nullable',
                Rule::exists('patients', 'id')->where(function ($q) {
                    $q->where('establishment_id', $this->user()->establishment_id);
                }),
            ],
            'ins' => ['sometimes', 'string', 'max:64'],
        ];
    }
}
