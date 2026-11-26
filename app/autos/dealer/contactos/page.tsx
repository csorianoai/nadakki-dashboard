import Link from "next/link";
import { ContactosPantalla } from "./ContactosPantalla";

export default function ContactosPage() {
  return (
    <>
      <nav className="px-6 pt-4 text-sm">
        <Link href="/autos/dealer/contactos/equipo" className="text-nk-fg underline">
          Equipo: invitá a tus vendedores
        </Link>
      </nav>
      <ContactosPantalla />
    </>
  );
}
