export type TrackingStatusStep = 
  | "recoleccion"
  | "centro_distribucion"
  | "en_transito"
  | "en_reparto"
  | "entregado"
  | "incidencia";

export interface RateQuoteQuery {
  originCity?: string;
  destinationCity?: string;
  destCountryId?: string;
  destCityId?: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  serviceType: string;
}

export interface RateQuoteResult {
  estimatedCostCLP: number;
  basePrice: number;
  freightCost: number;
  insuranceCost: number;
  chargeableWeight: number;
  isVolumetric: boolean;
  volumetricWeightKg: number;
  totalUSD: number;
  deliveryHoursMin: number;
  deliveryHoursMax: number;
}
