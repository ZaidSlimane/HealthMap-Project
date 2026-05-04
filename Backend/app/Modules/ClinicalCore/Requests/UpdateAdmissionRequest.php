<?php

namespace App\Modules\ClinicalCore\Requests;

use App\Modules\ClinicalCore\Models\Admission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function sameTenant(string $table): \Illuminate\Validation\Rules\Exists
    {
        $estId = $this->user()->establishment_id;

        return Rule::exists($table, 'id')->where(fn ($q) => $q->where('establishment_id', $estId));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id'      => ['sometimes', $this->sameTenant('patients')],
            'service_id'      => ['sometimes', $this->sameTenant('services')],
            'bed_id'          => ['sometimes', 'nullable', $this->sameTenant('beds')],
            'companion_id'    => ['sometimes', 'nullable', $this->sameTenant('companions')],
            'date_admission'  => ['sometimes', 'date'],
            'date_sortie'     => ['sometimes', 'nullable', 'date', 'after_or_equal:date_admission'],
            'motif_admission' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'mode'            => ['sometimes', Rule::in(Admission::MODES)],
            'status'          => ['sometimes', Rule::in(Admission::STATUSES)],
        ];
    }
}
