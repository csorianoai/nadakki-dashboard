import { ForgeSkeleton } from "../primitives/ForgeSkeleton";

export function CHLoadingState() {
  return (
    <div className="space-y-4 p-4 md:p-8" aria-busy="true" aria-label="Cargando">
      <ForgeSkeleton className="h-8 w-56" />
      <ForgeSkeleton className="h-28 w-full" />
      <ForgeSkeleton className="h-28 w-full" />
    </div>
  );
}
