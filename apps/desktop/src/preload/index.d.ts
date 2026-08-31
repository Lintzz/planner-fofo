import type { ApiPlannerFofo } from './index';

declare global {
  interface Window {
    plannerFofo: ApiPlannerFofo;
  }
}

export {};
