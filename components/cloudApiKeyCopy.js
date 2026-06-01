/** i18n-ready copy for cloud API key UI (entry + settings). */

export const APP_TITLE = 'Open Generative AI';

export const SETTINGS_TITLE = 'API Settings';
export const SETTINGS_SUBTITLE =
  'API keys and cloud routing — stored only in this browser. Entry choice is not the same as per-studio routing.';

export const ROUTING_SECTION_TITLE = 'Cloud routing priority';
export const ROUTING_ENTRY_NOTE =
  'Agents and Workflows always use Muapi. Media studios follow the priority below.';
export const ROUTING_FALLBACK_LABEL = 'Allow Muapi as fallback when Runware fails or is unavailable';

export const PROVIDER_COPY = {
  muapi: {
    label: 'Muapi',
    entrySubtitle: 'Enter your Muapi.ai API key to start.',
    footerHref: 'https://muapi.ai/access-keys',
    footerText: 'Get one free →',
    keyLinkText: 'Get a Muapi API key →',
  },
  runware: {
    label: 'Runware',
    entrySubtitle: 'Enter your Runware API key to start.',
    footerHref: 'https://runware.ai',
    footerText: 'Get an API key →',
    keyLinkText: 'Get a Runware API key →',
  },
};

export const ENTRY_CTA = 'Get Started';
export const SETTINGS_SAVE_CTA = 'Save account';
export const REMOVE_KEY_LABEL = 'Remove key';
export const CLOSE_LABEL = 'Close';

/** @param {string} providerLabel — e.g. Muapi, Runware */
export function removeKeyConfirm(providerLabel) {
  return `Remove ${providerLabel} API key from this browser? This cannot be undone.`;
}

export const INPUT_CLASSNAME =
  'w-full og-modal-input rounded-md px-5 py-3 text-sm placeholder:text-foreground-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all';

export const PRIMARY_BUTTON_CLASSNAME =
  'w-full bg-primary text-black font-medium py-2.5 rounded-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20';

export const SECONDARY_BUTTON_CLASSNAME =
  'flex-1 h-10 rounded-md og-modal-btn-ghost text-xs font-semibold transition-all';

export const DANGER_BUTTON_CLASSNAME =
  'flex-1 h-10 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all';

export const BANNER_OPEN_SETTINGS = 'Open API Settings';

/** @param {string} studioLabel */
export function bannerMuapiRequiredMessage(studioLabel) {
  return `${studioLabel} needs a Muapi API key (required for Agents and Workflows, or as fallback). Add one in API Settings.`;
}

/** @param {string} studioLabel */
export function bannerUnsupportedMessage(studioLabel) {
  return `${studioLabel} is not available on the selected cloud provider. Change routing in API Settings or add the other provider's key.`;
}

/** @param {string} studioLabel */
export function bannerRunwareRequiredMessage(studioLabel) {
  return `${studioLabel} needs a Runware API key. Add one in API Settings.`;
}
