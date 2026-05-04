<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\MedicalDocument;

class MedicalDocumentController extends BaseResourceController
{
    protected string $modelClass = MedicalDocument::class;
}
