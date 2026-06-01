import { t } from '../lib/i18n.js';
import {
  buildThemePanel,
  buildGeneralPanel,
  buildAccessibilityPanel,
} from './settingsAppearanceDom.js';

export function PreferencesModal(onClose, initialTab = 'theme') {
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;';

  const modal = document.createElement('div');
  modal.className = 'og-modal';
  modal.style.cssText =
    'border-radius:1rem;width:min(90vw,28rem);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;';

  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-light);flex-shrink:0;';
  const title = document.createElement('h2');
  title.style.cssText = 'font-size:1rem;font-weight:800;color:var(--text-primary);margin:0;';
  title.textContent = t('preferences.title');
  const closeHeaderBtn = document.createElement('button');
  closeHeaderBtn.id = 'prefs-close-btn';
  closeHeaderBtn.style.cssText =
    'color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px;';
  closeHeaderBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  header.appendChild(title);
  header.appendChild(closeHeaderBtn);
  modal.appendChild(header);

  const TABS = [
    { id: 'theme', label: t('preferences.tab.theme') },
    { id: 'general', label: t('preferences.tab.general') },
    { id: 'accessibility', label: t('preferences.tab.accessibility') },
  ];

  let activeTab = TABS.some((tab) => tab.id === initialTab) ? initialTab : 'theme';

  const tabBar = document.createElement('div');
  tabBar.style.cssText =
    'display:flex;gap:0.25rem;padding:0.75rem 1rem 0;border-bottom:1px solid var(--border-light);flex-shrink:0;overflow-x:auto;';

  const tabBtns = {};
  const body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;padding:1.25rem 1.5rem;';

  const switchTab = (id) => {
    activeTab = id;
    body.innerHTML = '';
    TABS.forEach(({ id: tid }) => {
      const btn = tabBtns[tid];
      if (tid === id) {
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-primary)';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
      }
    });
    if (id === 'theme') body.appendChild(buildThemePanel(() => switchTab('theme')));
    if (id === 'general') body.appendChild(buildGeneralPanel());
    if (id === 'accessibility') body.appendChild(buildAccessibilityPanel());
  };

  TABS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'padding:0.4rem 0.65rem;border-radius:0.5rem 0.5rem 0 0;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;white-space:nowrap;background:transparent;color:var(--text-muted);';
    btn.onclick = () => switchTab(id);
    tabBtns[id] = btn;
    tabBar.appendChild(btn);
  });

  modal.appendChild(tabBar);
  modal.appendChild(body);
  switchTab(activeTab);

  const close = () => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
    if (onClose) onClose();
  };

  closeHeaderBtn.onclick = close;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.appendChild(modal);
  return overlay;
}
