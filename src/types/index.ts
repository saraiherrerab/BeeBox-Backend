export type TrackingStatusStep = 
  | "recoleccion"
  | "centro_distribucion"
  | "en_transito"
  | "en_reparto"
  | "entregado"
  | "incidencia";

export interface RateQuoteQuery {
  originCity: string;
  destinationCity: string;
  weightKg: number;
  serviceType: string;
}

export interface RateQuoteResult {
  estimatedCostCLP: number;
  deliveryHoursMin: number;
  deliveryHoursMax: number;
}
