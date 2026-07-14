import { describe, it, expect } from 'vitest';
import { EMS_CONFIG } from './config/ems-config';

describe('EMS Config Validation', () => {
  it('should load the configured brand title', () => {
    expect(EMS_CONFIG.brand.title).toBe('Safeway');
  });

  it('should ensure all lifecycle stages are enabled by default', () => {
    expect(EMS_CONFIG.stages.ENQUIRY.enabled).toBe(true);
    expect(EMS_CONFIG.stages.REFILLING.enabled).toBe(true);
    expect(EMS_CONFIG.stages.SERVICES.enabled).toBe(true);
  });
});
