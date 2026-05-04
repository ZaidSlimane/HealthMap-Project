export type ChuServiceType =
  | 'URGENCE' | 'CHIRURGIE' | 'MEDECINE' | 'CONSULTATION'
  | 'LABORATOIRE' | 'IMAGERIE' | 'PHARMACIE'
  | 'ADMINISTRATION' | 'LOGISTIQUE' | 'ENSEIGNEMENT';

export type ServiceStatus = 'LIBRE' | 'OCCUPE' | 'CRITIQUE' | 'MAINTENANCE';

export interface ChuServiceDef {
  id: string;
  code: number;
  label: string;
  shortLabel: string;
  type: ChuServiceType;
  lon: number;
  lat: number;
  status: ServiceStatus;
  beds?: number;
  bedsOccupied?: number;
  chef?: string;
}

export const CHU_SERVICES: ChuServiceDef[] = [
  // URGENCES — south cluster
  { id:'urgences-med',  code:31, label:'Urgences Médicales',       shortLabel:'Urgences Méd.',  type:'URGENCE',       lon:6.6157, lat:36.3722, status:'CRITIQUE',    beds:12, bedsOccupied:12, chef:'Pr. Ouahab' },
  { id:'samu',          code:32, label:'SAMU',                     shortLabel:'SAMU',            type:'URGENCE',       lon:6.6160, lat:36.3721, status:'CRITIQUE',    beds:20, bedsOccupied:18, chef:'Pr. Benhamed' },
  { id:'urg-ped',       code:33, label:'Urgences Pédiatriques',    shortLabel:'Urg. Péd.',       type:'URGENCE',       lon:6.6155, lat:36.3720, status:'OCCUPE',      beds:8,  bedsOccupied:6,  chef:'Pr. Chérif' },
  { id:'urg-chir',      code:46, label:'Urgences Chirurgicales',   shortLabel:'Urg. Chir.',      type:'URGENCE',       lon:6.6163, lat:36.3720, status:'OCCUPE',      beds:10, bedsOccupied:8,  chef:'Pr. Benmansour' },
  { id:'urg-cardio',    code:63, label:'Urgences Cardiologie',     shortLabel:'Urg. Cardio',     type:'URGENCE',       lon:6.6168, lat:36.3723, status:'CRITIQUE',    beds:6,  bedsOccupied:6,  chef:'Pr. Guechi' },

  // CHIRURGIE — central-north
  { id:'chir-ab',       code:45, label:'Chirurgie A/B — Ibn Sina', shortLabel:'Chirurgie A/B',   type:'CHIRURGIE',     lon:6.6162, lat:36.3738, status:'OCCUPE',      beds:60, bedsOccupied:48, chef:'Pr. Brahimi' },
  { id:'neurochir',     code:45, label:'Neurochirurgie — Ortho.',  shortLabel:'Neurochir.',       type:'CHIRURGIE',     lon:6.6155, lat:36.3742, status:'OCCUPE',      beds:30, bedsOccupied:22, chef:'Pr. Kessabi' },
  { id:'brules',        code:16, label:'Centre des Brûlés',        shortLabel:'Brûlés',          type:'CHIRURGIE',     lon:6.6168, lat:36.3737, status:'CRITIQUE',    beds:12, bedsOccupied:10, chef:'Pr. Hadji' },
  { id:'chir-plast',   code:14, label:'Chirurgie Plastique',      shortLabel:'Chir. Plastique', type:'CHIRURGIE',     lon:6.6175, lat:36.3734, status:'OCCUPE',      beds:15, bedsOccupied:10, chef:'Pr. Aoudia' },

  // MÉDECINE — central
  { id:'med-interne',   code:10, label:'Médecine Interne',         shortLabel:'Méd. Interne',    type:'MEDECINE',      lon:6.6165, lat:36.3731, status:'OCCUPE',      beds:25, bedsOccupied:18, chef:'Pr. Yacine Kitouni' },
  { id:'cardio',        code:47, label:'Cardiologie — Pneumo',     shortLabel:'Cardio/Pneumo',   type:'MEDECINE',      lon:6.6170, lat:36.3730, status:'OCCUPE',      beds:35, bedsOccupied:28, chef:'Pr. Zemmouri' },
  { id:'neurologie',    code:48, label:'Neurologie',               shortLabel:'Neurologie',      type:'MEDECINE',      lon:6.6166, lat:36.3734, status:'OCCUPE',      beds:24, bedsOccupied:18, chef:'Pr. Tahar' },
  { id:'hemato',        code:42, label:'Hématologie',              shortLabel:'Hématologie',     type:'MEDECINE',      lon:6.6160, lat:36.3733, status:'OCCUPE',      beds:20, bedsOccupied:14, chef:'Pr. Saïdi' },
  { id:'infectieux',    code:41, label:'Maladies Infectieuses',    shortLabel:'Infectieux',      type:'MEDECINE',      lon:6.6172, lat:36.3727, status:'OCCUPE',      beds:24, bedsOccupied:20, chef:'Pr. Tali' },
  { id:'hemodialyse',   code:5,  label:'Hémodialyse',             shortLabel:'Hémodialyse',     type:'MEDECINE',      lon:6.6159, lat:36.3729, status:'OCCUPE',      beds:20, bedsOccupied:17, chef:'Pr. Abidi' },
  { id:'maternite',     code:9,  label:'Maternité',               shortLabel:'Maternité',       type:'MEDECINE',      lon:6.6152, lat:36.3750, status:'OCCUPE',      beds:40, bedsOccupied:30, chef:'Pr. Benali' },

  // LABORATOIRES — east wing
  { id:'labo-bacterio', code:18, label:'Labo. Bactériologie',      shortLabel:'Bactériologie',   type:'LABORATOIRE',   lon:6.6179, lat:36.3737, status:'OCCUPE' },
  { id:'labo-biochimie',code:19, label:'Labo. Biochimie',          shortLabel:'Biochimie',       type:'LABORATOIRE',   lon:6.6182, lat:36.3739, status:'OCCUPE' },
  { id:'labo-physio',   code:43, label:'Labo. Physiologie',        shortLabel:'Physiologie',     type:'LABORATOIRE',   lon:6.6181, lat:36.3741, status:'LIBRE' },
  { id:'labo-hemobio',  code:60, label:'Labo. Hémobiologie',       shortLabel:'Hémobiologie',    type:'LABORATOIRE',   lon:6.6183, lat:36.3736, status:'OCCUPE' },
  { id:'anapath',       code:62, label:'Anatomie Pathologique',    shortLabel:'Ana. Path.',      type:'LABORATOIRE',   lon:6.6184, lat:36.3743, status:'OCCUPE' },

  // IMAGERIE — north-east
  { id:'scanner',       code:15, label:'Scanner',                  shortLabel:'Scanner',         type:'IMAGERIE',      lon:6.6173, lat:36.3746, status:'MAINTENANCE' },
  { id:'radiologie',    code:17, label:'Radiologie Centrale',      shortLabel:'Radiologie',      type:'IMAGERIE',      lon:6.6167, lat:36.3744, status:'OCCUPE' },
  { id:'radiotherapie', code:51, label:'Radiothérapie',            shortLabel:'Radiothérapie',   type:'IMAGERIE',      lon:6.6176, lat:36.3745, status:'OCCUPE' },

  // PHARMACIE
  { id:'pharmacie',     code:20, label:'Pharmacie Centrale',       shortLabel:'Pharmacie',       type:'PHARMACIE',     lon:6.6155, lat:36.3728, status:'OCCUPE' },
  { id:'transfusion',   code:39, label:'Transfusion Sanguine',     shortLabel:'Transfusion',     type:'PHARMACIE',     lon:6.6155, lat:36.3725, status:'OCCUPE' },

  // ADMINISTRATION — north-west
  { id:'direction',     code:35, label:'Direction Générale',       shortLabel:'Direction',       type:'ADMINISTRATION',lon:6.6152, lat:36.3749, status:'LIBRE' },
  { id:'drh',           code:30, label:'DRH — DFC',               shortLabel:'DRH/DFC',         type:'ADMINISTRATION',lon:6.6149, lat:36.3747, status:'LIBRE' },
  { id:'dsii',          code:11, label:"DSII",                     shortLabel:'DSII',            type:'ADMINISTRATION',lon:6.6150, lat:36.3744, status:'LIBRE' },

  // LOGISTIQUE
  { id:'economat',      code:37, label:'Économat / Cuisine',       shortLabel:'Économat',        type:'LOGISTIQUE',    lon:6.6149, lat:36.3723, status:'LIBRE' },
  { id:'parc-auto',     code:25, label:'Parc Automobile',          shortLabel:'Parc Auto',       type:'LOGISTIQUE',    lon:6.6164, lat:36.3718, status:'LIBRE' },

  // ENSEIGNEMENT
  { id:'bibliotheque',  code:53, label:'Bibliothèque — Labo Anatomie', shortLabel:'Bibliothèque', type:'ENSEIGNEMENT', lon:6.6165, lat:36.3742, status:'LIBRE' },
];

