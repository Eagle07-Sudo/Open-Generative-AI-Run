'use client';



import { useRef, useState, useMemo, useEffect, useId, useCallback } from 'react';

import { mentionTagForLabel } from '../../media/studioAssetTypes.js';

import { MENTION_STRINGS } from '../../lib/mentionStrings.js';

import { segmentizePromptText, mentionSegmentClassName } from '../../media/mentionHighlight.js';



/**

 * @param {{

 *   value: string,

 *   onChange: (v: string) => void,

 *   assets: import('../../media/studioAssetTypes.js').StudioAsset[],

 *   placeholder?: string,

 *   className?: string,

 *   rows?: number,

 *   onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void,

 *   emptyMessage?: string,

 *   noMatchMessage?: string,

 *   inputRef?: import('react').RefObject<HTMLTextAreaElement | null>,

 *   disabled?: boolean,

 * }}

 */

export default function MentionPromptField({

  value,

  onChange,

  assets,

  placeholder,

  className = '',

  rows = 1,

  onInput,

  emptyMessage = MENTION_STRINGS.uploadFirst,

  noMatchMessage = MENTION_STRINGS.noMatch,

  inputRef: inputRefProp,

  disabled = false,

}) {

  const internalRef = useRef(null);

  const textareaRef = inputRefProp || internalRef;

  const mirrorRef = useRef(null);

  const listRef = useRef(null);

  const [showPopup, setShowPopup] = useState(false);

  const [query, setQuery] = useState('');

  const [atIndex, setAtIndex] = useState(-1);

  const [activeIndex, setActiveIndex] = useState(0);

  const listId = useId();



  const assetLabels = useMemo(() => assets.map((a) => a.label), [assets]);



  const mirrorSegments = useMemo(

    () =>

      segmentizePromptText(value, {

        assetLabels,

        pendingAt: atIndex,

        pendingQuery: query,

        popupOpen: showPopup,

      }),

    [value, assetLabels, atIndex, query, showPopup],

  );



  const filtered = useMemo(() => {

    const q = query.toLowerCase();

    return assets.filter((a) => a.label.toLowerCase().includes(q));

  }, [assets, query]);



  const popupOpen = showPopup && (assets.length === 0 || filtered.length > 0 || query.length > 0);



  useEffect(() => {

    setActiveIndex(0);

  }, [filtered.length, query]);



  const closePopup = useCallback(() => {

    setShowPopup(false);

  }, []);



  const resizeTextarea = useCallback(() => {

    const el = textareaRef.current;

    if (!el) return;

    el.style.height = 'auto';

    const maxHeight = window.innerWidth < 768 ? 150 : 250;

    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;

  }, [textareaRef]);



  useEffect(() => {

    resizeTextarea();

  }, [value, resizeTextarea]);



  useEffect(() => {

    if (!popupOpen) return;

    const onPointerDown = (e) => {

      const root = textareaRef.current?.parentElement;

      if (root && !root.contains(e.target)) closePopup();

    };

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);

  }, [popupOpen, closePopup, textareaRef]);



  const syncMirrorScroll = useCallback(() => {

    const el = textareaRef.current;

    const mirror = mirrorRef.current;

    if (el && mirror) mirror.scrollTop = el.scrollTop;

  }, [textareaRef]);



  const handleChange = (e) => {

    const v = e.target.value;

    onChange(v);

    const pos = e.target.selectionStart;

    const before = v.slice(0, pos);

    const at = before.lastIndexOf('@');

    if (at >= 0 && !/\s/.test(before.slice(at + 1))) {

      setAtIndex(at);

      setQuery(before.slice(at + 1));

      setShowPopup(true);

    } else {

      setShowPopup(false);

    }

    resizeTextarea();

    syncMirrorScroll();

    onInput?.(e);

  };



  const insertMention = useCallback(

    (label) => {

      const el = textareaRef.current;

      if (!el || atIndex < 0) return;

      const tag = mentionTagForLabel(label);

      const before = value.slice(0, atIndex);

      const after = value.slice(el.selectionStart);

      const next = `${before}${tag} ${after}`;

      onChange(next);

      closePopup();

      setTimeout(() => {

        el.focus();

        const caret = atIndex + tag.length + 1;

        el.setSelectionRange(caret, caret);

      }, 0);

    },

    [atIndex, value, onChange, closePopup, textareaRef],

  );



  const handleKeyDown = (e) => {

    if (!showPopup) return;



    if (e.key === 'Escape') {

      e.preventDefault();

      closePopup();

      return;

    }



    if (filtered.length === 0) return;



    if (e.key === 'ArrowDown') {

      e.preventDefault();

      setActiveIndex((i) => (i + 1) % filtered.length);

      return;

    }

    if (e.key === 'ArrowUp') {

      e.preventDefault();

      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);

      return;

    }

    if (e.key === 'Enter' || e.key === 'Tab') {

      e.preventDefault();

      const pick = filtered[activeIndex];

      if (pick) insertMention(pick.label);

    }

  };



  const statusMessage =

    assets.length === 0 ? emptyMessage : filtered.length === 0 ? noMatchMessage : null;



  const activeOptionId =

    filtered.length > 0 && popupOpen ? `${listId}-opt-${filtered[activeIndex]?.label}` : undefined;



  const fieldClass = `${className} bg-transparent`.trim();



  return (

    <div className="relative flex-1 min-w-0">

      <div

        ref={mirrorRef}

        aria-hidden

        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words ${fieldClass}`}

      >

        {value ? (

          mirrorSegments.map((seg, idx) => (

            <span key={`${idx}-${seg.type}-${seg.text.slice(0, 8)}`} className={mentionSegmentClassName(seg.type)}>

              {seg.text}

            </span>

          ))

        ) : (

          <span className="text-transparent">{placeholder}</span>

        )}

      </div>

      <textarea

        ref={textareaRef}

        value={value}

        onChange={handleChange}

        onKeyDown={handleKeyDown}

        onScroll={syncMirrorScroll}

        placeholder={placeholder}

        rows={rows}

        disabled={disabled}

        className={`${fieldClass} relative z-[1] w-full resize-none text-transparent caret-foreground selection:bg-primary/25`}

        aria-expanded={popupOpen}

        aria-controls={popupOpen ? listId : undefined}

        aria-activedescendant={activeOptionId}

        aria-autocomplete="list"

        aria-haspopup="listbox"

      />

      {popupOpen && (

        <div

          ref={listRef}

          id={listId}

          role="listbox"

          aria-label={MENTION_STRINGS.listLabel}

          className="absolute bottom-full left-0 mb-1 z-50 min-w-[180px] rounded-md border border-white/10 bg-[#1a1a1a] shadow-xl py-1 max-h-40 overflow-y-auto"

        >

          {statusMessage ? (

            <p className="px-3 py-2 text-xs text-white/50" role="status">

              {statusMessage}

            </p>

          ) : (

            filtered.map((a, idx) => {

              const active = idx === activeIndex;

              return (

                <button

                  key={a.label}

                  type="button"

                  role="option"

                  aria-selected={active}

                  id={`${listId}-opt-${a.label}`}

                  className={`w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 ${

                    active ? 'bg-white/10' : ''

                  }`}

                  onMouseDown={(e) => {

                    e.preventDefault();

                    insertMention(a.label);

                  }}

                  onMouseEnter={() => setActiveIndex(idx)}

                >

                  {a.thumbUrl ? (

                    <img

                      src={a.thumbUrl}

                      alt=""

                      className="w-6 h-6 rounded object-cover shrink-0 border border-white/10"

                    />

                  ) : (

                    <span className="w-6 h-6 rounded bg-white/5 shrink-0" aria-hidden />

                  )}

                  <span className="text-primary font-mono">{mentionTagForLabel(a.label)}</span>

                  <span className="truncate opacity-60">{a.fileName || a.label}</span>

                </button>

              );

            })

          )}

        </div>

      )}

    </div>

  );

}

