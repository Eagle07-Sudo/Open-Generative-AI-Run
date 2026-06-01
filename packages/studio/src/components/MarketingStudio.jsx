"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  stageFileForStudio,
  generateMarketingStudioAdForStudio,
} from "../studioGenerate.js";
import { getStudioAsset } from "../media/studioAssetRegistry.js";
import { isAssetLabel, resolvePreviewSrc } from "../media/previewSrc.js";
import MediaPreviewThumb from "./media/MediaPreviewThumb.jsx";
import MentionPromptField from "./media/MentionPromptField.jsx";
import {
  cardMentionAssets,
  extractCardLabels,
  stripMentionsFromPrompt,
} from "../media/cardMentionAssets.js";
import { useStudioGenerationCost } from "../cost/useStudioGenerationCost.js";
import GenerateCostButton from "./GenerateCostButton.jsx";
import GenerationHistoryCard from "./GenerationHistoryCard.jsx";
import GenerationDetailViewer from "./GenerationDetailViewer.jsx";
import {
  assetsToManifest,
  manifestFromAssetLabels,
  restoreAssetsForRecreate,
} from "../media/studioAssetPersist.js";
import { useOptimisticGenerationHistory } from "../hooks/useOptimisticGenerationHistory.js";
import { buildGenerationSnapshot, subscribeStudioRecreate } from "../studioRecreate.js";
import { CONTROL_STRINGS } from "../lib/controlStrings.js";
import { buildRoutingContext } from "../studioProps.js";
import { getStudioOpAvailability } from "../studioOpAvailability.js";

const SCROLLBAR_STYLE = `
  .custom-scrollbar-thin::-webkit-scrollbar {
    height: 4px;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 211, 238, 0.3);
  }
`;

// Ã¢â€â‚¬Ã¢â€â‚¬ Icons Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const CheckSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseSvg = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ProductIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 8l-2-2H5L3 8v10a2 2 0 002 2h14a2 2 0 002-2V8z" />
    <path d="M3 10h18" />
    <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);

const AvatarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RefIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// Ã¢â€â‚¬Ã¢â€â‚¬ Assets Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const ASSETS = {
  avatar: [
    { id: "aa252283-8591-4d14-91a8-41ce54187992", name: "Priya", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Priya.webp" },
    { id: "ba6c9b18-f79c-4dab-9649-88a181d0a038", name: "Elena", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Elena.webp" },
    { id: "30e2cadd-987c-4a7a-81c3-094d4fb3a65e", name: "Kai", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Kai.webp" },
    { id: "fbed59e1-4b8d-4625-9140-ef2044e0be72", name: "Sora", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Sora.webp" },
    { id: "bcd9e6ee-c000-48e6-9f4b-a20fc2a674f7", name: "Minji", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Minji.webp" },
    { id: "1da384ed-3856-45e4-bf4c-a496c7aa95ff", name: "Margot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Margot.webp" },
    { id: "b799c8f5-fb6e-4905-b33b-cdefac153ec3", name: "Niko", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Niko.webp" },
    { id: "b6971dd4-55fa-4e64-b318-392b16504284", name: "Jin", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Jin.webp" }
  ],
  ugc: [
    { id: 1, name: "UGC", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc.mp4" },
    { id: 2, name: "Tutorial", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_how_to.mp4" },
    { id: 3, name: "Unboxing", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_unboxing.mp4" },
    { id: 4, name: "Hyper Motion", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/hyper-motion-mini.mp4" },
    { id: 5, name: "Product Review", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/product_review.mp4" },
    { id: 6, name: "TV Spot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/tv-spot-mini.mp4" }
  ]
};

const OPTIONS = {
  ratio: ["9:16", "3:4", "4:3", "16:9", "1:1"],
  res: ["720p", "1080p"],
  duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
};

/** @param {string | null} ref label (image1) or https URL */
function previewUrlForRef(ref) {
  return resolvePreviewSrc("marketing", null, ref, getStudioAsset);
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function UploadSlot({ icon, url, progress, label, onUpload, onClear, multiple = false, images = [] }) {
  const inputRef = useRef(null);
  
  return (
    <div className="relative group/slot flex items-center">
      <div 
        onClick={() => inputRef.current?.click()}
        title={`Upload ${label}`}
        className={`relative w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
          url ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
        }`}
      >
        <input 
          ref={inputRef} 
          type="file" 
          accept="image/*"
          className="hidden" 
          multiple={multiple}
          onChange={(e) => onUpload(e)} 
        />
        
        {progress > 0 && progress < 100 ? (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-10">
            <span className="text-[8px] font-black text-primary">{progress}%</span>
          </div>
        ) : url ? (
          <div className="w-full h-full rounded-full overflow-hidden border border-black/20">
            <MediaPreviewThumb
              studioId="marketing"
              url={typeof url === "string" && isAssetLabel(url) ? url : url}
              asset={
                typeof url === "string" && isAssetLabel(url)
                  ? getStudioAsset("marketing", url)
                  : undefined
              }
              kind="image"
              className="w-full h-full"
              alt={label}
            />
          </div>
        ) : (
          <div className="text-white/40 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}

        {/* Clear Button (Single) */}
        {url && !multiple && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
          >
            <CloseSvg />
          </button>
        )}
      </div>      
    </div>
  );
}

function Dropdown({ isOpen, title, items, selectedId, onSelect, onClose, isVideo = false }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={ref}
      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded p-4 shadow-4xl border border-white/10 w-[420px] animate-fade-in-up"
    >
      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 px-1">{title}</div>
      <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {items.map(item => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className={`relative rounded overflow-hidden border-2 transition-all group cursor-pointer ${
              selectedId === item.id || selectedId === item.url ? 'border-primary shadow-glow' : 'border-white/5 hover:border-white/20'
            }`}
          >
            {isVideo ? (
              <video src={item.url} autoPlay loop muted className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-all duration-500" />
            ) : (
              <img src={item.url} className="w-full aspect-square object-cover group-hover:scale-105 transition-all duration-500" alt={item.name} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-black text-white uppercase tracking-tight">{item.name}</span>
            </div>
            {(selectedId === item.id || selectedId === item.url) && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <CheckSvg />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleDropdown({ isOpen, title, options, selected, onSelect, onClose }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={ref}
      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded p-1 max-h-[200px] overflow-y-auto custom-scrollbar shadow-3xl border border-white/10 min-w-[140px] animate-fade-in-up"
    >
      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-3 pt-2">{title}</div>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => { onSelect(opt); onClose(); }}
          className={`w-full text-left px-4 py-2 rounded text-xs font-bold transition-all flex items-center justify-between ${
            selected === opt ? 'bg-primary text-black' : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span>{opt}</span>
          {selected === opt && <CheckSvg />}
        </button>
      ))}
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Main Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function MarketingStudio({
  apiKey,
  muapiKey,
  runwareApiKey,
  routingPrefs,
  droppedFiles,
  onFilesHandled,
}) {
  const routing = buildRoutingContext({ apiKey, muapiKey, runwareApiKey, routingPrefs });
  const uploadAvail = useMemo(
    () => getStudioOpAvailability("marketing", "upload", routing),
    [
      routing.routingMode,
      routing.muapiKey,
      routing.runwareApiKey,
      routing.allowMuapiFallback,
    ],
  );
  const PERSIST_KEY = "hg_marketing_studio_persistent";
  
  const [prompt, setPrompt] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  
  const [params, setParams] = useState({
    ratio: "9:16",
    format: ASSETS.ugc[0].name,
    videoUrl: ASSETS.ugc[0].url,
    res: "1080p",
    duration: 5
  });

  const {
    history,
    setHistory,
    prependPending,
    resolvePending,
    failPending,
  } = useOptimisticGenerationHistory([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recreateRefWarning, setRecreateRefWarning] = useState(null);
  const [dropdown, setDropdown] = useState(null); // 'format' | 'avatar' | 'ratio' | 'res' | 'duration'
  const [uploadProgress, setUploadProgress] = useState({ product: 0, avatar: 0, additional: 0 });
  const [detailEntry, setDetailEntry] = useState(/** @type {object | null} */ (null));

  const cardRefs = useMemo(
    () => [productImage, avatarImage, ...additionalImages].filter(Boolean),
    [productImage, avatarImage, additionalImages],
  );

  const mentionAssets = useMemo(
    () => cardMentionAssets("marketing", cardRefs),
    [cardRefs, productImage, avatarImage, additionalImages],
  );

  const cardLabels = useMemo(() => extractCardLabels(cardRefs), [cardRefs]);

  const marketingCostPayload = useMemo(
    () => ({
      prompt,
      aspect_ratio: params.ratio,
      duration: params.duration,
      resolution: params.res,
      images_list: cardLabels,
    }),
    [prompt, params.ratio, params.duration, params.res, cardLabels],
  );

  const { unitCostUsd, source: costSource, isLoadingCost } = useStudioGenerationCost({
    studioId: 'marketing',
    op: 'marketingAd',
    routing,
    modelId: 'marketing-ad',
    providerId: 'muapi',
    payload: marketingCostPayload,
    enabled: Boolean(productImage) && !isGenerating,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.prompt) setPrompt(data.prompt);
        if (data.params) setParams(data.params);
        if (data.productImage) setProductImage(data.productImage);
        if (data.avatarImage) setAvatarImage(data.avatarImage);
        if (data.additionalImages) setAdditionalImages(data.additionalImages);
        // Ref restore on Recreate only — not on load (avoids IDB freeze on startup).
        if (data.history) {
          setHistory(
            data.history.map((e) => ({
              status: e.status || (e.url ? "ready" : "pending"),
              ...e,
            })),
          );
        }
      }
    } catch (err) { console.warn("Load failed", err); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const state = {
        prompt,
        params,
        productImage,
        avatarImage,
        additionalImages,
        history: history.filter((e) => e.status === "ready" && e.url),
      };
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
    }, 500);
    return () => clearTimeout(timer);
  }, [prompt, params, productImage, avatarImage, additionalImages, history]);

  useEffect(() => {
    const imageLabels = [productImage, avatarImage, ...additionalImages].filter(Boolean);
    if (!imageLabels.length) return undefined;
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(PERSIST_KEY);
        const prev = stored ? JSON.parse(stored) : {};
        const assetManifest = assetsToManifest(
          imageLabels.map((l) => getStudioAsset("marketing", l)).filter(Boolean),
        );
        localStorage.setItem(
          PERSIST_KEY,
          JSON.stringify({ ...prev, assetManifest }),
        );
      } catch {
        /* ignore */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [productImage, avatarImage, additionalImages]);

  useEffect(() => {
    return subscribeStudioRecreate((snap) => {
      if (snap.studioId !== "marketing") return;
      setRecreateRefWarning(null);
      setPrompt(snap.prompt || "");
      if (snap.format) {
        const ugc = ASSETS.ugc.find((u) => u.name === snap.format);
        if (ugc) {
          setParams((p) => ({
            ...p,
            format: ugc.name,
            videoUrl: ugc.url,
            ratio: snap.controls?.aspect_ratio || p.ratio,
            res: snap.controls?.resolution || p.res,
            duration: snap.controls?.duration ?? p.duration,
          }));
        }
      }
      if (snap.controls?.aspect_ratio) {
        setParams((p) => ({ ...p, ratio: String(snap.controls.aspect_ratio) }));
      }
      if (snap.controls?.resolution) {
        setParams((p) => ({ ...p, res: String(snap.controls.resolution) }));
      }
      if (snap.controls?.duration != null) {
        setParams((p) => ({ ...p, duration: Number(snap.controls.duration) }));
      }
      void restoreAssetsForRecreate("marketing", snap).then(({ restored, missing }) => {
        const product = restored.find((l) => l === "image1");
        const avatar = restored.find((l) => l === "image2");
        const extra = restored.filter(
          (l) => l.startsWith("image") && l !== "image1" && l !== "image2",
        );
        if (product) setProductImage(product);
        if (avatar) setAvatarImage(avatar);
        setAdditionalImages(extra.slice(0, 6));
        if (missing.length > 0) {
          setRecreateRefWarning(CONTROL_STRINGS.refsMissingRecreate);
        }
      });
    });
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleUpload = async (e, target) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }

    if (target === 'additional') {
      const remaining = 6 - additionalImages.length;
      const toUpload = files.slice(0, remaining);
      for (const file of toUpload) {
        try {
          setUploadProgress((p) => ({ ...p, additional: 50 }));
          const asset = await stageFileForStudio("marketing", file);
          setUploadProgress((p) => ({ ...p, additional: 100 }));
          setAdditionalImages((prev) => [...prev, asset.label].slice(0, 6));
        } catch (err) {
          alert(err.message);
        }
      }
    } else {
      const file = files[0];
      const slotLabel = target === "product" ? "image1" : "image2";
      try {
        setUploadProgress((p) => ({ ...p, [target]: 50 }));
        const asset = await stageFileForStudio("marketing", file, { label: slotLabel });
        setUploadProgress((p) => ({ ...p, [target]: 100 }));
        if (target === "product") setProductImage(asset.label);
        else setAvatarImage(asset.label);
      } catch (err) {
        alert(err.message);
      }
    }
    setUploadProgress(p => ({ ...p, [target]: 0 }));
  };

  const handleGenerate = async () => {
    const apiPrompt = stripMentionsFromPrompt(prompt.trim());
    if (!apiPrompt) return alert("Please enter an ad script.");
    if (!productImage) return alert("Please upload a product image.");

    setIsGenerating(true);
    const imageLabels = [productImage, avatarImage, ...additionalImages].filter(Boolean);
    const snapshot = buildGenerationSnapshot({
      studioId: "marketing",
      catalogMode: "t2v",
      modelId: "marketing-ad",
      providerId: "muapi",
      prompt: prompt.trim(),
      controls: {
        aspect_ratio: params.ratio,
        duration: params.duration,
        resolution: params.res,
      },
      assetLabels: cardLabels,
      assetManifest: manifestFromAssetLabels("marketing", imageLabels),
      format: params.format,
    });
    const pendingId = prependPending({
      prompt,
      format: params.format,
      snapshot,
      mediaType: "marketing",
    });
    try {
      const result = await generateMarketingStudioAdForStudio(routing, {
        prompt: apiPrompt,
        aspect_ratio: params.ratio,
        duration: params.duration,
        resolution: params.res,
        images_list: imageLabels,
        video_files: params.videoUrl ? [params.videoUrl] : [],
      }, { imageLabels, cardLabels });

      if (result?.url) {
        const finalizedManifest = manifestFromAssetLabels("marketing", imageLabels);
        resolvePending(pendingId, {
          id: String(Date.now()),
          url: result.url,
          prompt,
          format: params.format,
          providerId: "muapi",
          timestamp: new Date().toISOString(),
          snapshot: {
            ...snapshot,
            assetManifest: finalizedManifest,
            assetLabels: cardLabels,
          },
        });
      } else {
        failPending(pendingId, "No video URL returned");
      }
    } catch (err) {
      failPending(pendingId, err.message);
      alert("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextareaInput = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 250) + "px";
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden">
      <style>{SCROLLBAR_STYLE}</style>
      
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ MAIN CONTENT AREA Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-40">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {history.map((entry, idx) => (
              <GenerationHistoryCard
                key={entry.id || idx}
                entry={{
                  status: entry.status || (entry.url ? "ready" : "pending"),
                  ...entry,
                }}
                mediaType="marketing"
                onOpen={(e) => setDetailEntry(e)}
                onDownload={(e) =>
                  e.url && downloadFile(e.url, `marketing-ad-${e.id || idx}.mp4`)
                }
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in-up transition-all duration-700">
             <div className="mb-12 relative group">
                <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                  <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110 shadow-inner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
                <span className="text-white/40 font-medium uppercase tracking-widest">START CREATING WITH</span>
                <br />
                <span className="text-white uppercase tracking-tight">MARKETING STUDIO</span>
              </h1>
              <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed px-6">
                Describe your scene, upload your product, and watch high-converting AI video ads come to life.
              </p>
          </div>
        )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ BOTTOM PROMPT BAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div style={{ animationDelay: "0.2s" }} className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-lg border border-white/10 p-4 flex flex-col gap-2 shadow-4xl">
          {additionalImages.length > 0 && (
            <div className="flex items-center gap-1.5">
              {additionalImages.map((img, idx) => (
                <div key={idx} className="relative group/img flex-shrink-0">
                  <img src={img} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  <button 
                    onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity border border-white/10"
                  >
                    <CloseSvg />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Top Row: Full-width Textarea */}
          <div className="w-full relative">
            <MentionPromptField
              value={prompt}
              onChange={setPrompt}
              assets={mentionAssets}
              placeholder="Describe your ad script... Use @image1 for product, @image2 for avatar."
              rows={1}
              className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[44px] max-h-[300px] custom-scrollbar font-medium"
              onInput={handleTextareaInput}
            />
            {recreateRefWarning ? (
              <p className="text-[10px] text-amber-400/90 px-1 mt-1" role="status">
                {recreateRefWarning}
              </p>
            ) : null}
          </div>

          {/* Bottom Row: Uploads + Controls + Generate */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Asset Uploads Group */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
                <UploadSlot 
                  label="Product" 
                  icon={<ProductIcon />} 
                  url={previewUrlForRef(productImage)} 
                  progress={uploadProgress.product} 
                  onUpload={(e) => handleUpload(e, 'product')} 
                  onClear={() => setProductImage(null)} 
                />
                <UploadSlot 
                  label="Avatar" 
                  icon={<AvatarIcon />} 
                  url={previewUrlForRef(avatarImage)} 
                  progress={uploadProgress.avatar} 
                  onUpload={(e) => handleUpload(e, 'avatar')} 
                  onClear={() => setAvatarImage(null)} 
                />
                <UploadSlot 
                  label="References" 
                  icon={<RefIcon />} 
                  url={previewUrlForRef(additionalImages[0])} 
                  progress={uploadProgress.additional} 
                  multiple 
                  images={additionalImages.map(previewUrlForRef).filter(Boolean)}
                  onUpload={(e) => handleUpload(e, 'additional')} 
                  onClear={(idx) => {
                    if (idx !== undefined) {
                      setAdditionalImages(prev => prev.filter((_, i) => i !== idx));
                    } else {
                      setAdditionalImages([]);
                    }
                  }} 
                />
              </div>

              {/* Format Button */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setDropdown(dropdown === 'format' ? null : 'format'); }}
                  className={`flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] rounded border transition-all group whitespace-nowrap ${dropdown === 'format' ? 'border-primary/50' : 'border-white/5'}`}
                >
                  <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center border border-primary/20">
                    <span className="text-[8px] font-black text-primary uppercase">U</span>
                  </div>
                  <span className="text-sm font-bold text-white/70 group-hover:text-primary transition-colors">{params.format}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <Dropdown 
                  isOpen={dropdown === 'format'} 
                  title="Video Format Presets"
                  items={ASSETS.ugc} 
                  selectedId={params.format}
                  onSelect={(item) => setParams({ ...params, format: item.name, videoUrl: item.url })}
                  onClose={() => setDropdown(null)}
                  isVideo
                />
              </div>

              {/* Avatar Preset Button */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setDropdown(dropdown === 'avatar' ? null : 'avatar'); }}
                  className={`flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] rounded border transition-all group whitespace-nowrap ${dropdown === 'avatar' ? 'border-primary/50' : 'border-white/5'}`}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shadow-inner">
                    <img src={avatarImage || ASSETS.avatar[0].url} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-bold text-white/70 group-hover:text-primary transition-colors">
                    {ASSETS.avatar.find(a => a.url === avatarImage)?.name || "Select Avatar"}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <Dropdown 
                  isOpen={dropdown === 'avatar'} 
                  title="Avatar Presets"
                  items={ASSETS.avatar} 
                  selectedId={avatarImage}
                  onSelect={(item) => setAvatarImage(item.url)}
                  onClose={() => setDropdown(null)}
                />
              </div>

              {/* Simple Controls */}
              {['ratio', 'res', 'duration'].map(key => (
                <div key={key} className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDropdown(dropdown === key ? null : key); }}
                    className={`px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] rounded border transition-all text-sm font-bold ${dropdown === key ? 'border-primary/50 text-primary' : 'border-white/5 text-white/70'}`}
                  >
                    {key === 'duration' ? `${params[key]}s` : params[key]}
                  </button>
                  <SimpleDropdown 
                    isOpen={dropdown === key} 
                    title={key === 'res' ? 'Resolution' : key.toUpperCase()} 
                    options={OPTIONS[key]} 
                    selected={params[key]} 
                    onSelect={(val) => setParams({ ...params, [key]: val })} 
                    onClose={() => setDropdown(null)} 
                  />
                </div>
              ))}
            </div>

            <GenerateCostButton
              onClick={handleGenerate}
              disabled={isGenerating}
              generating={isGenerating}
              unitCostUsd={unitCostUsd}
              source={costSource}
              isLoadingCost={isLoadingCost}
              primaryLabel="Launch"
              className="bg-primary text-black px-8 py-2.5 rounded font-bold text-base hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 shadow-glow disabled:opacity-50 disabled:grayscale z-10 min-w-[120px]"
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {detailEntry ? (
        <GenerationDetailViewer
          entry={detailEntry}
          mediaType="marketing"
          onClose={() => setDetailEntry(null)}
          onDownload={(e) =>
            e.url && downloadFile(e.url, `marketing-ad-${e.id || "out"}.mp4`)
          }
        />
      ) : null}
    </div>
  );
}
