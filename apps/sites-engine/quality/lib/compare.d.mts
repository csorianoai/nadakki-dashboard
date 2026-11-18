export interface CompareResult { status: 'ok' | 'pixels' | 'height' | 'width'; diffPixels: number; ratio: number; width: number; height: number; refHeight: number; candHeight: number; diffPng: Buffer | null }
export function comparePng(ref: Buffer, cand: Buffer, o: { threshold: number }): CompareResult;
export function baselineDir(root: string, siteId: string): string;
export function assertBaselineOwnership(dir: string, siteId: string): void;
export function isCi(env?: Record<string, string | undefined>): boolean;
export function captureName(route: string, width: number): string;
export const DEFAULT_THRESHOLD: number;
export const WIDTHS: { width: number; height: number }[];
