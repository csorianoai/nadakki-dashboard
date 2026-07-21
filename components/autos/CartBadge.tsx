"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/components/autos/CartProvider";
import { cn } from "@/lib/utils";

export function CartBadge({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { cartCount, ready } = useCartStore();
  const count = cartCount();

  if (!ready || count === 0) return null;

  const label = `Carrito (${count})`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-nk-border px-3 py-1.5 text-sm font-semibold text-nk-fg transition hover:bg-nk-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          className,
        )}
        aria-label={label}
      >
        <ShoppingCart className="h-4 w-4 shrink-0 text-brand" aria-hidden />
        <span className="hidden sm:inline">Carrito</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      </button>
    );
  }

  return (
    <Link
      href="/autos/cart"
      className={cn(
        "relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-nk-border px-3 py-1.5 text-sm font-semibold text-nk-fg transition hover:bg-nk-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
      aria-label={label}
    >
      <ShoppingCart className="h-4 w-4 shrink-0 text-brand" aria-hidden />
      <span className="hidden sm:inline">Carrito ({count})</span>
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white sm:hidden">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}
