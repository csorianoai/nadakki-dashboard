import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Car,
  Clock,
  Cog,
  DollarSign,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Truck,
  User,
  Users,
  Zap,
} from "lucide-react";

export type FilterCategoryId =
  | "location"
  | "condition"
  | "seller"
  | "makeModel"
  | "year"
  | "price"
  | "bodyType"
  | "color"
  | "mileage"
  | "drivetrain"
  | "fuel"
  | "engine"
  | "transmission"
  | "seatsDoors"
  | "equipment"
  | "published"
  | "keyword";

export type FilterCategory = {
  id: FilterCategoryId;
  label: string;
  icon: LucideIcon;
};

export const FILTER_CATEGORIES: FilterCategory[] = [
  { id: "location", label: "Ubicación", icon: MapPin },
  { id: "condition", label: "Condición del vehículo", icon: ShieldCheck },
  { id: "seller", label: "Vendedor", icon: User },
  { id: "makeModel", label: "Marca, modelo, trim", icon: Car },
  { id: "year", label: "Año del modelo", icon: Calendar },
  { id: "price", label: "Precio", icon: DollarSign },
  { id: "bodyType", label: "Tipo de carrocería", icon: Truck },
  { id: "color", label: "Color exterior", icon: Palette },
  { id: "mileage", label: "Kilometraje", icon: Gauge },
  { id: "drivetrain", label: "Tracción", icon: Cog },
  { id: "fuel", label: "Tipo de combustible", icon: Fuel },
  { id: "engine", label: "Motor", icon: Zap },
  { id: "transmission", label: "Transmisión", icon: Settings },
  { id: "seatsDoors", label: "Asientos y puertas", icon: Users },
  { id: "equipment", label: "Equipamiento", icon: Star },
  { id: "published", label: "Publicado desde", icon: Clock },
  { id: "keyword", label: "Búsqueda por palabra clave", icon: Search },
];
