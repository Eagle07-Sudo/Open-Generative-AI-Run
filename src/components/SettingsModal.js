import { LocalModelManager } from './LocalModelManager.js';
import { isLocalAIAvailable } from '../lib/localInferenceClient.js';
import { t } from '../lib/i18n.js';

export function SettingsModal(onClose) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;';

    const modal = document.createElement('div');
    modal.className = 'og-modal';
    modal.style.cssText = 'border-radius:1rem;width:min(90vw,28rem);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-light);flex-shrink:0;';
    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1rem;font-weight:800;color:var(--text-primary);margin:0;';
    title.textContent = t('settings.title');
    const closeHeaderBtn = document.createElement('button');
    closeHeaderBtn.id = 'settings-close-btn';
    closeHeaderBtn.style.cssText = 'color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px;';
    closeHeaderBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    header.appendChild(title);
    header.appendChild(closeHeaderBtn);
    modal.appendChild(header);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:1.25rem 1.5rem;';
    modal.appendChild(body);

    const apiPanel = document.createElement('div');
    apiPanel.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

    const muapiLabel = document.createElement('label');
    muapiLabel.style.cssText = 'display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;font-weight:600;';
    muapiLabel.textContent = t('settings.muapiKeyLabel');
    const muapiInput = document.createElement('input');
    muapiInput.id = 'settings-api-key';
    muapiInput.type = 'password';
    muapiInput.className = 'og-modal-input';
    muapiInput.style.cssText = 'width:100%;box-sizing:border-box;border-radius:0.75rem;padding:0.6rem 0.9rem;font-size:0.875rem;outline:none;';
    muapiInput.placeholder = t('settings.keyPlaceholder');
    apiPanel.appendChild(muapiLabel);
    apiPanel.appendChild(muapiInput);

    const note = document.createElement('p');
    note.style.cssText = 'font-size:0.7rem;color:var(--text-muted);margin:0;';
    note.textContent = t('settings.keyNote');
    apiPanel.appendChild(note);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;';
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'settings-cancel-btn';
    cancelBtn.className = 'og-modal-btn-ghost';
    cancelBtn.style.cssText = 'padding:0.5rem 1rem;border-radius:0.5rem;font-size:0.75rem;font-weight:700;cursor:pointer;';
    cancelBtn.textContent = t('common.cancel');
    const saveBtn = document.createElement('button');
    saveBtn.id = 'settings-save-btn';
    saveBtn.style.cssText =
        'padding:0.5rem 1rem;border-radius:0.5rem;background:var(--color-primary);color:#000;font-size:0.75rem;font-weight:700;cursor:pointer;border:none;';
    saveBtn.textContent = t('common.save');
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    apiPanel.appendChild(btnRow);

    body.appendChild(apiPanel);

    const localPanel = isLocalAIAvailable() ? LocalModelManager() : null;
    if (localPanel) {
        const localSection = document.createElement('div');
        localSection.style.cssText = 'margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-light);';
        localSection.appendChild(localPanel);
        body.appendChild(localSection);
    }

    const close = () => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        if (onClose) onClose();
    };

    cancelBtn.onclick = close;
    saveBtn.onclick = () => {
        const key = muapiInput.value.trim();
        if (key) {
            localStorage.setItem('muapi_key', key);
            close();
        } else {
            alert(t('settings.invalidKey'));
        }
    };

    closeHeaderBtn.onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.appendChild(modal);
    return overlay;
}
