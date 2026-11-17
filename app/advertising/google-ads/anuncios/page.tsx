"use client";

import Link from "next/link";
import AnunciosClient from "./AnunciosClient";

export default function AnunciosGoogleAdsPage() {
  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <Link href="/advertising/google-ads" className="text-sm text-blue-600 hover:underline">
          ← Google Ads
        </Link>
        <h1 className="text-3xl font-bold mt-2">Anuncios de Google Ads</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Prepara borradores de anuncios de búsqueda. Nada se publica en Google desde esta pantalla sin aprobación.
        </p>
      </div>
      <AnunciosClient />
    </div>
  );
}
