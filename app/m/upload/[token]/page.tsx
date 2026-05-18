import { MobileUploadFlow } from "@/components/customer/upload/MobileUploadFlow";
import { decodeUploadTokenPayload } from "@/lib/customer/upload/decodeTokenPayload";
import { messages } from "@/lib/customer/upload/messages";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function MobileUploadPage({ params }: PageProps) {
  const { token: segment } = await params;
  const token = decodeURIComponent(segment);
  const preview = decodeUploadTokenPayload(token);
  if (!preview) {
    return (
      <p className="text-center text-red-800" role="alert">
        {messages.invalidToken}
      </p>
    );
  }
  const expMs = preview.exp * 1000;
  if (!Number.isFinite(expMs) || Date.now() >= expMs) {
    return (
      <p className="text-center text-red-800" role="alert">
        {messages.expiredToken}
      </p>
    );
  }

  return (
    <MobileUploadFlow token={token} applicationId={preview.a} stipulationId={preview.s} />
  );
}
