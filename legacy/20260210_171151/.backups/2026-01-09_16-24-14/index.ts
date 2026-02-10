// lib/api/index.ts - Unified API Export
// Mantiene compatibilidad con api.ts existente + nuevos módulos

export * from './base';
export * from './decisions';
export * from './tenants';
export * from './workflows';
export * from './metrics';

// Re-export defaults como named exports
export { default as decisionsAPI } from './decisions';
export { default as tenantsAPI } from './tenants';
export { default as workflowsAPI } from './workflows';
export { default as metricsAPI } from './metrics';

// Unified client (opcional, para imports más limpios)
export const nadakkiAPI = {
  decisions: require('./decisions').default,
  tenants: require('./tenants').default,
  workflows: require('./workflows').default,
  metrics: require('./metrics').default,
};
