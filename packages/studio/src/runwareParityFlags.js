/** Feature flags for staged Runware parity rollout — fork-owned; ADR-005. */

export const RUNWARE_PARITY_I2I_FLAG = 'RUNWARE_PARITY_I2I';
export const RUNWARE_PARITY_I2V_FLAG = 'RUNWARE_PARITY_I2V';

/**
 * @param {Storage} [storage]
 */
export function isRunwareParityI2iEnabled(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(RUNWARE_PARITY_I2I_FLAG);
    if (v === '0') return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * @param {Storage} [storage]
 */
export function isRunwareParityI2vEnabled(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(RUNWARE_PARITY_I2V_FLAG);
    if (v === '0') return false;
    return true;
  } catch {
    return true;
  }
}
