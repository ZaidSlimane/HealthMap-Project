import { ChuService } from '../models/carte.model';

export const CHU_CAMPUS_POLYGON =
  "345.2,40.0 185.1,68.1 155.4,70.7 46.6,80.4 47.6,135.6 " +
  "40.8,200.4 40.0,207.9 59.1,210.1 59.6,241.5 74.5,241.5 " +
  "90.0,311.9 46.4,313.2 50.2,348.1 53.1,364.3 55.0,376.8 " +
  "108.0,431.3 123.1,458.2 120.2,462.3 124.4,468.5 120.3,473.7 " +
  "128.6,544.8 141.2,542.5 143.7,567.4 136.8,569.5 " +
  "117.5,598.5 107.9,600.0 88.1,617.6 62.7,619.8 " +
  "19.0,632.7 13.7,635.0 9.3,637.2 2.9,641.0 " +
  "0.0,644.1 0.0,652.3 23.7,726.8 28.4,741.0 " +
  "43.0,757.2 55.6,760.0 68.9,757.8 82.6,739.8 " +
  "101.1,735.9 105.9,731.3 111.9,728.4 126.6,745.8 " +
  "151.5,749.4 229.8,757.3 283.3,760.0 294.5,756.6 " +
  "303.0,743.4 317.8,738.3 319.4,737.4 326.1,734.6 " +
  "330.0,726.8 329.8,706.2 323.7,692.7 " +
  "359.4,665.1 399.7,662.5 415.6,640.5 " +
  "418.9,635.7 424.7,627.6 440.6,642.0 " +
  "468.7,602.5 497.8,564.0 516.7,531.5 345.2,40.0";

