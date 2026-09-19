import NotFoundError from '#errors/NotFoundError';

import counterRepository from './counter.repository.js';

// tenant-aware modules: codes should be per-tenant
const TENANT_SCOPED = new Set(['ingredient', 'recipe', 'purchase', 'menu', 'supplier', 'stock-adjustment']);
// shared modules: global counter
const SHARED = new Set(['category', 'unit', 'user']);

class CounterService {
  async generate(module, tenantIdOrSession = null, maybeSession = null) {
    let tenantId = null;
    let session = null;

    // Parse args: generate(module), generate(module, session), generate(module, tenantId), generate(module, tenantId, session)
    if (tenantIdOrSession) {
      if (typeof tenantIdOrSession === 'object' && tenantIdOrSession.constructor?.name?.includes('Session')) {
        session = tenantIdOrSession;
      } else if (SHARED.has(module)) {
        // Shared modules ignore tenantId - treat arg as session if it's a session
        if (typeof tenantIdOrSession === 'object' && tenantIdOrSession.session) session = tenantIdOrSession;
        else if (tenantIdOrSession && typeof tenantIdOrSession === 'object' && tenantIdOrSession.constructor?.name === 'ClientSession') session = tenantIdOrSession;
        tenantId = null;
      } else if (TENANT_SCOPED.has(module)) {
        tenantId = tenantIdOrSession;
        if (maybeSession) session = maybeSession;
      } else {
        // Unknown module - treat as tenant scoped
        tenantId = tenantIdOrSession;
        if (maybeSession) session = maybeSession;
      }
    }

    // Shared modules always use global counter (tenantId null)
    const effectiveTenantId = SHARED.has(module) ? null : tenantId;

    const counter = await counterRepository.increment(module, effectiveTenantId, session);

    if (!counter) {
      throw new NotFoundError(`Counter configuration for "${module}" not found`);
    }

    const number = String(counter.sequence).padStart(counter.padding, '0');

    return `${counter.prefix}-${number}`;
  }
}

export default new CounterService();
