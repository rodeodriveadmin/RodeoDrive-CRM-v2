// Canonical vehicle types — used by vehicles, service pricing, and later
// job orders. Superset of the v1 enums (JobOrder + ServiceCatalog prices).

export const VEHICLE_TYPES = [
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "TRUCK",
  "COUPE",
  "MOTORBIKE",
  "OTHER",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
