import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface OsmBuilding {
  id: number;
  name: string;
  buildingType: string;
  geometry: [number, number][];
  centroid: [number, number];
}

@Injectable({ providedIn: 'root' })
export class OsmService {
  private http = inject(HttpClient);

  readonly CHU_CAMPUS_GEOJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: { name: 'CHU Ibn Badis Constantine' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [6.616382,36.3751435],[6.6154862,36.3750101],[6.6153201,36.3749975],
        [6.6147116,36.3749514],[6.6147169,36.3746887],[6.6146788,36.3743809],
        [6.6146744,36.3743452],[6.6147814,36.3743345],[6.6147841,36.3741855],
        [6.6148672,36.3741855],[6.6149544,36.3738507],[6.6147103,36.3738446],
        [6.6147317,36.3736786],[6.6147478,36.3736014],[6.6147585,36.3735422],
        [6.6150548,36.373283],[6.6151393,36.3731549],[6.6151228,36.3731354],
        [6.6151567,36.3731126],[6.6151776,36.373135],[6.6159654,36.3730001],
        [6.6159533,36.3730723],[6.6160888,36.3730797],[6.6161033,36.3730297],
        [6.6162653,36.3729321],[6.6162772,36.372841],[6.616442,36.3726743],
        [6.6164637,36.3724281],[6.6165785,36.3720159],[6.6166009,36.371961],
        [6.616626,36.3719125],[6.6166669,36.3718512],[6.6166997,36.3718157],
        [6.6167312,36.3717878],[6.6167916,36.3717515],[6.616872,36.3717199],
        [6.6174461,36.3718385],[6.6175226,36.3718627],[6.6176313,36.371935],
        [6.6177055,36.3719943],[6.6177256,36.3720454],[6.6181163,36.3723781],
        [6.6180424,36.3724397],[6.6180603,36.3724649],[6.6181518,36.3725468],
        [6.6184362,36.3727729],[6.6184456,36.3729009],[6.618487,36.3734183],
        [6.6188061,36.3737211],[6.6188185,36.3737788],[6.618816,36.3738196],
        [6.6187919,36.373855],[6.6187252,36.3738994],[6.6184437,36.3740205],
        [6.6183462,36.3740559],[6.618264,36.374083],[6.6176525,36.373885],
        [6.6175111,36.3740748],[6.617492,36.3743897],[6.6173796,36.3744703],
        [6.617362,36.3744829],[6.6173194,36.3745135],[6.6173939,36.3745959],
        [6.6171645,36.374756],[6.6169467,36.374916],[6.6166723,36.375067],
        [6.616382,36.3751435],
      ]]
    }
  };

  async fetchCampusBuildings(): Promise<OsmBuilding[]> {
    const query = `[out:json][timeout:25];
way[building](36.3715,6.6144,36.3755,6.6192);
out geom;`;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const result = await firstValueFrom(
        this.http.get<{ elements: any[] }>(url)
      );

      return (result.elements ?? [])
        .filter(el => el.geometry?.length >= 3)
        .map(el => {
          const coords: [number, number][] =
            el.geometry.map((n: any) => [n.lon as number, n.lat as number]);
          const centroid: [number, number] = [
            coords.reduce((s, c) => s + c[0], 0) / coords.length,
            coords.reduce((s, c) => s + c[1], 0) / coords.length,
          ];
          return {
            id: el.id as number,
            name: (el.tags?.name ?? '') as string,
            buildingType: (el.tags?.building ?? 'yes') as string,
            geometry: coords,
            centroid,
          };
        });
    } catch {
      return [];
    }
  }
}
