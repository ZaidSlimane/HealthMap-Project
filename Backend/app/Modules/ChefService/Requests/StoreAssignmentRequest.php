<?php

namespace App\Modules\ChefService\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'day_of_week' => ['required', 'array', 'min:1'],
            'day_of_week.*' => ['in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }
}
