import canik from './canik.js';
import mp5 from './mp5.js';
import hk416 from './hk416.js';
import benelli from './benelli.js';
import glock17 from './glock17.js';

export const WEAPONS = [canik, mp5, hk416, benelli, glock17];

// Cérakote / anodisation (pièces métalliques principales).
export const METAL = [
  { id: 'black', name: 'Noir', hex: '#1c1d20' },
  { id: 'smoke', name: 'Smoke Grey', hex: '#6b7075' },
  { id: 'ral8000', name: 'RAL 8000', hex: '#8a6f4d' },
  { id: 'fde', name: 'Flat Dark Earth', hex: '#9a8466' },
  { id: 'odg', name: 'OD Green', hex: '#4a523f' },
  { id: 'tungsten', name: 'Tungsten', hex: '#45484c' },
  { id: 'cobalt', name: 'Cobalt', hex: '#2e4f86' },
];

// Polymères (carcasse, poignées, crosse).
export const POLY = [
  { id: 'black', name: 'Noir', hex: '#151618' },
  { id: 'fde', name: 'FDE', hex: '#8a7458' },
  { id: 'odg', name: 'OD', hex: '#3f4636' },
  { id: 'grey', name: 'Gris', hex: '#56595d' },
];

// Talons de chargeur aluminium.
export const PADS = [
  { id: 'red', name: 'Rouge', hex: '#b3261e' },
  { id: 'blue', name: 'Bleu', hex: '#2459c4' },
  { id: 'alu', name: 'Alu', hex: '#b9bec4' },
  { id: 'gold', name: 'Or', hex: '#c49a3a' },
];

export const MODE_LABEL = { safe: 'SAFE', semi: 'SEMI', auto: 'AUTO' };
