<?php

namespace App\Modules\ClinicalCore\Controllers;

use App\Modules\ClinicalCore\Models\Service;
use App\Modules\ClinicalCore\Models\EstablishmentUnit;
use App\Modules\ClinicalCore\Models\Room;
use App\Modules\ClinicalCore\Models\Bed;
use App\Modules\Auth\Models\Role;
use App\Modules\Auth\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServiceController extends BaseResourceController
{
    protected string $modelClass = Service::class;

    protected array $with = ['chief', 'medicalChief', 'units.rooms.beds', 'type'];

    /**
     * Create a service with optional nested units → rooms → beds.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->only(['name', 'code', 'is_active', 'service_type_id', 'max_duration']);

        // Auto-assign establishment from the authenticated user
        $user = Auth::user();
        if ($user && $user->establishment_id) {
            $data['establishment_id'] = $user->establishment_id;
        } else {
            // Fallback: use the first establishment (for bootstrap admin without one)
            $firstEst = \App\Modules\ClinicalCore\Models\Establishment::first();
            if ($firstEst) {
                $data['establishment_id'] = $firstEst->id;
            }
        }

        $service = DB::transaction(function () use ($data, $request) {
            $service = Service::create($data);

            // Handle nested units
            if ($request->has('units')) {
                $this->syncUnits($service, $request->input('units', []));
            }

            return $service;
        });

        return response()->json($service->load($this->with), 201);
    }

    /**
     * Update a service and its nested units → rooms → beds.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $data = $request->only(['name', 'code', 'is_active', 'service_type_id', 'chief_id', 'medical_chief_id', 'max_duration']);

        DB::transaction(function () use ($service, $data, $request) {
            $oldChiefId = $service->chief_id;
            $service->fill($data)->save();

            // When chief_id changes, sync the is_chef flag on service_user pivot
            // and assign/revoke the ChefService role automatically.
            $newChiefId = $service->chief_id;
            if ($newChiefId !== $oldChiefId) {
                $this->syncChefAssignment($service, $oldChiefId, $newChiefId);
            }

            // Handle nested units only if explicitly provided
            if ($request->has('units')) {
                $this->syncUnits($service, $request->input('units', []));
            }
        });

        return response()->json($service->fresh($this->with));
    }

    /**
     * Sync the is_chef pivot flag and ChefService role when a service's chief changes.
     */
    private function syncChefAssignment(Service $service, ?int $oldChiefId, ?int $newChiefId): void
    {
        // Remove is_chef from the previous chief
        if ($oldChiefId) {
            DB::table('service_user')
                ->where('user_id', $oldChiefId)
                ->where('service_id', $service->id)
                ->update(['is_chef' => false]);

            // Revoke ChefService role if user is no longer chef of any service
            $stillChefElsewhere = DB::table('service_user')
                ->where('user_id', $oldChiefId)
                ->where('is_chef', true)
                ->exists();

            if (!$stillChefElsewhere) {
                $oldChef = User::find($oldChiefId);
                $chefRole = Role::where('role', 'ChefService')->first();
                if ($oldChef && $chefRole) {
                    $oldChef->roles()->detach($chefRole->id);
                }
            }
        }

        // Assign is_chef to the new chief
        if ($newChiefId) {
            // Ensure the user is linked to this service in service_user
            $pivotExists = DB::table('service_user')
                ->where('user_id', $newChiefId)
                ->where('service_id', $service->id)
                ->exists();

            if ($pivotExists) {
                DB::table('service_user')
                    ->where('user_id', $newChiefId)
                    ->where('service_id', $service->id)
                    ->update(['is_chef' => true]);
            } else {
                DB::table('service_user')->insert([
                    'user_id' => $newChiefId,
                    'service_id' => $service->id,
                    'is_chef' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Assign ChefService role to the new chief
            $newChef = User::find($newChiefId);
            $chefRole = Role::where('role', 'ChefService')->first();
            if ($newChef && $chefRole && !$newChef->roles()->where('role_id', $chefRole->id)->exists()) {
                $newChef->roles()->attach($chefRole->id);
            }
        }
    }

    /**
     * Sync units (and their rooms/beds) for a service.
     *
     * Performance: pre-fetches all existing units (with nested rooms/beds)
     * in a single query and uses an in-memory id-keyed map to avoid N+1
     * find() calls inside the loop.
     */
    private function syncUnits(Service $service, array $unitsPayload): void
    {
        $establishmentId = $service->establishment_id;

        // Eager-load the entire existing tree in ONE query
        $existingUnits = $service->units()->with('rooms.beds')->get()->keyBy('id');
        $existingUnitIds = $existingUnits->keys()->all();
        $incomingIds = [];

        foreach ($unitsPayload as $unitData) {
            $unitId = isset($unitData['id']) && is_numeric($unitData['id']) ? (int) $unitData['id'] : null;
            $unit = $unitId ? $existingUnits->get($unitId) : null;

            if ($unit) {
                $unit->update([
                    'name' => $unitData['name'] ?? $unit->name,
                    'unit_type' => $unitData['unit_type'] ?? $unit->unit_type,
                ]);
                $incomingIds[] = $unit->id;
            } else {
                $unit = EstablishmentUnit::create([
                    'service_id' => $service->id,
                    'name' => $unitData['name'] ?? 'Unité',
                    'unit_type' => $unitData['unit_type'] ?? null,
                    'establishment_id' => $establishmentId,
                ]);
                // Hydrate empty rooms collection so syncRooms doesn't re-query
                $unit->setRelation('rooms', collect());
            }

            if (isset($unitData['rooms'])) {
                $this->syncRooms($unit, $unitData['rooms'], $establishmentId);
            }
        }

        $toDelete = array_diff($existingUnitIds, $incomingIds);
        if (!empty($toDelete)) {
            EstablishmentUnit::whereIn('id', $toDelete)->delete();
        }
    }

    /**
     * Sync rooms (and their beds) for a unit.
     *
     * Uses pre-loaded $unit->rooms collection (set by syncUnits) instead
     * of re-querying. Per-item find() is replaced with keyBy('id') lookup.
     */
    private function syncRooms(EstablishmentUnit $unit, array $roomsPayload, ?int $establishmentId): void
    {
        $existingRooms = $unit->rooms->keyBy('id');
        $existingRoomIds = $existingRooms->keys()->all();
        $incomingIds = [];

        foreach ($roomsPayload as $roomData) {
            $roomId = isset($roomData['id']) && is_numeric($roomData['id']) ? (int) $roomData['id'] : null;
            $room = $roomId ? $existingRooms->get($roomId) : null;

            if ($room) {
                $room->update([
                    'name' => $roomData['name'] ?? $room->name,
                    'type' => $roomData['type'] ?? $room->type,
                    'capacity' => $roomData['capacity'] ?? $room->capacity,
                ]);
                $incomingIds[] = $room->id;
            } else {
                $room = Room::create([
                    'establishment_unit_id' => $unit->id,
                    'name' => $roomData['name'] ?? 'Salle',
                    'type' => $roomData['type'] ?? 'Chambre',
                    'capacity' => $roomData['capacity'] ?? 1,
                    'establishment_id' => $establishmentId,
                ]);
                $room->setRelation('beds', collect());
            }

            if (isset($roomData['beds'])) {
                $this->syncBeds($room, $roomData['beds'], $establishmentId);
            }
        }

        $toDelete = array_diff($existingRoomIds, $incomingIds);
        if (!empty($toDelete)) {
            Room::whereIn('id', $toDelete)->delete();
        }
    }

    /**
     * Sync beds for a room.
     *
     * Uses the pre-loaded $room->beds collection. Replaces individual
     * find()+update with a single batched bulk insert + per-row update
     * using the id-keyed lookup.
     */
    private function syncBeds(Room $room, array $bedsPayload, ?int $establishmentId): void
    {
        $existingBeds = $room->beds->keyBy('id');
        $existingBedIds = $existingBeds->keys()->all();
        $incomingIds = [];
        $toInsert = [];
        $now = now();

        foreach ($bedsPayload as $bedData) {
            $bedId = isset($bedData['id']) && is_numeric($bedData['id']) ? (int) $bedData['id'] : null;
            $bed = $bedId ? $existingBeds->get($bedId) : null;

            if ($bed) {
                $bed->update([
                    'bed_number' => $bedData['bed_number'] ?? $bed->bed_number,
                    'status' => $bedData['status'] ?? $bed->status,
                ]);
                $incomingIds[] = $bed->id;
            } else {
                $toInsert[] = [
                    'room_id' => $room->id,
                    'bed_number' => $bedData['bed_number'] ?? 'Lit',
                    'status' => $bedData['status'] ?? 'free',
                    'establishment_id' => $establishmentId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Single bulk INSERT for all new beds
        if (!empty($toInsert)) {
            Bed::insert($toInsert);
        }

        $toDelete = array_diff($existingBedIds, $incomingIds);
        if (!empty($toDelete)) {
            Bed::whereIn('id', $toDelete)->delete();
        }
    }
}
