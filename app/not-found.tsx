import { PaginaNoEncontrada } from "@/components/nav/PaginaNoEncontrada";

/** 404 de toda la app: se pinta dentro del layout raíz, así que la Suite conserva su menú. */
export default function NotFound() {
  return <PaginaNoEncontrada />;
}
