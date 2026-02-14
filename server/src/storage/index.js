import { fileStore } from './fileStore.js';

export function getStore(){
  // PG store intentionally omitted in this template to keep dependencies minimal.
  // Add pgStore.js using 'pg' and implement same interface.
  return fileStore;
}
