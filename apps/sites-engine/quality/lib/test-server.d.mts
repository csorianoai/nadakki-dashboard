export function pageHtml(siteId: string, pathname: string, defect?: string): string;
export function startTestServer(o?: { siteId?: string; defect?: 'sin-csp' | 'img-sin-alt' }): Promise<{ url: string; close(): Promise<void> }>;
