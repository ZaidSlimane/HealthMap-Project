<?php

namespace App\Modules\Radiology\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'radio_demande_id' => ['required', 'integer', 'exists:radio_demande,id'],
            'scheduled_at' => ['required', 'date'],
        ];
    }
}
