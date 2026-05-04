<?php
/**
 * One-shot script to splice the BelongsToEstablishment trait into the
 * 14 tenant-scoped ClinicalCore models. Idempotent — safe to re-run.
 *
 * Run inside the docker app container:
 *   docker compose exec app php agents/apply_tenant_trait.php
 */

$models = [
    'Admission',
    'Bed',
    'Borne',
    'Companion',
    'Consultation',
    'ConsultationSymptom',
    'EstablishmentUnit',
    'MedicalDocument',
    'Observation',
    'Patient',
    'Prescription',
    'PrescriptionMedication',
    'Service',
    'WaitingList',
];

$base = __DIR__ . '/../app/Modules/ClinicalCore/Models';
$traitImport = 'use App\\Modules\\ClinicalCore\\Concerns\\BelongsToEstablishment;';
$traitUse    = '    use BelongsToEstablishment;';

foreach ($models as $name) {
    $path = "$base/$name.php";
    $src  = file_get_contents($path);

    if (str_contains($src, 'BelongsToEstablishment')) {
        echo "= $name (already wired)\n";
        continue;
    }

    // 1) Add the import after the namespace declaration's last `use ...;` line.
    $src = preg_replace(
        '/^(use [^\n]+;)(\n(?!use ))/m',
        "$1\n" . $traitImport . "$2",
        $src,
        1
    );

    // 2) Add `use BelongsToEstablishment;` as the first statement inside the class.
    $src = preg_replace(
        '/(class\s+\w+\s+extends\s+Model\s*\{)(\s*)/',
        "$1\n" . $traitUse . "\n$2",
        $src,
        1
    );

    // 3) Make sure 'establishment_id' is in $fillable.
    if (preg_match('/protected\s+\$fillable\s*=\s*\[([^\]]*)\]/s', $src, $m)) {
        $list = $m[1];
        if (!str_contains($list, "'establishment_id'")) {
            $newList = rtrim($list);
            // Insert before closing bracket — keep it tidy
            $newList = $newList . (str_ends_with(trim($list), ',') ? '' : ',') . " 'establishment_id'";
            $src = str_replace($m[0], "protected \$fillable = [$newList]", $src);
        }
    }

    file_put_contents($path, $src);
    echo "+ $name\n";
}

echo "Done.\n";
