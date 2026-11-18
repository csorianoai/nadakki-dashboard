import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { money } from '@/templates/baylara/entities';
import { BlockError } from '@/blocks/model';

describe('ST2-07 formato de precio igual que Baylara (formatPrice)', () => {
  it('[positivo] USD sale como $450,000 en es y en', () => {
    expect(money({ amount: '450000', currency: 'USD' }, 'es')).toBe('$450,000');
    expect(money({ amount: '450000', currency: 'USD' }, 'en')).toBe('$450,000');
    expect(renderToStaticMarkup(h('p', null, money({ amount: '1250000', currency: 'USD' }, 'es')))).toContain('$1,250,000');
  });
  it('[negativo] moneda o importe invalidos -> error cerrado', () => {
    expect(() => money({ amount: 'abc', currency: 'USD' }, 'es')).toThrow(BlockError);
    expect(() => money({ amount: '10', currency: 'us' }, 'en')).toThrow(BlockError);
  });
  it('[tenant-ajeno] el formato no depende del sitio: sin datos devuelve vacio', () => {
    expect(money(undefined, 'es')).toBe('');
  });
});
