export const CHU_CAMPUS_GEOJSON = {
  type: 'Feature' as const,
  properties: { name: 'CHU Ibn Badis Constantine' },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[
      [6.616382, 36.3751435], [6.6154862, 36.3750101],
      [6.6153201, 36.3749975], [6.6147116, 36.3749514],
      [6.6147169, 36.3746887], [6.6146788, 36.3743809],
      [6.6146744, 36.3743452], [6.6147814, 36.3743345],
      [6.6147841, 36.3741855], [6.6148672, 36.3741855],
      [6.6149544, 36.3738507], [6.6147103, 36.3738446],
      [6.6147317, 36.3736786], [6.6147478, 36.3736014],
      [6.6147585, 36.3735422], [6.6150548, 36.3732830],
      [6.6151393, 36.3731549], [6.6151228, 36.3731354],
      [6.6151567, 36.3731126], [6.6151776, 36.3731350],
      [6.6159654, 36.3730001], [6.6159533, 36.3730723],
      [6.6160888, 36.3730797], [6.6161033, 36.3730297],
      [6.6162653, 36.3729321], [6.6162772, 36.3728410],
      [6.6164420, 36.3726743], [6.6164637, 36.3724281],
      [6.6165785, 36.3720159], [6.6166009, 36.3719610],
      [6.6166260, 36.3719125], [6.6166669, 36.3718512],
      [6.6166997, 36.3718157], [6.6167312, 36.3717878],
      [6.6167916, 36.3717515], [6.6168720, 36.3717199],
      [6.6174461, 36.3718385], [6.6175226, 36.3718627],
      [6.6176313, 36.3719350], [6.6177055, 36.3719943],
      [6.6177256, 36.3720454], [6.6181163, 36.3723781],
      [6.6180424, 36.3724397], [6.6180603, 36.3724649],
      [6.6181518, 36.3725468], [6.6184362, 36.3727729],
      [6.6184456, 36.3729009], [6.6184870, 36.3734183],
      [6.6188061, 36.3737211], [6.6188185, 36.3737788],
      [6.6188160, 36.3738196], [6.6187919, 36.3738550],
      [6.6187252, 36.3738994], [6.6184437, 36.3740205],
      [6.6183462, 36.3740559], [6.6182640, 36.3740830],
      [6.6176525, 36.3738850], [6.6175111, 36.3740748],
      [6.6174920, 36.3743897], [6.6173796, 36.3744703],
      [6.6173620, 36.3744829], [6.6173194, 36.3745135],
      [6.6173939, 36.3745959], [6.6171645, 36.3747560],
      [6.6169467, 36.3749160], [6.6166723, 36.3750670],
      [6.616382,  36.3751435],
    ]]
  }
};

export const CHU_SERVICE_ZONES = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { id: 'zone-medecine-interne', label: 'MÉDECINE INTERNE', color: '#BBDEFB', strokeColor: '#1565C0' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6165, 36.3727],[6.6178, 36.3727],[6.6178, 36.3738],[6.6165, 36.3738],[6.6165, 36.3727]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-urgences', label: 'URGENCES', color: '#FFCDD2', strokeColor: '#E53935' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6152, 36.3718],[6.6162, 36.3718],[6.6162, 36.3727],[6.6152, 36.3727],[6.6152, 36.3718]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-chirurgie', label: 'CHIRURGIE', color: '#FFE0B2', strokeColor: '#F57C00' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6155, 36.3735],[6.6168, 36.3735],[6.6168, 36.3745],[6.6155, 36.3745],[6.6155, 36.3735]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-laboratoires', label: 'LABORATOIRES', color: '#E1BEE7', strokeColor: '#6A1B9A' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6170, 36.3730],[6.6185, 36.3730],[6.6185, 36.3742],[6.6170, 36.3742],[6.6170, 36.3730]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-imagerie', label: 'IMAGERIE', color: '#B2EBF2', strokeColor: '#00838F' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6163, 36.3743],[6.6175, 36.3743],[6.6175, 36.3751],[6.6163, 36.3751],[6.6163, 36.3743]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-medecine-interne', label: 'MÉDECINE INTERNE', color: '#BBDEFB', strokeColor: '#1565C0' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6165, 36.3727],[6.6178, 36.3727],[6.6178, 36.3738],[6.6165, 36.3738],[6.6165, 36.3727]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-medecine', label: 'MÉDECINE', color: '#BBDEFB', strokeColor: '#1565C0' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6162, 36.3727],[6.6175, 36.3727],[6.6175, 36.3738],[6.6162, 36.3738],[6.6162, 36.3727]]] }
    },
    {
      type: 'Feature' as const,
      properties: { id: 'zone-admin', label: 'ADMINISTRATION', color: '#ECEFF1', strokeColor: '#546E7A' },
      geometry: { type: 'Polygon' as const, coordinates: [[[6.6148, 36.3738],[6.6160, 36.3738],[6.6160, 36.3751],[6.6148, 36.3751],[6.6148, 36.3738]]] }
    },
  ]
};

export type ChuServiceEntry = {
  label: string;
  service: string;
  type: string;
  status: 'LIBRE' | 'OCCUPE' | 'CRITIQUE' | 'MAINTENANCE';
  beds?: number;
  bedsOccupied?: number;
  chef?: string;
  code?: number;
};

export const SPACE_TO_CHU_SERVICE: Record<string, string> = {
  'Classroom':          'svc-012', // MÉDECINE INTERNE
  'Office':             'svc-011', // DIRECTION GÉNÉRALE
  'Faculty Room':       'svc-005', // CARDIOLOGIE (example mapping)
  'Faculty Lounge':     'svc-011', // DIRECTION GÉNÉRALE
  'Library':            'svc-011', // DIRECTION GÉNÉRALE
  'Cafeteria':          'svc-008', // PHARMACIE CENTRALE (example)
  'Back Kitchen':       'svc-008', // PHARMACIE CENTRALE
  'Storage':            'svc-008', // PHARMACIE CENTRALE
  'Stage Storage':      'svc-008', // PHARMACIE CENTRALE
  'Event Storage':      'svc-004', // URGENCES
  'Copy Room':          'svc-011', // DIRECTION GÉNÉRALE
  'Copier Room':        'svc-011', // DIRECTION GÉNÉRALE
  "Principal's Office": 'svc-011', // DIRECTION GÉNÉRALE
  'Boys Locker Room':   'svc-011', // DIRECTION GÉNÉRALE
  'Washroom':           'svc-011', // Direction (generic)
  "Men's Washroom":     'svc-011',
  'Mens Washroom':      'svc-011',
  "Women's Washroom":   'svc-011',
  'Womens Washroom':    'svc-011',
  'Gym':                'svc-010', // NEUROLOGIE
  'Lobby':              'svc-004', // URGENCES
  'Conference Room':    'svc-011', // DIRECTION GÉNÉRALE
  'Multipurpose Room':  'svc-001', // CHIRURGIE
  'Art Room':           'svc-003', // LABO BIOCHIMIE
  'Science Lab':        'svc-002', // HÉMOBIOLOGIE
  'Music Room':         'svc-005', // CARDIOLOGIE
  'Drama Room':         'svc-007', // RADIOLOGIE
  'Computer Lab':       'svc-007', // RADIOLOGIE
  'Auditorium':         'svc-011', // DIRECTION GÉNÉRALE
  'Staff Room':         'svc-010', // NEUROLOGIE
  'Bathroom':           'svc-011',
  'Stairwell':          'svc-004',
  'Hallway':            'svc-004',
  'Corridor':           'svc-004',
};
