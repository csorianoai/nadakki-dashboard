import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['reference/**', '.next/**', 'node_modules/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'spec/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../../../*', '../../../../*'], message: 'Autocontenido: no se sale de apps/sites-engine.' },
            { group: ['@/../*', '@/lib/*', '@/components/*', '@/app/*'], message: 'El alias @/ es solo de ./src; nada del panel.' },
          ],
        },
      ],
    },
  },
);
