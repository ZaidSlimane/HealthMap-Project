<?php

namespace App\Modules\ClinicalCore\Requests;

use App\Modules\ClinicalCore\Models\Admission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Tenant-scoped existence rule helper. Ensures any FK we accept points
     * at a row inside the caller's establishment — the global scope filters
     * reads but doesn't protect writes against forged IDs.
     */
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
            'patient_id'      => ['required', $this->sameTenant('patients')],
            'service_id'      => ['required', $this->sameTenant('services')],
            'bed_id'          => ['nullable', $this->sameTenant('beds')],
            'companion_id'    => ['nullable', $this->sameTenant('companions')],
            'date_admission'  => ['required', 'date'],
            'date_sortie'     => ['nullable', 'date', 'after_or_equal:date_admission'],
            'motif_admission' => ['nullable', 'string', 'max:2000'],
            'mode'            => ['nullable', Rule::in(Admission::MODES)],
            'status'          => ['nullable', Rule::in(Admission::STATUSES)],
        ];
    }
}
