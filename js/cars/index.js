import rs3 from './rs3.js';
import corvette from './corvette.js';
import camaro from './camaro.js';
import c6 from './c6.js';
import tesla from './tesla.js';

export const CARS = [rs3, corvette, camaro, c6, tesla];

export const FINISHES = [
  { id: 'gloss', name: 'Brillant' },
  { id: 'metal', name: 'Métallisé' },
  { id: 'pearl', name: 'Nacré' },
  { id: 'satin', name: 'Satiné' },
  { id: 'mat', name: 'Mat' },
];

// Finitions de jantes (les jantes elles-mêmes sont celles du modèle 3D).
export const RIM_FINISHES = [
  { id: 'silver', name: 'Argent', base: '#c4c9ce', hi: '#f3f5f7', lo: '#6a7077' },
  { id: 'gunmetal', name: 'Gunmetal', base: '#565b62', hi: '#9aa1a9', lo: '#26292d' },
  { id: 'black', name: 'Noir brillant', base: '#151618', hi: '#62666c', lo: '#050506' },
  { id: 'black-mat', name: 'Noir mat', base: '#1d1e20', hi: '#34373a', lo: '#0d0e0f' },
  { id: 'bronze', name: 'Bronze', base: '#86683e', hi: '#cfae74', lo: '#45361f' },
  { id: 'chrome', name: 'Chrome', base: '#d6dadf', hi: '#ffffff', lo: '#3f444b' },
];
