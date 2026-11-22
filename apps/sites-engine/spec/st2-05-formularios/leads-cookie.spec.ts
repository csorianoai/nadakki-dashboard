import { describe, expect, it } from 'vitest';
import { FORM_COOKIE, verifyFormCookie } from '@/leads/antispam';
import { formCookieFor } from '@/leads/cookie';

const A = '00000000-0000-4000-8000-0000000000b1';
const B = '00000000-0000-4000-8000-0000000000b2';
const S = 'synth-secret-0001';
const T = 1_800_000_000_000;
const nav = (h: Record<string, string> = {}) => new Headers({ accept: 'text/html', ...h });
const base = { method: 'GET', secret: S, now: T };

describe('ST2-05 cookie de tiempo de relleno', () => {
  it('[positivo] navegacion GET de HTML emite __Host- firmada, Secure, Path=/, sin Domain', () => {
    const c = formCookieFor({ ...base, headers: nav(), pathname: `/s/${A}/es/contacto` })!;
    expect(c.startsWith(`${FORM_COOKIE}=`)).toBe(true);
    expect(c).toMatch(/Secure/);
    expect(c).toMatch(/Path=\//);
    expect(c).not.toMatch(/Domain/i);
    expect(verifyFormCookie(S, A, /=([^;]+)/.exec(c)![1])).toBe(T);
  });
  it('[negativo] sin secreto, POST, no-HTML o cookie vigente no emite nada', () => {
    const p = `/s/${A}/es`;
    expect(formCookieFor({ ...base, secret: undefined, headers: nav(), pathname: p })).toBeNull();
    expect(formCookieFor({ ...base, method: 'POST', headers: nav(), pathname: p })).toBeNull();
    expect(formCookieFor({ ...base, headers: new Headers({ accept: 'image/png' }), pathname: p })).toBeNull();
    const own = formCookieFor({ ...base, headers: nav(), pathname: p })!;
    const v = /^([^;]+)/.exec(own)![1];
    expect(formCookieFor({ ...base, headers: nav({ cookie: v }), pathname: p })).toBeNull();
  });
  it('[tenant-ajeno] la cookie vigente de B no evita emitir la de A', () => {
    const b = /^([^;]+)/.exec(formCookieFor({ ...base, headers: nav(), pathname: `/s/${B}/es` })!)![1];
    expect(formCookieFor({ ...base, headers: nav({ cookie: b }), pathname: `/s/${A}/es` })).not.toBeNull();
  });
});