export const CHU_SERVICES: ChuService[] = [
  {
    id: 'medecine-interne', code: 10,
    label: 'Médecine Interne', shortLabel: 'Méd. Interne',
    type: 'MEDECINE', floor: 0, hasIndoorMap: true,
    x: 411, y: 366, width: 160, height: 123,
    totalBeds: 25, occupiedBeds: 18, status: 'OCCUPE', chef: 'Pr. Yacine Kitouni',
    indoorWidth: 800, indoorHeight: 500,
    rooms: [
      { id: 'mi-ch1', label: 'Chambre 1', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 20, y: 20, width: 150, height: 100 },
      { id: 'mi-ch2', label: 'Chambre 2', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 180, y: 20, width: 150, height: 100 },
      { id: 'mi-ch3', label: 'Chambre 3', type: 'CHAMBRE', status: 'LIBRE', beds: 4, bedsOccupied: 0, x: 340, y: 20, width: 150, height: 100 },
      { id: 'mi-ch4', label: 'Chambre 4', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 500, y: 20, width: 150, height: 100 },
      { id: 'mi-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 760, height: 25 },
      { id: 'mi-soins', label: 'Salle Soins', type: 'BOX', status: 'OCCUPE', x: 20, y: 165, width: 160, height: 90 },
      { id: 'mi-inf', label: 'Poste Infirmier', type: 'BUREAU', status: 'OCCUPE', x: 200, y: 165, width: 140, height: 90 },
      { id: 'mi-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 360, y: 165, width: 130, height: 90 },
    ]
  },

  // ════════ URGENCES ════════
  {
    id: 'urgences-medicales', code: 31,
    label: 'Consultation Urgences Médicales', shortLabel: 'Urgences Méd.',
    type: 'URGENCE', floor: 0, hasIndoorMap: true,
    x: 108, y: 581, width: 160, height: 114,
    totalBeds: 12, occupiedBeds: 12, status: 'CRITIQUE', chef: 'Pr. Ouahab',
    indoorWidth: 800, indoorHeight: 500,
    rooms: [
      { id: 'ur-accueil', label: 'Accueil Triage', type: 'SALLE_ATTENTE', status: 'OCCUPE', x: 20, y: 20, width: 200, height: 80 },
      { id: 'ur-box1', label: 'Box 1', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 20, y: 120, width: 100, height: 80 },
      { id: 'ur-box2', label: 'Box 2', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 130, y: 120, width: 100, height: 80 },
      { id: 'ur-box3', label: 'Box 3', type: 'BOX', status: 'LIBRE', beds: 1, bedsOccupied: 0, x: 240, y: 120, width: 100, height: 80 },
      { id: 'ur-box4', label: 'Box 4 Réanim.', type: 'BOX', status: 'CRITIQUE', beds: 1, bedsOccupied: 1, x: 350, y: 120, width: 120, height: 80, responsable: 'Dr. Ferhat' },
      { id: 'ur-obs', label: 'Observation', type: 'CHAMBRE', status: 'OCCUPE', beds: 6, bedsOccupied: 5, x: 490, y: 120, width: 180, height: 80 },
      { id: 'ur-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 210, width: 760, height: 25 },
      { id: 'ur-bureau', label: 'Bureau Médecin', type: 'BUREAU', status: 'OCCUPE', x: 20, y: 245, width: 130, height: 80 },
      { id: 'ur-inf', label: 'Poste Infirmier', type: 'BUREAU', status: 'OCCUPE', x: 160, y: 245, width: 130, height: 80 },
      { id: 'ur-mat', label: 'Matériel', type: 'RESERVE', status: 'LIBRE', x: 300, y: 245, width: 100, height: 80 },
      { id: 'ur-attente', label: 'Attente Familles', type: 'SALLE_ATTENTE', status: 'OCCUPE', x: 410, y: 245, width: 180, height: 80 },
      { id: 'ur-wc', label: 'WC', type: 'WC', status: 'LIBRE', x: 600, y: 245, width: 60, height: 80 },
    ]
  },
  {
    id: 'samu', code: 32,
    label: 'SAMU — Service Urgences Médicales', shortLabel: 'SAMU',
    type: 'URGENCE', floor: 0, hasIndoorMap: true,
    x: 207, y: 628, width: 140, height: 104,
    totalBeds: 20, occupiedBeds: 18, status: 'CRITIQUE', chef: 'Pr. Benhamed',
    indoorWidth: 700, indoorHeight: 450,
    rooms: [
      { id: 'samu-regulation', label: 'Centre Régulation', type: 'BUREAU', status: 'OCCUPE', x: 20, y: 20, width: 200, height: 100 },
      { id: 'samu-dechoc', label: 'Déchocage', type: 'BOX', status: 'CRITIQUE', beds: 4, bedsOccupied: 4, x: 240, y: 20, width: 200, height: 100, responsable: 'Dr. Aïssaoui' },
      { id: 'samu-obs', label: 'Observation SAMU', type: 'CHAMBRE', status: 'OCCUPE', beds: 8, bedsOccupied: 7, x: 460, y: 20, width: 200, height: 100 },
      { id: 'samu-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 660, height: 25 },
      { id: 'samu-ambu', label: 'Baie Ambulances', type: 'RESERVE', status: 'LIBRE', x: 20, y: 165, width: 180, height: 100 },
      { id: 'samu-pharma', label: 'Armoire Pharma', type: 'RESERVE', status: 'LIBRE', x: 210, y: 165, width: 120, height: 100 },
      { id: 'samu-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 340, y: 165, width: 130, height: 100 },
      { id: 'samu-wc', label: 'WC', type: 'WC', status: 'LIBRE', x: 480, y: 165, width: 60, height: 100 },
    ]
  },
  {
    id: 'urgences-ped', code: 33,
    label: 'Urgences Pédiatriques', shortLabel: 'Urg. Péd.',
    type: 'URGENCE', floor: 0, hasIndoorMap: true,
    x: 123, y: 675, width: 130, height: 95,
    totalBeds: 8, occupiedBeds: 6, status: 'OCCUPE', chef: 'Pr. Chérif',
    indoorWidth: 600, indoorHeight: 400,
    rooms: [
      { id: 'ped-triage', label: 'Triage', type: 'SALLE_ATTENTE', status: 'OCCUPE', x: 20, y: 20, width: 160, height: 80 },
      { id: 'ped-box1', label: 'Box 1', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 200, y: 20, width: 90, height: 80 },
      { id: 'ped-box2', label: 'Box 2', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 300, y: 20, width: 90, height: 80 },
      { id: 'ped-box3', label: 'Box 3', type: 'BOX', status: 'LIBRE', beds: 1, bedsOccupied: 0, x: 400, y: 20, width: 90, height: 80 },
      { id: 'ped-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 110, width: 560, height: 25 },
      { id: 'ped-obs', label: 'Observation', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 20, y: 145, width: 200, height: 100 },
      { id: 'ped-attente', label: 'Attente Parents', type: 'SALLE_ATTENTE', status: 'LIBRE', x: 240, y: 145, width: 150, height: 100 },
    ]
  },
  {
    id: 'urgences-chir', code: 46,
    label: 'Urgences Chirurgicales', shortLabel: 'Urg. Chir.',
    type: 'URGENCE', floor: 0, hasIndoorMap: true,
    x: 266, y: 675, width: 130, height: 95,
    totalBeds: 10, occupiedBeds: 8, status: 'OCCUPE', chef: 'Pr. Benmansour',
    indoorWidth: 700, indoorHeight: 400,
    rooms: [
      { id: 'uc-accueil', label: 'Accueil', type: 'SALLE_ATTENTE', status: 'OCCUPE', x: 20, y: 20, width: 150, height: 80 },
      { id: 'uc-box1', label: 'Box Examen 1', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 190, y: 20, width: 100, height: 80 },
      { id: 'uc-box2', label: 'Box Examen 2', type: 'BOX', status: 'OCCUPE', beds: 1, bedsOccupied: 1, x: 300, y: 20, width: 100, height: 80 },
      { id: 'uc-bloc', label: 'Mini Bloc', type: 'BLOC', status: 'OCCUPE', x: 420, y: 20, width: 160, height: 80 },
      { id: 'uc-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 110, width: 660, height: 25 },
      { id: 'uc-obs', label: 'Observation Chir.', type: 'CHAMBRE', status: 'OCCUPE', beds: 6, bedsOccupied: 5, x: 20, y: 145, width: 240, height: 100 },
      { id: 'uc-bureau', label: 'Bureau Chirurgien', type: 'BUREAU', status: 'LIBRE', x: 280, y: 145, width: 140, height: 100 },
    ]
  },
  {
    id: 'urgences-cardio', code: 63,
    label: 'Urgences Cardiologie — Cathétérisme', shortLabel: 'Urg. Cardio',
    type: 'URGENCE', floor: 0, hasIndoorMap: true,
    x: 355, y: 590, width: 130, height: 95,
    totalBeds: 6, occupiedBeds: 6, status: 'CRITIQUE', chef: 'Pr. Guechi',
    indoorWidth: 600, indoorHeight: 380,
    rooms: [
      { id: 'cu-usc', label: 'USC Soins Continus', type: 'CHAMBRE', status: 'CRITIQUE', beds: 4, bedsOccupied: 4, x: 20, y: 20, width: 240, height: 100, responsable: 'Dr. Maacha' },
      { id: 'cu-cath', label: 'Cathétérisme', type: 'BLOC', status: 'OCCUPE', x: 280, y: 20, width: 180, height: 100 },
      { id: 'cu-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 560, height: 25 },
      { id: 'cu-ecg', label: 'Salle ECG', type: 'BOX', status: 'LIBRE', x: 20, y: 165, width: 120, height: 80 },
      { id: 'cu-bureau', label: 'Bureau Médecin', type: 'BUREAU', status: 'OCCUPE', x: 160, y: 165, width: 120, height: 80 },
    ]
  },

  // ════════ CHIRURGIE ════════
  {
    id: 'chirurgie-ab', code: 45,
    label: 'Chirurgie A/B — Pavillon Ibn Sina', shortLabel: 'Chirurgie A/B',
    type: 'CHIRURGIE', floor: 1, hasIndoorMap: true,
    x: 241, y: 172, width: 180, height: 133,
    totalBeds: 60, occupiedBeds: 48, status: 'OCCUPE', chef: 'Pr. Brahimi',
    indoorWidth: 1000, indoorHeight: 600,
    rooms: [
      { id: 'bl-a1', label: 'Bloc A Salle 1', type: 'BLOC', status: 'OCCUPE', x: 20, y: 20, width: 160, height: 100 },
      { id: 'bl-a2', label: 'Bloc A Salle 2', type: 'BLOC', status: 'LIBRE', x: 200, y: 20, width: 160, height: 100 },
      { id: 'bl-b1', label: 'Bloc B Salle 1', type: 'BLOC', status: 'OCCUPE', x: 380, y: 20, width: 160, height: 100 },
      { id: 'bl-neuro', label: 'Bloc Neurochir.', type: 'BLOC', status: 'OCCUPE', x: 560, y: 20, width: 160, height: 100 },
      { id: 'bl-ortho', label: 'Bloc Ortho', type: 'BLOC', status: 'MAINTENANCE', x: 740, y: 20, width: 160, height: 100 },
      { id: 'bl-reveil', label: 'Salle Réveil', type: 'CHAMBRE', status: 'OCCUPE', beds: 10, bedsOccupied: 6, x: 20, y: 140, width: 300, height: 100 },
      { id: 'bl-couloir1', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 250, width: 960, height: 30 },
      { id: 'bl-ch1', label: 'Ch. 1 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 20, y: 290, width: 150, height: 100 },
      { id: 'bl-ch2', label: 'Ch. 2 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 180, y: 290, width: 150, height: 100 },
      { id: 'bl-ch3', label: 'Ch. 3 (4 lits)', type: 'CHAMBRE', status: 'LIBRE', beds: 4, bedsOccupied: 0, x: 340, y: 290, width: 150, height: 100 },
      { id: 'bl-ch4', label: 'Ch. 4 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 500, y: 290, width: 150, height: 100 },
      { id: 'bl-ch5', label: 'Ch. 5 Ortho', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 660, y: 290, width: 150, height: 100 },
      { id: 'bl-inf', label: 'Poste Infirmier', type: 'BUREAU', status: 'OCCUPE', x: 820, y: 290, width: 160, height: 100 },
      { id: 'bl-couloir2', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 400, width: 960, height: 30 },
      { id: 'bl-ch6', label: 'Ch. 6 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 20, y: 440, width: 150, height: 100 },
      { id: 'bl-ch7', label: 'Ch. 7 (4 lits)', type: 'CHAMBRE', status: 'LIBRE', beds: 4, bedsOccupied: 2, x: 180, y: 440, width: 150, height: 100 },
      { id: 'bl-chef', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 340, y: 440, width: 130, height: 100 },
      { id: 'bl-wc', label: 'Sanitaires', type: 'WC', status: 'LIBRE', x: 480, y: 440, width: 80, height: 100 },
    ]
  },
  {
    id: 'neurochirurgie', code: 45,
    label: 'Neurochirurgie — Orthopédie', shortLabel: 'Neurochir/Ortho',
    type: 'CHIRURGIE', floor: 1, hasIndoorMap: true,
    x: 161, y: 114, width: 160, height: 123,
    totalBeds: 30, occupiedBeds: 22, status: 'OCCUPE', chef: 'Pr. Kessabi',
    indoorWidth: 700, indoorHeight: 500,
    rooms: [
      { id: 'no-bloc1', label: 'Bloc Neuro 1', type: 'BLOC', status: 'OCCUPE', x: 20, y: 20, width: 200, height: 100 },
      { id: 'no-bloc2', label: 'Bloc Ortho 1', type: 'BLOC', status: 'OCCUPE', x: 240, y: 20, width: 200, height: 100 },
      { id: 'no-reveil', label: 'Réveil', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 460, y: 20, width: 200, height: 100 },
      { id: 'no-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 660, height: 25 },
      { id: 'no-ch1', label: 'Ch. 1 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 20, y: 165, width: 150, height: 100 },
      { id: 'no-ch2', label: 'Ch. 2 (4 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 180, y: 165, width: 150, height: 100 },
      { id: 'no-ch3', label: 'Ch. 3 (4 lits)', type: 'CHAMBRE', status: 'LIBRE', beds: 4, bedsOccupied: 0, x: 340, y: 165, width: 150, height: 100 },
      { id: 'no-inf', label: 'Poste Infirmier', type: 'BUREAU', status: 'OCCUPE', x: 500, y: 165, width: 160, height: 100 },
    ]
  },
  {
    id: 'brules', code: 16,
    label: 'Centre des Brûlés', shortLabel: 'Brûlés',
    type: 'CHIRURGIE', floor: 0, hasIndoorMap: true,
    x: 391, y: 165, width: 130, height: 104,
    totalBeds: 12, occupiedBeds: 10, status: 'CRITIQUE', chef: 'Pr. Hadji',
    indoorWidth: 700, indoorHeight: 400,
    rooms: [
      { id: 'br-sterile', label: 'Zone Stérile', type: 'BLOC', status: 'OCCUPE', x: 20, y: 20, width: 200, height: 120 },
      { id: 'br-soins', label: 'Soins Brûlés', type: 'CHAMBRE', status: 'CRITIQUE', beds: 6, bedsOccupied: 6, x: 240, y: 20, width: 200, height: 120, responsable: 'Dr. Sifi' },
      { id: 'br-conv', label: 'Convalescence', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 3, x: 460, y: 20, width: 200, height: 120 },
      { id: 'br-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 150, width: 660, height: 25 },
      { id: 'br-bain', label: 'Bain Thérapeutique', type: 'SALLE_ATTENTE', status: 'LIBRE', x: 20, y: 185, width: 160, height: 80 },
      { id: 'br-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 200, y: 185, width: 130, height: 80 },
    ]
  },
  {
    id: 'chir-plastique', code: 14,
    label: 'Chirurgie Plastique', shortLabel: 'Chir. Plastique',
    type: 'CHIRURGIE', floor: 0, hasIndoorMap: true,
    x: 516, y: 208, width: 130, height: 104,
    totalBeds: 15, occupiedBeds: 10, status: 'OCCUPE', chef: 'Pr. Aoudia',
    indoorWidth: 600, indoorHeight: 400,
    rooms: [
      { id: 'cp-bloc', label: 'Bloc Plastique', type: 'BLOC', status: 'OCCUPE', x: 20, y: 20, width: 200, height: 100 },
      { id: 'cp-ch1', label: 'Ch. 1 (5 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 5, bedsOccupied: 4, x: 240, y: 20, width: 170, height: 100 },
      { id: 'cp-ch2', label: 'Ch. 2 (5 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 5, bedsOccupied: 4, x: 420, y: 20, width: 160, height: 100 },
      { id: 'cp-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 560, height: 25 },
      { id: 'cp-soins', label: 'Salle Soins', type: 'BOX', status: 'OCCUPE', x: 20, y: 165, width: 160, height: 90 },
      { id: 'cp-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 200, y: 165, width: 130, height: 90 },
    ]
  },

  // ════════ MÉDECINE ════════
  {
    id: 'cardiologie', code: 47,
    label: 'Cardiologie — Pneumologie — Rhumatologie', shortLabel: 'Cardio/Pneumo',
    type: 'MEDECINE', floor: 0, hasIndoorMap: true,
    x: 465, y: 282, width: 160, height: 123,
    totalBeds: 35, occupiedBeds: 28, status: 'OCCUPE', chef: 'Pr. Zemmouri',
    indoorWidth: 800, indoorHeight: 500,
    rooms: [
      { id: 'cp2-usc', label: 'USC Cardio', type: 'CHAMBRE', status: 'CRITIQUE', beds: 6, bedsOccupied: 6, x: 20, y: 20, width: 200, height: 110, responsable: 'Dr. Bensaid' },
      { id: 'cp2-ch1', label: 'Ch. Cardio', type: 'CHAMBRE', status: 'OCCUPE', beds: 8, bedsOccupied: 7, x: 240, y: 20, width: 200, height: 110 },
      { id: 'cp2-ch2', label: 'Ch. Pneumo', type: 'CHAMBRE', status: 'OCCUPE', beds: 8, bedsOccupied: 6, x: 460, y: 20, width: 200, height: 110 },
      { id: 'cp2-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 140, width: 760, height: 25 },
      { id: 'cp2-ch3', label: 'Ch. Rhumato', type: 'CHAMBRE', status: 'OCCUPE', beds: 8, bedsOccupied: 5, x: 20, y: 175, width: 200, height: 100 },
      { id: 'cp2-echo', label: 'Échographie Cardio', type: 'BLOC', status: 'LIBRE', x: 240, y: 175, width: 160, height: 100 },
      { id: 'cp2-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 420, y: 175, width: 130, height: 100 },
    ]
  },
  {
    id: 'neurologie', code: 48,
    label: 'Neurologie', shortLabel: 'Neurologie',
    type: 'MEDECINE', floor: 0, hasIndoorMap: true,
    x: 386, y: 224, width: 140, height: 114,
    totalBeds: 24, occupiedBeds: 18, status: 'OCCUPE', chef: 'Pr. Tahar',
    indoorWidth: 700, indoorHeight: 450,
    rooms: [
      { id: 'ne-usin', label: 'USIN Neurologie', type: 'CHAMBRE', status: 'OCCUPE', beds: 4, bedsOccupied: 4, x: 20, y: 20, width: 200, height: 100, responsable: 'Dr. Harrache' },
      { id: 'ne-eeg', label: 'Salle EEG', type: 'BLOC', status: 'LIBRE', x: 240, y: 20, width: 160, height: 100 },
      { id: 'ne-ch1', label: 'Ch. 1 (6 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 6, bedsOccupied: 5, x: 420, y: 20, width: 200, height: 100 },
      { id: 'ne-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 130, width: 660, height: 25 },
      { id: 'ne-ch2', label: 'Ch. 2 (6 lits)', type: 'CHAMBRE', status: 'OCCUPE', beds: 6, bedsOccupied: 4, x: 20, y: 165, width: 200, height: 100 },
      { id: 'ne-soins', label: 'Salle Soins', type: 'BOX', status: 'OCCUPE', x: 240, y: 165, width: 140, height: 100 },
      { id: 'ne-bureau', label: 'Bureau Chef', type: 'BUREAU', status: 'LIBRE', x: 400, y: 165, width: 130, height: 100 },
    ]
  },
  { id: 'hematologie', code: 42, label: 'Hématologie', shortLabel: 'Hématologie', type: 'MEDECINE', floor: 0, hasIndoorMap: false, x: 301, y: 334, width: 130, height: 104, totalBeds: 20, occupiedBeds: 14, status: 'OCCUPE', rooms: [] },
  { id: 'infectieux', code: 41, label: 'Maladies Infectieuses', shortLabel: 'Infectieux', type: 'MEDECINE', floor: 0, hasIndoorMap: false, x: 480, y: 460, width: 130, height: 104, totalBeds: 24, occupiedBeds: 20, status: 'OCCUPE', rooms: [] },
  { id: 'hemodialyse', code: 5, label: 'Hémodialyse', shortLabel: 'Hémodialyse', type: 'MEDECINE', floor: 0, hasIndoorMap: false, x: 243, y: 355, width: 140, height: 104, totalBeds: 20, occupiedBeds: 17, status: 'OCCUPE', rooms: [] },

  // ════════ CONSULTATIONS ════════
  { id: 'gastro', code: 6, label: 'Gastro-Entérologie', shortLabel: 'Gastro-Entéro', type: 'CONSULTATION', floor: 0, hasIndoorMap: false, x: 176, y: 397, width: 130, height: 104, totalBeds: 4, occupiedBeds: 3, status: 'OCCUPE', rooms: [] },
  { id: 'ophtalmologie', code: 7, label: 'Ophtalmologie', shortLabel: 'Ophtalmologie', type: 'CONSULTATION', floor: 0, hasIndoorMap: false, x: 92, y: 506, width: 120, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'endocrinologie', code: 8, label: 'Endocrinologie', shortLabel: 'Endocrino.', type: 'CONSULTATION', floor: 0, hasIndoorMap: false, x: 253, y: 443, width: 120, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'reeducation', code: 10, label: 'Rééducation Fonctionnelle', shortLabel: 'Rééducation', type: 'CONSULTATION', floor: 0, hasIndoorMap: false, x: 355, y: 481, width: 130, height: 104, totalBeds: 10, occupiedBeds: 7, status: 'OCCUPE', rooms: [] },

  // ════════ LABORATOIRES ════════
  {
    id: 'labo-bacterio', code: 18,
    label: 'Laboratoire Bactériologie', shortLabel: 'Bactériologie',
    type: 'LABORATOIRE', floor: 0, hasIndoorMap: true,
    x: 569, y: 317, width: 130, height: 95,
    totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', chef: 'Pr. Dali',
    indoorWidth: 600, indoorHeight: 350,
    rooms: [
      { id: 'bac-rec', label: 'Réception', type: 'SALLE_ATTENTE', status: 'OCCUPE', x: 20, y: 20, width: 160, height: 80 },
      { id: 'bac-cultures', label: 'Salle Cultures', type: 'BUREAU', status: 'OCCUPE', x: 200, y: 20, width: 160, height: 80 },
      { id: 'bac-abio', label: 'Antibiogrammes', type: 'BUREAU', status: 'OCCUPE', x: 380, y: 20, width: 160, height: 80 },
      { id: 'bac-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 110, width: 560, height: 25 },
      { id: 'bac-autoclave', label: 'Autoclave', type: 'RESERVE', status: 'LIBRE', x: 20, y: 145, width: 130, height: 80 },
      { id: 'bac-stockage', label: 'Stockage', type: 'RESERVE', status: 'LIBRE', x: 160, y: 145, width: 130, height: 80 },
    ]
  },
  { id: 'labo-biochimie', code: 19, label: 'Biochimie', shortLabel: 'Biochimie', type: 'LABORATOIRE', floor: 0, hasIndoorMap: false, x: 623, y: 254, width: 130, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },
  { id: 'labo-physiologie', code: 43, label: 'Labo. Physiologie', shortLabel: 'Physiologie', type: 'LABORATOIRE', floor: 0, hasIndoorMap: false, x: 574, y: 193, width: 120, height: 91, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'labo-hemobio', code: 60, label: 'Labo. Hémobiologie', shortLabel: 'Hémobiologie', type: 'LABORATOIRE', floor: 0, hasIndoorMap: false, x: 664, y: 319, width: 120, height: 91, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },
  { id: 'labo-histologie', code: 61, label: 'Labo. Histologie', shortLabel: 'Histologie', type: 'LABORATOIRE', floor: 0, hasIndoorMap: false, x: 717, y: 256, width: 120, height: 91, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },
  { id: 'labo-anapath', code: 62, label: 'Anatomie Pathologique', shortLabel: 'Ana. Path.', type: 'LABORATOIRE', floor: 0, hasIndoorMap: false, x: 682, y: 193, width: 120, height: 91, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },

  // ════════ IMAGERIE ════════
  {
    id: 'scanner', code: 15,
    label: 'Scanner', shortLabel: 'Scanner',
    type: 'IMAGERIE', floor: 0, hasIndoorMap: true,
    x: 355, y: 60, width: 130, height: 104,
    totalBeds: 0, occupiedBeds: 0, status: 'MAINTENANCE',
    indoorWidth: 550, indoorHeight: 350,
    rooms: [
      { id: 'sc-attente', label: 'Salle Attente', type: 'SALLE_ATTENTE', status: 'LIBRE', x: 20, y: 20, width: 160, height: 80 },
      { id: 'sc-cabine', label: 'Cabine Scanner', type: 'BLOC', status: 'MAINTENANCE', x: 200, y: 20, width: 200, height: 120 },
      { id: 'sc-commande', label: 'Commande', type: 'BUREAU', status: 'MAINTENANCE', x: 420, y: 20, width: 100, height: 80 },
      { id: 'sc-couloir', label: '', type: 'COULOIR', status: 'LIBRE', x: 20, y: 150, width: 510, height: 25 },
      { id: 'sc-bureau', label: 'Bureau Radiologue', type: 'BUREAU', status: 'LIBRE', x: 20, y: 185, width: 150, height: 80 },
    ]
  },
  { id: 'radiologie', code: 17, label: 'Radiologie Centrale', shortLabel: 'Radiologie', type: 'IMAGERIE', floor: 0, hasIndoorMap: false, x: 207, y: 60, width: 140, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },
  { id: 'radiotherapie', code: 51, label: 'Radiothérapie — Oncologie', shortLabel: 'Radiothérapie', type: 'IMAGERIE', floor: 0, hasIndoorMap: false, x: 480, y: 60, width: 130, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },

  // ════════ PHARMACIE ════════
  { id: 'pharmacie', code: 20, label: 'Pharmacie Centrale', shortLabel: 'Pharmacie', type: 'PHARMACIE', floor: 0, hasIndoorMap: false, x: 118, y: 376, width: 140, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },
  { id: 'transfusion', code: 39, label: 'Centre Transfusion Sanguine', shortLabel: 'Transfusion', type: 'PHARMACIE', floor: 0, hasIndoorMap: false, x: 123, y: 443, width: 130, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'OCCUPE', rooms: [] },

  // ════════ ADMINISTRATION ════════
  { id: 'direction', code: 35, label: 'Direction Générale', shortLabel: 'Direction', type: 'ADMINISTRATION', floor: 0, hasIndoorMap: false, x: 54, y: 34, width: 160, height: 114, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'drh-dfc', code: 30, label: 'DRH — DFC', shortLabel: 'DRH/DFC', type: 'ADMINISTRATION', floor: 0, hasIndoorMap: false, x: 40, y: 81, width: 140, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'dsii', code: 11, label: "DSII — Systèmes d'Information", shortLabel: 'DSII', type: 'ADMINISTRATION', floor: 0, hasIndoorMap: false, x: 74, y: 172, width: 120, height: 91, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },

  // ════════ LOGISTIQUE ════════
  { id: 'economat', code: 37, label: 'Économat — Cuisine Centrale', shortLabel: 'Économat', type: 'LOGISTIQUE', floor: 0, hasIndoorMap: false, x: 40, y: 539, width: 150, height: 114, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'buanderie', code: 21, label: 'Buanderie', shortLabel: 'Buanderie', type: 'LOGISTIQUE', floor: 0, hasIndoorMap: false, x: 40, y: 612, width: 130, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'parc-auto', code: 25, label: 'Parc Automobile', shortLabel: 'Parc Auto', type: 'LOGISTIQUE', floor: 0, hasIndoorMap: false, x: 386, y: 670, width: 140, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },

  // ════════ ENSEIGNEMENT ════════
  { id: 'bibliotheque', code: 53, label: 'Bibliothèque — Labo Anatomie', shortLabel: 'Bibliothèque', type: 'ENSEIGNEMENT', floor: 0, hasIndoorMap: false, x: 296, y: 102, width: 140, height: 104, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
  { id: 'formation', code: 55, label: 'Formation — Télémédecine', shortLabel: 'Formation', type: 'ENSEIGNEMENT', floor: 0, hasIndoorMap: false, x: 176, y: 149, width: 130, height: 95, totalBeds: 0, occupiedBeds: 0, status: 'LIBRE', rooms: [] },
];