export const TYPE_FILL: Record<ChuServiceType, string> = {
  URGENCE:        '#FFCDD2', CHIRURGIE:      '#FFE0B2',
  MEDECINE:       '#BBDEFB', CONSULTATION:   '#FBE9E7',
  LABORATOIRE:    '#E1BEE7', IMAGERIE:       '#B2EBF2',
  PHARMACIE:      '#C8E6C9', ADMINISTRATION: '#ECEFF1',
  LOGISTIQUE:     '#FFF9C4', ENSEIGNEMENT:   '#E8EAF6',
};

export const TYPE_STROKE: Record<ChuServiceType, string> = {
  URGENCE:        '#E53935', CHIRURGIE:      '#F57C00',
  MEDECINE:       '#1565C0', CONSULTATION:   '#BF360C',
  LABORATOIRE:    '#6A1B9A', IMAGERIE:       '#00838F',
  PHARMACIE:      '#2E7D32', ADMINISTRATION: '#546E7A',
  LOGISTIQUE:     '#F9A825', ENSEIGNEMENT:   '#283593',
};

export const TYPE_LABEL: Record<ChuServiceType, string> = {
  URGENCE:        'Urgences',     CHIRURGIE:      'Chirurgie',
  MEDECINE:       'Médecine',     CONSULTATION:   'Consultations',
  LABORATOIRE:    'Laboratoires', IMAGERIE:       'Imagerie',
  PHARMACIE:      'Pharmacie',    ADMINISTRATION: 'Administration',
  LOGISTIQUE:     'Logistique',   ENSEIGNEMENT:   'Enseignement',
};
