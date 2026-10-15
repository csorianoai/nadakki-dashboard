/**
 * Armazón común de módulos (César, 2026-10-13, PR 6a): la configuración de UN módulo de la Suite.
 *
 * El menú de la Suite sirve para ELEGIR módulo; al entrar, cada módulo abre su propio espacio de trabajo con
 * su propio menú lateral (modelo: Real Estate). Todos comparten el mismo armazón (components/shell). Esto es
 * solo la forma de los datos: el registro está en ./registro.ts y NO copia menús a mano.
 */
import type { LucideIcon } from "lucide-react";
import type { NavBadge, NavItem } from "@/lib/navigation";

export type ItemMenu = {
  id: string;
  label: string;
  href: string;
  icono?: LucideIcon;
  /** role_key exacto o prefijo con `*` ("bank*"); los administradores ven todo. */
  roles?: string[];
  /** Clave del catálogo 097 (Dealer OS). El armazón no la aplica todavía: la aplica la carcasa del core. */
  capability?: string | null;
  badge?: NavBadge;
  /** Se pasan tal cual al filtro existente (forge-global-sidebar-nav), que es quien los interpreta. */
  featureFlag?: NavItem["featureFlag"];
  coreMatchers?: string[];
  superAdminOnly?: boolean;
  sinModulo?: boolean;
  keywords?: string[];
  /** Una línea, en español, de qué hace la página (≤ 110 caracteres). La muestran las tarjetas de la pantalla del grupo. */
  descripcion?: string;
  /** Ruta aprobada que aún no tiene página (NavItem.pronto): el menú la pinta como «Pronto», sin enlace (href = ""). */
  pronto?: string;
};

export type GrupoMenu = {
  id: string;
  label: string;
  items: ItemMenu[];
  /** Rutas que, sin ser un item del menú, pertenecen al grupo (Marketing: las de cada pestaña de lib/navigation.ts). */
  prefijos?: string[];
  /** Icono del grupo: las tarjetas de sus páginas sin icono propio lo usan. */
  icono?: LucideIcon;
};

/** Menú de un core que conserva su carcasa propia: lo lee lib/migas.ts (misma salida que antes del registro). */
export type CarcasaCore = {
  prefijos: string[];
  modulo: { label: string; href: string };
  /** `capability` (Dealer OS) se conserva para que las migas no enlacen una sección a una entrada con condición de visibilidad. */
  grupos: { label: string; items: { label: string; href: string; capability?: string | null }[] }[];
};

export type ModuloConfig = {
  /** Las pantallas de grupo del módulo caen bajo una guarda de superadmin: solo ese rol las ve o las enlaza. */
  pantallaGrupoSoloSuperadmin?: boolean;
  id: string;
  label: string;
  icono: LucideIcon;
  /** Pantalla con la que abre el módulo. */
  raiz: string;
  /** Prefijos de ruta (por segmento) que le pertenecen. El más largo gana. */
  prefijos: string[];
  /** Módulo(s) del tenant (`subscribed_cores`) que lo habilitan. */
  coreMatchers: string[];
  /** Roles que lo ven; vacío = cualquiera (el filtro por página lo decide `roles` de cada item). */
  roles: string[];
  /** Id de la sección de lib/navigation.ts que gobierna su visibilidad (módulo del tenant y rol). */
  seccion: string;
  menu: GrupoMenu[];
  /** Color de acento (CSS); el armazón lo expone como --acento-modulo. */
  acento: string;
  /** "comun": sus pantallas usan ModuleShell. "propia": conserva su carcasa (solo la barra de MarcoSuite). */
  carcasa: "comun" | "propia";
  /** Rutas del módulo que, aun siendo "comun", conservan una carcasa propia. */
  propias?: string[];
  /** Prefijos de rutas de OTRO módulo que este menú enlaza a propósito (p. ej. crédito del concesionario). */
  compartidas?: string[];
  /** Visibilidad que decide el componente (Real Estate: 200 de /acceso), no la suscripción. */
  acceso?: "realtor";
  carcasas?: CarcasaCore[];
};
