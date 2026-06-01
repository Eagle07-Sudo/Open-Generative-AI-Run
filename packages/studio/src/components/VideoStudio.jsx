"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  generateVideoForStudio,
  generateI2VForStudio,
  processV2VForStudio,
  uploadFileForStudio,
  stageFileForStudio,
} from "../studioGenerate.js";
import MediaPreviewThumb from "./media/MediaPreviewThumb.jsx";
import MentionPromptField from "./media/MentionPromptField.jsx";
import {
  cardMentionAssets,
  extractCardLabels,
  filterMentionsToCardScope,
} from "../media/cardMentionAssets.js";
import { getStudioAsset } from "../media/studioAssetRegistry.js";
import { isAssetLabel } from "../media/previewSrc.js";
import { buildRoutingContext } from "../studioProps.js";
import { getStudioOpAvailability } from "../studioOpAvailability.js";
import { resolveProviderForOp, providerDisplayLabel } from "../studioCloud.js";
import {
  getUnifiedModelSections,
  flattenModelSections,
  getModelByIdForStudio,
  getAspectRatiosForT2vModel,
  getAspectRatiosForI2vModel,
  getDurationsForT2vModel,
  getDurationsForI2vModel,
  getResolutionsForT2vModel,
  getResolutionsForI2vModel,
  getModelInputDefault,
  getModelInputOptions,
  clampModelInputSelection,
  getReferenceInputLimits,
  getEffectsForModelRegistry,
  getDefaultEffectForModelRegistry,
  getModesForModelRegistry,
  getModelInputSchema,
  isRangeModelInput,
} from "../modelRegistry.js";
import { loadModelPick, saveModelPick } from "../modelPickerPersist.js";
import UnifiedModelDropdown from "./UnifiedModelDropdown.jsx";
import { useStudioGenerationCost } from "../cost/useStudioGenerationCost.js";
import GenerateCostButton from "./GenerateCostButton.jsx";
import StudioToggle from "./StudioToggle.jsx";
import GenerationHistoryCard from "./GenerationHistoryCard.jsx";
import GenerationDetailViewer from "./GenerationDetailViewer.jsx";
import {
  manifestFromAssetLabels,
  restoreAssetsForRecreate,
} from "../media/studioAssetPersist.js";
import { useOptimisticGenerationHistory } from "../hooks/useOptimisticGenerationHistory.js";
import { buildGenerationSnapshot, subscribeStudioRecreate } from "../studioRecreate.js";
import { CONTROL_STRINGS } from "../lib/controlStrings.js";
import SeedControl from "./SeedControl.jsx";
import {
  modelSupportsSeed,
  seedForSnapshot,
  resolveSeedForGenerate,
  applySeedToParams,
  usedSeedFromResponse,
  advanceSeed,
} from "../lib/seedControl.js";
import { formatCostUsd } from "../cost/formatGenerateLabel.js";
import {
  t2vModels,
  i2vModels,
  v2vModels,
} from "../models.js";
import { runwareVideoModels } from "../models.runware.video.js";
import {
  isRunwareModelSearchEnabled,
  searchRunwareModels,
} from "../providers/runwareCatalog.js";

function firstUnifiedT2vModel(sections) {
  const flat = flattenModelSections(sections);
  return flat[0] || runwareVideoModels[0] || t2vModels[0];
}

// Ã¢â€â‚¬Ã¢â€â‚¬ tiny helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function getQualitiesForModel(modelId, providerId, catalogMode) {
  return getModelInputOptions(modelId, 'quality', providerId, catalogMode);
}

function modelProviderId(model, fallback = 'muapi') {
  if (model?.providerId) return model.providerId;
  if (model?.id?.startsWith('rw-')) return 'runware';
  return fallback;
}

async function downloadFile(url, filename) {
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
}

// Ã¢â€â‚¬Ã¢â€â‚¬ SVG icons (kept inline to avoid extra deps) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const CheckSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const VideoIconSvg = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const VideoReadySvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-primary"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <polyline points="7 10 10 13 15 8" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

// Ã¢â€â‚¬Ã¢â€â‚¬ Dropdown components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function DropdownItem({ label, selected, onClick }) {
  return (
    <div
      className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
      onClick={onClick}
    >
      <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100 capitalize">
        {label}
      </span>
      {selected && <CheckSvg />}
    </div>
  );
}

function ModelDropdown({ imageMode, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const generationModels = imageMode ? i2vModels : t2vModels;

  const lf = search.toLowerCase();
  const filteredMain = generationModels.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );
  const filteredV2V = v2vModels.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );

  const getIconColor = (m, isV2V) => {
    if (isV2V) return "bg-orange-500/10 text-orange-400";
    if (m.id.includes("kling")) return "bg-blue-500/10 text-blue-400";
    if (m.id.includes("veo")) return "bg-purple-500/10 text-purple-400";
    if (m.id.includes("sora")) return "bg-rose-500/10 text-rose-400";
    return "bg-primary/10 text-primary";
  };

  const renderItem = (m, isV2V = false) => (
    <div
      key={m.id}
      className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? "bg-white/5 border-white/5" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(m, isV2V);
        onClose();
      }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-10 ${getIconColor(m, isV2V)} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase`}
        >
          {m.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-white tracking-tight">
            {m.name}
          </span>
          {isV2V && (
            <span className="text-[9px] text-orange-400/70">
              {m.imageField ? "Upload a video and image" : "Upload a video to use"}
            </span>
          )}
        </div>
      </div>
      {selectedModel === m.id && <CheckSvg />}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
          />
        </div>
      </div>
      <div className="text-xs font-bold text-secondary px-3 py-2 shrink-0">
        Video models
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filteredMain.map((m) => renderItem(m, false))}
        {filteredV2V.length > 0 && (
          <>
            <div className="text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5">
              Video Tools
            </div>
            {filteredV2V.map((m) => renderItem(m, true))}
          </>
        )}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Control button Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ControlBtn({ icon, label, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap"
    >
      {icon}
      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
        {label}
      </span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-20 group-hover:opacity-100 transition-opacity"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Dropdown panel Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Rendered inside a `relative` wrapper div; floats above the anchor button.

// Ã¢â€â‚¬Ã¢â€â‚¬ Main component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function VideoStudio({
  apiKey,
  muapiKey,
  runwareApiKey,
  routingPrefs,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
  onOpenApiSettings,
}) {
  const baseRouting = buildRoutingContext({ apiKey, muapiKey, runwareApiKey, routingPrefs });
  const uploadAvail = useMemo(
    () => getStudioOpAvailability("video", "upload", baseRouting),
    [
      baseRouting.routingMode,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      baseRouting.allowMuapiFallback,
      routingPrefs?.perStudioRouting,
    ],
  );
  const defaultResolved = useMemo(
    () => resolveProviderForOp("video", "videoT2i", baseRouting),
    [
      baseRouting.routingMode,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      baseRouting.allowMuapiFallback,
      routingPrefs?.perStudioRouting,
    ],
  );
  const PERSIST_KEY = "hg_video_studio_persistent";

  const [imageMode, setImageMode] = useState(false); // i2v
  const [v2vMode, setV2vMode] = useState(false);
  const [selectedModelProvider, setSelectedModelProvider] = useState(defaultResolved.providerId);

  const modelSections = useMemo(
    () =>
      getUnifiedModelSections("video", {
        routingMode: baseRouting.routingMode,
        allowMuapiFallback: baseRouting.allowMuapiFallback,
        muapiKey: baseRouting.muapiKey,
        runwareApiKey: baseRouting.runwareApiKey,
        catalogMode: v2vMode ? "v2v" : imageMode ? "i2v" : "t2v",
      }),
    [
      baseRouting.routingMode,
      baseRouting.allowMuapiFallback,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      imageMode,
      v2vMode,
    ],
  );

  const generationRouting = useMemo(
    () =>
      buildRoutingContext({
        apiKey,
        muapiKey,
        runwareApiKey,
        routingPrefs,
        providerOverride: imageMode || v2vMode ? undefined : selectedModelProvider,
      }),
    [apiKey, muapiKey, runwareApiKey, routingPrefs, selectedModelProvider, imageMode, v2vMode],
  );

  const defaultModel = runwareVideoModels[0] || t2vModels[0];
  const [selectedModel, setSelectedModel] = useState(defaultModel.id);
  const [selectedModelName, setSelectedModelName] = useState(defaultModel.name);
  const [selectedAr, setSelectedAr] = useState(
    defaultModel.inputs?.aspect_ratio?.default || "16:9",
  );
  const [selectedDuration, setSelectedDuration] = useState(
    defaultModel.inputs?.duration?.default || 5,
  );
  const [selectedResolution, setSelectedResolution] = useState(
    defaultModel.inputs?.resolution?.default || "",
  );
  const [selectedQuality, setSelectedQuality] = useState(
    defaultModel.inputs?.quality?.default || "",
  );
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("");

  // Ã¢â€â‚¬Ã¢â€â‚¬ upload progress Ã¢â€â‚¬Ã¢â€â‚¬
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // Ã¢â€â‚¬Ã¢â€â‚¬ control visibility Ã¢â€â‚¬Ã¢â€â‚¬
  const [showAr, setShowAr] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showResolution, setShowResolution] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showMode, setShowMode] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  // Ã¢â€â‚¬Ã¢â€â‚¬ uploads Ã¢â€â‚¬Ã¢â€â‚¬
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedEndImageUrl, setUploadedEndImageUrl] = useState(null);
  const [endImageUploading, setEndImageUploading] = useState(false);
  const [endImageProgress, setEndImageProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState(null);

  const [referenceImages, setReferenceImages] = useState([]);
  const [referenceVideos, setReferenceVideos] = useState([]);
  const [referenceAudios, setReferenceAudios] = useState([]);
  const [refMultimodalUploading, setRefMultimodalUploading] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [seedValue, setSeedValue] = useState(/** @type {number | null} */ (null));
  const multimodalRefInputRef = useRef(null);

  // generation / canvas
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [detailEntry, setDetailEntry] = useState(/** @type {object | null} */ (null));
  const [canvasUrl, setCanvasUrl] = useState(null);
  const [canvasModel, setCanvasModel] = useState(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [lastGenerationId, setLastGenerationId] = useState(null);
  const [lastGenerationModel, setLastGenerationModel] = useState(null);

  // Ã¢â€â‚¬Ã¢â€â‚¬ history Ã¢â€â‚¬Ã¢â€â‚¬
  const {
    history: localHistory,
    setHistory: setLocalHistory,
    prependPending,
    resolvePending,
    failPending,
  } = useOptimisticGenerationHistory([]);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

  // Ã¢â€â‚¬Ã¢â€â‚¬ dropdown Ã¢â€â‚¬Ã¢â€â‚¬
  const [openDropdown, setOpenDropdown] = useState(null); // 'model'|'ar'|'duration'|'resolution'|'quality'|'mode'|null
  const [browseModels, setBrowseModels] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const showRunwareBrowse =
    typeof window !== "undefined" &&
    isRunwareModelSearchEnabled() &&
    Boolean(runwareApiKey?.trim());

  // Ã¢â€â‚¬Ã¢â€â‚¬ prompt Ã¢â€â‚¬Ã¢â€â‚¬
  const [prompt, setPrompt] = useState("");
  const [promptDisabled, setPromptDisabled] = useState(false);

  // Ã¢â€â‚¬Ã¢â€â‚¬ refs Ã¢â€â‚¬Ã¢â€â‚¬
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const endImageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const resultVideoRef = useRef(null);
  const hasRestored = useRef(false);

  // Ã¢â€â‚¬Ã¢â€â‚¬ derived data Ã¢â€â‚¬Ã¢â€â‚¬
  const history = historyItems ?? localHistory;

  const getCurrentModels = useCallback(() => {
    if (v2vMode || imageMode) return flattenModelSections(modelSections);
    return flattenModelSections(modelSections);
  }, [imageMode, v2vMode, modelSections]);

  const getCurrentAspectRatios = useCallback(
    (id) =>
      imageMode
        ? getAspectRatiosForI2vModel(id, selectedModelProvider)
        : getAspectRatiosForT2vModel(id, selectedModelProvider),
    [imageMode, selectedModelProvider],
  );

  const getCurrentDurations = useCallback(
    (id) =>
      imageMode
        ? getDurationsForI2vModel(id, selectedModelProvider)
        : getDurationsForT2vModel(id, selectedModelProvider),
    [imageMode, selectedModelProvider],
  );

  const getCurrentResolutions = useCallback(
    (id) =>
      imageMode
        ? getResolutionsForI2vModel(id, selectedModelProvider)
        : getResolutionsForT2vModel(id, selectedModelProvider),
    [imageMode, selectedModelProvider],
  );

  const getCurrentModel = useCallback(
    () => getCurrentModels().find((m) => m.id === selectedModel),
    [getCurrentModels, selectedModel],
  );

  const referenceLimits = useMemo(() => {
    if (v2vMode) {
      return { images: 0, videos: 0, audios: 0 };
    }
    const catalogMode = imageMode ? 'i2v' : 't2v';
    return getReferenceInputLimits(selectedModel, selectedModelProvider, catalogMode);
  }, [selectedModel, selectedModelProvider, imageMode, v2vMode]);

  useEffect(() => {
    setReferenceImages((prev) => prev.slice(0, referenceLimits.images));
    setReferenceVideos((prev) => prev.slice(0, referenceLimits.videos));
    setReferenceAudios((prev) => prev.slice(0, referenceLimits.audios));
  }, [referenceLimits.images, referenceLimits.videos, referenceLimits.audios]);

  const cardRefs = useMemo(
    () =>
      [
        uploadedImageUrl,
        uploadedEndImageUrl,
        uploadedVideoUrl,
        ...referenceImages,
        ...referenceVideos,
        ...referenceAudios,
      ].filter(Boolean),
    [
      uploadedImageUrl,
      uploadedEndImageUrl,
      uploadedVideoUrl,
      referenceImages,
      referenceVideos,
      referenceAudios,
    ],
  );

  const cardLabels = useMemo(() => extractCardLabels(cardRefs), [cardRefs]);

  const mentionAssets = useMemo(
    () => cardMentionAssets("video", cardRefs),
    [cardRefs],
  );

  const isMotionControlSelection = useCallback(
    (modelId, isV2v) => {
      if (!isV2v) return false;
      const m = v2vModels.find((x) => x.id === modelId);
      return !!m?.imageField;
    },
    [],
  );

  const multimodalTotal =
    referenceLimits.images + referenceLimits.videos + referenceLimits.audios;

  const isMultimodalRefMode =
    !v2vMode && !imageMode && multimodalTotal > 0;
  const showRefImageCircle =
    isMultimodalRefMode && referenceLimits.images > 0;
  const showRefVideoCircle =
    isMultimodalRefMode && referenceLimits.videos > 0;
  const showLegacyImageCircle =
    !v2vMode && !isMultimodalRefMode && !imageMode;
  const showStartImageCircle =
    imageMode || (v2vMode && isMotionControlSelection(selectedModel, v2vMode));
  const showImageCircle = showRefImageCircle || showStartImageCircle || showLegacyImageCircle;
  const showVideoUploadCircle =
    v2vMode || (!imageMode && !isMultimodalRefMode);

  const videoGenOp = v2vMode ? "videoV2v" : imageMode ? "videoI2v" : "videoT2v";
  const videoCatalogMode = v2vMode ? "v2v" : imageMode ? "i2v" : "t2v";
  const showSeedUi = modelSupportsSeed(selectedModel, selectedModelProvider, videoCatalogMode);

  const durationInputSchema = useMemo(
    () => getModelInputSchema(selectedModel, "duration", selectedModelProvider, videoCatalogMode),
    [selectedModel, selectedModelProvider, videoCatalogMode],
  );
  const durationUsesRangeSlider = isRangeModelInput(durationInputSchema);

  const [lastChargedUsd, setLastChargedUsd] = useState(/** @type {number | null} */ (null));

  const videoCostPayload = useMemo(() => {
    if (v2vMode) {
      const p = { model: selectedModel, video_url: uploadedVideoUrl };
      if (uploadedImageUrl) p.image_url = uploadedImageUrl;
      if (prompt.trim()) p.prompt = prompt.trim();
      return p;
    }
    if (imageMode) {
      return {
        model: selectedModel,
        image_url: uploadedImageUrl,
        aspect_ratio: selectedAr,
        duration: selectedDuration,
        resolution: selectedResolution,
        ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
      };
    }
    return {
      model: selectedModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
    };
  }, [
    v2vMode,
    imageMode,
    selectedModel,
    uploadedVideoUrl,
    uploadedImageUrl,
    selectedAr,
    selectedDuration,
    selectedResolution,
    prompt,
  ]);

  const videoCostParams = useMemo(
    () => ({
      duration: selectedDuration,
      resolution: selectedResolution,
      refImageCount: referenceImages.length,
      refVideoCount: referenceVideos.length,
      refAudioCount: referenceAudios.length,
    }),
    [
      selectedDuration,
      selectedResolution,
      referenceImages.length,
      referenceVideos.length,
      referenceAudios.length,
    ],
  );

  const { unitCostUsd, source: costSource, isLoadingCost } = useStudioGenerationCost({
    studioId: "video",
    op: videoGenOp,
    routing: generationRouting,
    modelId: selectedModel,
    providerId: selectedModelProvider,
    catalogMode: videoCatalogMode,
    payload: videoCostPayload,
    costParams: videoCostParams,
    enabled: Boolean(selectedModel) && !generating,
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ update controls when model/mode changes Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const applyControlsForModel = useCallback(
    (modelId, isImageMode, isV2vMode) => {
      if (isV2vMode) {
        setShowAr(false);
        setShowDuration(false);
        setShowResolution(false);
        setShowQuality(false);
        setShowMode(false);
        setShowEffect(false);
        return;
      }

      const catalogMode = isV2vMode ? "v2v" : isImageMode ? "i2v" : "t2v";
      const modelList = flattenModelSections(
        getUnifiedModelSections("video", {
          routingMode: baseRouting.routingMode,
          allowMuapiFallback: baseRouting.allowMuapiFallback,
          muapiKey: baseRouting.muapiKey,
          runwareApiKey: baseRouting.runwareApiKey,
          catalogMode,
        }),
      );
      const model =
        modelList.find((m) => m.id === modelId) ||
        getModelByIdForStudio(modelId, "video", "runware", { catalogMode }) ||
        getModelByIdForStudio(modelId, "video", "muapi", { catalogMode });

      const providerId = modelProviderId(model, selectedModelProvider);

      const ars = isImageMode
        ? getAspectRatiosForI2vModel(modelId, providerId)
        : getAspectRatiosForT2vModel(modelId, providerId);
      if (ars.length > 0) {
        setSelectedAr(
          clampModelInputSelection(
            selectedAr,
            ars,
            getModelInputDefault(modelId, 'aspect_ratio', providerId, catalogMode) || ars[0],
          ),
        );
        setShowAr(true);
      } else {
        setShowAr(false);
      }

      const durations = isImageMode
        ? getDurationsForI2vModel(modelId, providerId)
        : getDurationsForT2vModel(modelId, providerId);
      if (durations.length > 0) {
        setSelectedDuration(
          clampModelInputSelection(
            selectedDuration,
            durations,
            getModelInputDefault(modelId, 'duration', providerId, catalogMode) || durations[0],
          ),
        );
        setShowDuration(true);
      } else {
        setShowDuration(false);
      }

      const resolutions = isImageMode
        ? getResolutionsForI2vModel(modelId, providerId)
        : getResolutionsForT2vModel(modelId, providerId);
      if (resolutions.length > 0) {
        setSelectedResolution(
          clampModelInputSelection(
            selectedResolution,
            resolutions,
            getModelInputDefault(modelId, 'resolution', providerId, catalogMode) || resolutions[0],
          ),
        );
        setShowResolution(true);
      } else {
        setShowResolution(false);
      }

      const qualities = getQualitiesForModel(modelId, providerId, catalogMode);
      if (qualities.length > 0) {
        setSelectedQuality(
          clampModelInputSelection(
            selectedQuality,
            qualities,
            getModelInputDefault(modelId, 'quality', providerId, catalogMode) || qualities[0],
          ),
        );
        setShowQuality(true);
      } else {
        setSelectedQuality("");
        setShowQuality(false);
      }

      const modes = getModesForModelRegistry(modelId, providerId, catalogMode);
      if (modes.length > 0) {
        setSelectedMode(
          clampModelInputSelection(
            selectedMode,
            modes,
            getModelInputDefault(modelId, 'mode', providerId, catalogMode) || modes[0],
          ),
        );
        setShowMode(true);
      } else {
        setSelectedMode("");
        setShowMode(false);
      }

      const effects = isImageMode ? getEffectsForModelRegistry(modelId, providerId, 'i2v') : [];
      if (effects.length > 0) {
        setSelectedEffect(getDefaultEffectForModelRegistry(modelId, providerId, 'i2v') || effects[0]);
        setShowEffect(true);
      } else {
        setSelectedEffect("");
        setShowEffect(false);
      }
    },
    [],
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Persistence: Load Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        if (data.v2vMode !== undefined) setV2vMode(data.v2vMode);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
        if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedDuration) setSelectedDuration(data.selectedDuration);
        if (data.selectedResolution) setSelectedResolution(data.selectedResolution);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedMode) setSelectedMode(data.selectedMode);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.uploadedImageUrl) setUploadedImageUrl(data.uploadedImageUrl);
        if (data.uploadedVideoUrl) setUploadedVideoUrl(data.uploadedVideoUrl);
        if (data.uploadedVideoName) setUploadedVideoName(data.uploadedVideoName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.seedValue != null) setSeedValue(data.seedValue);
        if (data.localHistory) setLocalHistory(data.localHistory);

        // Update control visibility based on restored model/mode
        applyControlsForModel(
          data.selectedModel || defaultModel.id,
          !!data.imageMode,
          !!data.v2vMode
        );
      }
    } catch (err) {
      console.warn("Failed to load VideoStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, [applyControlsForModel, defaultModel.id]);

  useEffect(() => {
    if (imageMode || v2vMode) return;
    const flat = flattenModelSections(modelSections);
    if (!flat.length) return;
    const match = flat.find(
      (m) => m.id === selectedModel && (m.providerId || selectedModelProvider) === selectedModelProvider,
    );
    if (match) return;
    const pick = loadModelPick("video");
    const fromPick = pick
      ? flat.find((m) => m.id === pick.modelId && m.providerId === pick.providerId)
      : null;
    const first = fromPick || flat[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    setSelectedModelProvider(first.providerId || "runware");
    applyControlsForModel(first.id, false, false);
  }, [
    modelSections,
    imageMode,
    v2vMode,
    selectedModel,
    selectedModelProvider,
    applyControlsForModel,
  ]);

  const handleBrowseSearch = useCallback(
    async (query) => {
      const q = query.trim();
      if (!q || !runwareApiKey?.trim() || !showRunwareBrowse) {
        setBrowseModels([]);
        return;
      }
      setBrowseLoading(true);
      try {
        const results = await searchRunwareModels(runwareApiKey, { search: q, limit: 20 });
        setBrowseModels(results);
      } catch {
        setBrowseModels([]);
      } finally {
        setBrowseLoading(false);
      }
    },
    [runwareApiKey, showRunwareBrowse],
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Adjust height on load Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        const el = textareaRef.current;
        el.style.height = "auto";
        const maxH = window.innerWidth < 768 ? 150 : 250;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Persistence: Save Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          v2vMode,
          selectedModel,
          selectedModelName,
          selectedAr,
          selectedDuration,
          selectedResolution,
          selectedQuality,
          selectedMode,
          selectedEffect,
          uploadedImageUrl,
          uploadedVideoUrl,
          uploadedVideoName,
          prompt,
          seedValue,
          localHistory: localHistory.filter((e) => e.status === "ready" && e.url),
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save VideoStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    v2vMode,
    selectedModel,
    selectedModelName,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    selectedEffect,
    uploadedImageUrl,
    uploadedVideoUrl,
    uploadedVideoName,
    prompt,
    seedValue,
    localHistory,
  ]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Derived UI values Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const processDroppedImage = async (file) => {
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image exceeds 10MB limit.");
      return;
    }
    setImageUploading(true);
    setImageProgress(0);
    try {
      const url = await uploadFileForStudio(baseRouting, file, (pct) => {
        setImageProgress(pct);
      }, "video");
      setUploadedImageUrl(url);
      setUploadedVideoUrl(null);
      setUploadedVideoName(null);
      setV2vMode(false);
      if (!imageMode) {
        const currentT2V = t2vModels.find((m) => m.id === selectedModel);
        const sibling = currentT2V?.family
          ? i2vModels.find((m) => m.family === currentT2V.family)
          : null;
        const target = sibling || i2vModels[0];
        setImageMode(true);
        setSelectedModel(target.id);
        setSelectedModelName(target.name);
        applyControlsForModel(target.id, true, false);
      }
      setPromptDisabled(false);
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
    }
  };

  const processDroppedVideo = async (file) => {
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video exceeds 50MB limit.");
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadFileForStudio(baseRouting, file, (pct) => {
        setVideoProgress(pct);
      }, "video");
      setUploadedVideoUrl(url);
      setUploadedVideoName(file.name);
      if (imageMode) {
        setUploadedImageUrl(null);
        setImageMode(false);
      }
      setV2vMode(true);
      const firstV2V = v2vModels[0];
      setSelectedModel(firstV2V.id);
      setSelectedModelName(firstV2V.name);
      applyControlsForModel(firstV2V.id, false, true);
      setPrompt("");
      setPromptDisabled(true);
    } catch (err) {
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Handle Dropped Files Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      const videoFiles = droppedFiles.filter(f => f.type.startsWith('video/'));
      const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'));

      if (videoFiles.length > 0) {
        processDroppedVideo(videoFiles[0]);
      } else if (imageFiles.length > 0) {
        processDroppedImage(imageFiles[0]);
      } else if (
        audioFiles.length > 0 &&
        !v2vMode &&
        referenceLimits.audios > 0 &&
        referenceAudios.length < referenceLimits.audios
      ) {
        pendingMultimodalKind.current = 'audio';
        (async () => {
          const file = audioFiles[0];
          if (file.size > 25 * 1024 * 1024) {
            alert('Audio exceeds 25MB limit.');
            return;
          }
          setRefMultimodalUploading(true);
          try {
            const asset = await stageFileForStudio('video', file);
            setReferenceAudios((prev) => [...prev, asset.label]);
          } catch (err) {
            alert(`Reference upload failed: ${err.message}`);
          } finally {
            setRefMultimodalUploading(false);
          }
        })();
      }
      onFilesHandled?.();
    }
  }, [
    droppedFiles,
    onFilesHandled,
    processDroppedImage,
    processDroppedVideo,
    v2vMode,
    referenceLimits.audios,
    referenceAudios.length,
  ]);

  // Initialise controls for default model on mount
  useEffect(() => {
    if (hasRestored.current) return;
    applyControlsForModel(defaultModel.id, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ close dropdown on outside click Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openDropdown]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ textarea auto-resize Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handlePromptInput = (e) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxH = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ image upload Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image exceeds 10MB limit.");
      return;
    }

    if (showRefImageCircle) {
      if (referenceImages.length >= referenceLimits.images) {
        alert(`Maximum ${referenceLimits.images} reference image(s).`);
        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
        return;
      }
      setImageUploading(true);
      try {
        const asset = await stageFileForStudio("video", file);
        setReferenceImages((prev) => [...prev, asset.label]);
      } catch (err) {
        alert(`Reference image upload failed: ${err.message}`);
      } finally {
        setImageUploading(false);
        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      }
      return;
    }

    setImageUploading(true);
    setImageProgress(0);

    try {
      const url = await uploadFileForStudio(baseRouting, file, (pct) => {
        setImageProgress(pct);
      }, "video");
      setUploadedImageUrl(url);

      // Motion-control v2v: image is a second input, not a mode switch
      if (isMotionControlSelection(selectedModel, v2vMode)) {
        setPromptDisabled(false);
      } else {
        // Clear v2v if active
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setV2vMode(false);

        if (!imageMode) {
          const currentT2V = t2vModels.find((m) => m.id === selectedModel);
          const sibling = currentT2V?.family
            ? i2vModels.find((m) => m.family === currentT2V.family)
            : null;
          const target = sibling || i2vModels[0];
          setImageMode(true);
          setSelectedModel(target.id);
          setSelectedModelName(target.name);
          applyControlsForModel(target.id, true, false);
        }
        setPromptDisabled(false);
      }
    } catch (err) {
      console.error("[VideoStudio] Image upload failed:", err);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const clearImageUpload = () => {
    if (showRefImageCircle) {
      setReferenceImages([]);
      return;
    }
    setUploadedImageUrl(null);
    setUploadedEndImageUrl(null);
    setReferenceImages([]);
    setReferenceVideos([]);
    setReferenceAudios([]);
    setGenerateAudio(false);
    // Motion-control v2v: keep model and video; just drop the image
    if (isMotionControlSelection(selectedModel, v2vMode)) return;
    setImageMode(false);
    const first = firstUnifiedT2vModel(modelSections);
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ end-frame upload (FLF i2v models) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleEndImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image exceeds 10MB limit.");
      return;
    }
    setEndImageUploading(true);
    setEndImageProgress(0);
    try {
      const url = await uploadFileForStudio(baseRouting, file, (pct) => {
        setEndImageProgress(pct);
      }, "video");
      setUploadedEndImageUrl(url);
    } catch (err) {
      alert(`End frame upload failed: ${err.message}`);
    } finally {
      setEndImageUploading(false);
      setEndImageProgress(0);
      if (endImageFileInputRef.current) endImageFileInputRef.current.value = "";
    }
  };

  const clearEndImage = () => setUploadedEndImageUrl(null);

  // Ã¢â€â‚¬Ã¢â€â‚¬ video upload Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video exceeds 50MB limit.");
      return;
    }

    if (showRefVideoCircle) {
      if (referenceVideos.length >= referenceLimits.videos) {
        alert(`Maximum ${referenceLimits.videos} reference video(s).`);
        if (videoFileInputRef.current) videoFileInputRef.current.value = "";
        return;
      }
      setVideoUploading(true);
      try {
        const asset = await stageFileForStudio("video", file);
        setReferenceVideos((prev) => [...prev, asset.label]);
      } catch (err) {
        alert(`Reference video upload failed: ${err.message}`);
      } finally {
        setVideoUploading(false);
        if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      }
      return;
    }

    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadFileForStudio(baseRouting, file, (pct) => {
        setVideoProgress(pct);
      }, "video");
      setUploadedVideoUrl(url);
      setUploadedVideoName(file.name);

      if (isMotionControlSelection(selectedModel, v2vMode)) {
        // Already in motion-control mode Ã¢â‚¬â€ keep model and image, allow prompt
        setPromptDisabled(false);
      } else {
        // Default v2v flow (e.g. watermark remover) Ã¢â‚¬â€ auto-pick the first v2v model
        if (imageMode) {
          setUploadedImageUrl(null);
          setImageMode(false);
        }
        setV2vMode(true);
        const firstV2V = v2vModels[0];
        setSelectedModel(firstV2V.id);
        setSelectedModelName(firstV2V.name);
        applyControlsForModel(firstV2V.id, false, true);
        setPrompt("");
        setPromptDisabled(true);
      }
    } catch (err) {
      console.error("[VideoStudio] Video upload failed:", err);
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  };

  const clearVideoUpload = () => {
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    const first = firstUnifiedT2vModel(modelSections);
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ model selection from dropdown Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleModelSelect = useCallback(
    (m, isV2V, providerId) => {
      if (isV2V) {
        setV2vMode(true);
        setImageMode(false);
        const isMC = !!m.imageField;
        if (!isMC) {
          // Single-input v2v (watermark remover etc.) Ã¢â‚¬â€ drop any image
          setUploadedImageUrl(null);
          setUploadedImagePreview(null);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        applyControlsForModel(m.id, false, true);
        if (isMC) {
          // Motion-control: prompt is editable, video+image are needed
          setPromptDisabled(false);
        } else {
          setPrompt("");
          setPromptDisabled(true);
        }
      } else {
        if (v2vMode) {
          setV2vMode(false);
          setUploadedVideoUrl(null);
          setUploadedVideoName(null);
          setPromptDisabled(false);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        if (providerId && !imageMode) {
          setSelectedModelProvider(providerId);
          saveModelPick("video", { v: 1, modelId: m.id, providerId });
        }
        applyControlsForModel(m.id, imageMode, false);
      }
    },
    [v2vMode, imageMode, applyControlsForModel],
  );

  const pendingMultimodalKind = useRef('image');

  const openMultimodalPicker = (kind) => {
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    pendingMultimodalKind.current = kind;
    if (multimodalRefInputRef.current) {
      multimodalRefInputRef.current.accept =
        kind === 'audio' ? 'audio/*' : kind === 'video' ? 'video/*' : 'image/*';
      multimodalRefInputRef.current.click();
    }
  };

  const handleMultimodalRefPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = pendingMultimodalKind.current;
    const limits = referenceLimits;
    if (kind === 'audio' && !file.type.startsWith('audio/')) {
      alert('Please choose an audio file (MP3, WAV, etc.).');
      if (multimodalRefInputRef.current) multimodalRefInputRef.current.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('Reference file exceeds 25MB limit.');
      if (multimodalRefInputRef.current) multimodalRefInputRef.current.value = '';
      return;
    }
    setRefMultimodalUploading(true);
    try {
      const asset = await stageFileForStudio('video', file);
      const label = asset.label;
      if (kind === 'image') {
        if (referenceImages.length >= limits.images) {
          alert(`Maximum ${limits.images} reference image(s).`);
        } else {
          setReferenceImages((prev) => [...prev, label]);
        }
      } else if (kind === 'video') {
        if (referenceVideos.length >= limits.videos) {
          alert(`Maximum ${limits.videos} reference video(s).`);
        } else {
          setReferenceVideos((prev) => [...prev, label]);
        }
      } else if (kind === 'audio') {
        if (referenceAudios.length >= limits.audios) {
          alert(`Maximum ${limits.audios} reference audio file(s).`);
        } else {
          setReferenceAudios((prev) => [...prev, label]);
        }
      }
    } catch (err) {
      alert(`Reference upload failed: ${err.message}`);
    } finally {
      setRefMultimodalUploading(false);
      if (multimodalRefInputRef.current) multimodalRefInputRef.current.value = '';
    }
  };

  const clearReferenceAudios = useCallback(() => {
    setReferenceAudios([]);
  }, []);

  // add to local historyÃ¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const buildVideoSnapshot = useCallback(
    () =>
      buildGenerationSnapshot({
        studioId: "video",
        catalogMode: videoCatalogMode,
        modelId: selectedModel,
        providerId: selectedModelProvider,
        prompt: prompt.trim(),
        controls: {
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          resolution: selectedResolution,
          generateAudio,
          ...(selectedQuality ? { quality: selectedQuality } : {}),
          ...(selectedMode ? { mode: selectedMode } : {}),
          ...(seedForSnapshot(seedValue) != null ? { seed: seedForSnapshot(seedValue) } : {}),
        },
        assetLabels: [
          ...cardLabels,
          ...referenceImages,
          ...referenceVideos,
          ...referenceAudios,
        ],
        assetManifest: manifestFromAssetLabels("video", [
          ...cardLabels,
          ...referenceImages,
          ...referenceVideos,
          ...referenceAudios,
        ]),
        imageMode,
        v2vMode,
        restoreImageUrl: uploadedImageUrl || undefined,
        restoreVideoUrl: uploadedVideoUrl || undefined,
      }),
    [
      videoCatalogMode,
      selectedModel,
      selectedModelProvider,
      prompt,
      selectedAr,
      selectedDuration,
      selectedResolution,
      generateAudio,
      selectedQuality,
      selectedMode,
      cardLabels,
      referenceImages,
      referenceVideos,
      referenceAudios,
      imageMode,
      v2vMode,
      uploadedImageUrl,
      uploadedVideoUrl,
      seedValue,
    ],
  );

  useEffect(() => {
    return subscribeStudioRecreate((snap) => {
      if (snap.studioId !== "video") return;
      setV2vMode(!!snap.v2vMode);
      setImageMode(!!snap.imageMode);
      setSelectedModelProvider(snap.providerId);
      setSelectedModel(snap.modelId);
      applyControlsForModel(snap.modelId, !!snap.imageMode, !!snap.v2vMode);
      if (snap.controls?.aspect_ratio) setSelectedAr(String(snap.controls.aspect_ratio));
      if (snap.controls?.duration != null) setSelectedDuration(Number(snap.controls.duration));
      if (snap.controls?.resolution) setSelectedResolution(String(snap.controls.resolution));
      if (snap.controls?.generateAudio != null) setGenerateAudio(Boolean(snap.controls.generateAudio));
      if (snap.controls?.quality) setSelectedQuality(snap.controls.quality);
      if (snap.controls?.mode) setSelectedMode(snap.controls.mode);
      if (snap.controls?.seed != null && Number.isFinite(Number(snap.controls.seed))) {
        setSeedValue(Number(snap.controls.seed));
      } else {
        setSeedValue(null);
      }
      setPrompt(snap.prompt || "");
      if (snap.restoreImageUrl) setUploadedImageUrl(snap.restoreImageUrl);
      if (snap.restoreVideoUrl) {
        setUploadedVideoUrl(snap.restoreVideoUrl);
      }
      void restoreAssetsForRecreate("video", snap).then(({ restored, missing }) => {
        const imgs = restored.filter((l) => l.startsWith("image"));
        const vids = restored.filter((l) => l.startsWith("video"));
        const auds = restored.filter((l) => l.startsWith("audio"));
        setReferenceImages(imgs);
        setReferenceVideos(vids);
        setReferenceAudios(auds);
        if (missing.length > 0) {
          setGenerateError(CONTROL_STRINGS.refsMissingRecreate);
        }
      });
    });
  }, [applyControlsForModel]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ show result in canvas Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const showVideoInCanvas = useCallback((url, model) => {
    setCanvasUrl(url);
    setCanvasModel(model);
    setShowCanvas(true);
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ generate Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleGenerate = useCallback(async () => {
    const currentModel = getCurrentModel();
    const isExtendMode = currentModel?.requiresRequestId;
    const trimmedPrompt = prompt.trim();
    const scopedPrompt = filterMentionsToCardScope(trimmedPrompt, cardLabels);
    const finalizeOpts = { cardLabels };

    if (v2vMode) {
      if (!uploadedVideoUrl) {
        alert("Please upload a video first.");
        return;
      }
      if (currentModel?.imageField && !uploadedImageUrl) {
        alert("Please upload a reference image for motion control.");
        return;
      }
      if (currentModel?.promptRequired && !trimmedPrompt) {
        alert("Please describe the motion you want.");
        return;
      }
    } else if (isExtendMode) {
      if (!lastGenerationId) {
        alert(
          "No Seedance 2.0 generation found to extend. Generate a video first.",
        );
        return;
      }
    } else if (imageMode) {
      if (!uploadedImageUrl) {
        alert("Please upload a start frame image first.");
        return;
      }
    } else {
      if (!trimmedPrompt) {
        alert("Please enter a prompt to generate a video.");
        return;
      }
    }

    setGenerating(true);
    setGenerateError(null);

    const snapshot = buildVideoSnapshot();
    const videoRefLabels = [
      ...cardLabels,
      ...referenceImages,
      ...referenceVideos,
      ...referenceAudios,
    ];
    const finalizedSnapshot = {
      ...snapshot,
      assetManifest: manifestFromAssetLabels("video", videoRefLabels),
      assetLabels: [...new Set(videoRefLabels)],
    };
    const seedSchema = getModelInputSchema(
      selectedModel,
      "seed",
      selectedModelProvider,
      videoCatalogMode,
    );
    const sentSeed = resolveSeedForGenerate(seedValue, seedSchema);
    const pendingId = prependPending({
      prompt: trimmedPrompt,
      model: selectedModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      providerId: selectedModelProvider,
      snapshot: finalizedSnapshot,
      mediaType: "video",
    });

    let hadError = false;

    try {
      let res;

      if (v2vMode) {
        // V2V: dedicated processV2V handles single-input tools (e.g. watermark
        // remover) and motion-control models (which take video + image + prompt)
        const v2vParams = {
          model: selectedModel,
          video_url: uploadedVideoUrl,
        };
        if (currentModel?.imageField && uploadedImageUrl) {
          v2vParams.image_url = uploadedImageUrl;
        }
        if (currentModel?.hasPrompt && scopedPrompt) {
          v2vParams.prompt = scopedPrompt;
        }
        applySeedToParams(v2vParams, seedValue, selectedModel, selectedModelProvider, videoCatalogMode);
        res = await processV2VForStudio(generationRouting, v2vParams);
        if (!res?.url) throw new Error("No video URL returned by API");

        const genId = res.id || Date.now().toString();
        setLastGenerationId(null);
        setLastGenerationModel(null);
        resolvePending(pendingId, {
          id: genId,
          url: res.url,
          prompt: currentModel?.hasPrompt ? trimmedPrompt : "",
          model: selectedModel,
          providerId: selectedModelProvider,
          timestamp: new Date().toISOString(),
          snapshot: finalizedSnapshot,
        });
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: currentModel?.hasPrompt ? trimmedPrompt : "",
            type: "video",
          });
        setSeedValue(advanceSeed(usedSeedFromResponse(sentSeed, res)));
      } else if (imageMode) {
        const i2vParams = { model: selectedModel, image_url: uploadedImageUrl };
        if (scopedPrompt) i2vParams.prompt = scopedPrompt;
        i2vParams.aspect_ratio = selectedAr;
        const i2vModel = i2vModels.find((m) => m.id === selectedModel);
        if (uploadedEndImageUrl && i2vModel?.lastImageField) {
          i2vParams.last_image = uploadedEndImageUrl;
        }
        const durations = getDurationsForI2vModel(selectedModel, selectedModelProvider);
        if (durations.length > 0) i2vParams.duration = selectedDuration;
        const resolutions = getResolutionsForI2vModel(selectedModel, selectedModelProvider);
        if (resolutions.length > 0) i2vParams.resolution = selectedResolution;
        if (selectedQuality) i2vParams.quality = selectedQuality;
        if (selectedMode) i2vParams.mode = selectedMode;
        if (showEffect && selectedEffect) i2vParams.name = selectedEffect;

        if (referenceImages.length > 0) {
          i2vParams.referenceImages = referenceImages;
        }
        if (referenceVideos.length > 0) {
          i2vParams.referenceVideos = referenceVideos;
        }
        if (referenceAudios.length > 0) {
          i2vParams.referenceAudios = referenceAudios;
        }
        if (generateAudio) i2vParams.generateAudio = true;
        applySeedToParams(i2vParams, seedValue, selectedModel, selectedModelProvider, videoCatalogMode);

        res = await generateI2VForStudio(generationRouting, i2vParams, finalizeOpts);
        if (!res?.url) throw new Error("No video URL returned by API");

        const genId = res.id || Date.now().toString();
        if (selectedModel === "seedance-v2.0-i2v") {
          setLastGenerationId(genId);
          setLastGenerationModel(selectedModel);
        } else {
          setLastGenerationId(null);
          setLastGenerationModel(null);
        }
        resolvePending(pendingId, {
          id: genId,
          url: res.url,
          prompt: trimmedPrompt,
          model: selectedModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          resolution: selectedResolution,
          providerId: selectedModelProvider,
          timestamp: new Date().toISOString(),
          snapshot: finalizedSnapshot,
        });
        setActiveHistoryIdx(0);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
          });
        setSeedValue(advanceSeed(usedSeedFromResponse(sentSeed, res)));
      } else {
        // T2V (including extend mode)
        const params = { model: selectedModel };
        if (scopedPrompt) params.prompt = scopedPrompt;

        if (isExtendMode) {
          params.request_id = lastGenerationId;
        } else {
          params.aspect_ratio = selectedAr;
        }

        const durations = getDurationsForT2vModel(selectedModel, selectedModelProvider);
        if (durations.length > 0) params.duration = selectedDuration;
        const resolutions = getResolutionsForT2vModel(selectedModel, selectedModelProvider);
        if (resolutions.length > 0) params.resolution = selectedResolution;
        if (referenceImages.length > 0) {
          params.referenceImages = referenceImages;
        }
        if (referenceVideos.length > 0) {
          params.referenceVideos = referenceVideos;
        }
        if (referenceAudios.length > 0) {
          params.referenceAudios = referenceAudios;
        }
        if (generateAudio) params.generateAudio = true;
        if (selectedQuality) params.quality = selectedQuality;
        if (selectedMode) params.mode = selectedMode;
        if (!isExtendMode) {
          applySeedToParams(params, seedValue, selectedModel, selectedModelProvider, videoCatalogMode);
        }

        res = await generateVideoForStudio(generationRouting, params, finalizeOpts);
        if (!res?.url) throw new Error("No video URL returned by API");

        const genId = res.id || Date.now().toString();
        if (
          selectedModel === "seedance-v2.0-t2v" ||
          selectedModel === "seedance-v2.0-i2v" ||
          selectedModel === "rw-seedance-2" ||
          selectedModel === "rw-seedance-2-fast" ||
          selectedModel === "rw-seedance-2-i2v" ||
          selectedModel === "rw-seedance-2-fast-i2v"
        ) {
          setLastGenerationId(genId);
          setLastGenerationModel(selectedModel);
        } else {
          setLastGenerationId(null);
          setLastGenerationModel(null);
        }
        resolvePending(pendingId, {
          id: genId,
          url: res.url,
          prompt: trimmedPrompt,
          model: selectedModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          resolution: selectedResolution,
          providerId: selectedModelProvider,
          timestamp: new Date().toISOString(),
          snapshot: finalizedSnapshot,
        });
        setActiveHistoryIdx(0);
        showVideoInCanvas(res.url, selectedModel);
        if (onGenerationComplete)
          onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video",
          });
        if (!isExtendMode) setSeedValue(advanceSeed(usedSeedFromResponse(sentSeed, res)));
      }

      if (typeof res?.costUsd === "number" && Number.isFinite(res.costUsd)) {
        setLastChargedUsd(res.costUsd);
      }
    } catch (e) {
      hadError = true;
      failPending(pendingId, e?.message || "Generation failed");
      console.error("[VideoStudio]", e);
      setGenerateError(e.message?.slice(0, 80) || "Generation failed");
      setTimeout(() => setGenerateError(null), 4000);
    } finally {
      setGenerating(false);
    }
  }, [
    apiKey,
    prompt,
    v2vMode,
    imageMode,
    selectedModel,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    selectedEffect,
    showEffect,
    uploadedImageUrl,
    uploadedVideoUrl,
    lastGenerationId,
    getCurrentModel,
    buildVideoSnapshot,
    prependPending,
    resolvePending,
    failPending,
    showVideoInCanvas,
    onGenerationComplete,
    cardLabels,
    referenceImages,
    referenceVideos,
    referenceAudios,
    generateAudio,
    generationRouting,
  ]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ reset to prompt bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const resetToPromptBar = useCallback(() => {
    setShowCanvas(false);
  }, []);

  const handleNewPrompt = useCallback(() => {
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setUploadedImagePreview(null);
    setImageMode(false);
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    const first = firstUnifiedT2vModel(modelSections);
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [resetToPromptBar, applyControlsForModel]);

  const handleExtend = useCallback(() => {
    if (!lastGenerationId) return;
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setUploadedImagePreview(null);
    setImageMode(false);
    setSelectedModel("seedance-v2.0-extend");
    setSelectedModelName("Seedance 2.0 Extend");
    applyControlsForModel("seedance-v2.0-extend", false, false);
    setPromptDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [lastGenerationId, resetToPromptBar, applyControlsForModel]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ derived UI values Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const isSeedance2Canvas =
    canvasModel === "seedance-v2.0-t2v" || canvasModel === "seedance-v2.0-i2v";
  const currentModelObj = getCurrentModel();
  const isExtendMode = currentModelObj?.requiresRequestId;

  const promptPlaceholder = v2vMode
    ? currentModelObj?.imageField
      ? currentModelObj?.promptRequired
        ? "Describe the motion"
        : "Describe the motion (optional)"
      : "Video ready — click Generate to remove watermark"
    : multimodalTotal > 0 && referenceLimits.audios > 0
      ? "Use @image1, @video1, @audio1 for references on this card"
      : imageMode
        ? "Describe the motion or effect (optional)"
        : isExtendMode
          ? "Optional: describe how to continue the video..."
          : "Describe the video you want to create";

  const firstRefAudioLabel = referenceAudios[0];
  const firstRefAudioAsset =
    firstRefAudioLabel && isAssetLabel(firstRefAudioLabel)
      ? getStudioAsset("video", firstRefAudioLabel)
      : null;
  const firstRefImageLabel = referenceImages[0];
  const firstRefImageAsset =
    firstRefImageLabel && isAssetLabel(firstRefImageLabel)
      ? getStudioAsset("video", firstRefImageLabel)
      : null;
  const firstRefVideoLabel = referenceVideos[0];
  const firstRefVideoAsset =
    firstRefVideoLabel && isAssetLabel(firstRefVideoLabel)
      ? getStudioAsset("video", firstRefVideoLabel)
      : null;

  const toggleDropdown = (type) => (e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden"
    >
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CENTRAL GALLERY AREA Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => {
              const isSeedance2 =
                entry.model === "seedance-v2.0-t2v" ||
                entry.model === "seedance-v2.0-i2v" ||
                entry.model === "rw-seedance-2" ||
                entry.model === "rw-seedance-2-fast" ||
                entry.model === "rw-seedance-2-i2v" ||
                entry.model === "rw-seedance-2-fast-i2v";
              return (
                <GenerationHistoryCard
                  key={entry.id || idx}
                  entry={{
                    status: entry.status || (entry.url ? "ready" : "pending"),
                    ...entry,
                  }}
                  mediaType="video"
                  onOpen={(e) => setDetailEntry(e)}
                  onDownload={(e) =>
                    e.url && downloadFile(e.url, `video-${e.id || idx}.mp4`)
                  }
                  extraActions={
                    isSeedance2 && entry.status === "ready" ? (
                      <button
                        type="button"
                        title="Extend this video"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLastGenerationId(entry.id);
                          handleExtend();
                        }}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">Ã¢Å“Â¨</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-4 text-center px-4">
              <span className="text-foreground-muted font-medium">START CREATING WITH</span><br />
              <span className="text-foreground">VIDEO STUDIO</span>
            </h1>
            <p className="text-foreground-muted text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Animate images into stunning AI videos with motion effects
            </p>
          </div>
        )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ BOTTOM PROMPT BAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full studio-surface backdrop-blur-3xl rounded-md p-4 flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center gap-2 px-1">
            {/* Image: I2V start / T2V+refs / legacy I2V picker */}
            {showImageCircle ? (
            <div className="relative">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                title={
                  showRefImageCircle
                    ? referenceImages.length >= referenceLimits.images
                      ? `Reference images (${referenceImages.length}/${referenceLimits.images}) — max reached`
                      : `Add reference image — ${referenceImages.length}/${referenceLimits.images}`
                    : uploadedImageUrl
                      ? "Clear image"
                      : "Upload image for Image-to-Video"
                }
                aria-label={
                  showRefImageCircle
                    ? `Add reference image, ${referenceImages.length} of ${referenceLimits.images} slots used`
                    : uploadedImageUrl
                      ? "Clear start image"
                      : "Upload start image"
                }
                onClick={() => {
                  if (showRefImageCircle) {
                    if (referenceImages.length > 0 && referenceLimits.images === 1) {
                      clearImageUpload();
                      return;
                    }
                    if (referenceImages.length >= referenceLimits.images) {
                      alert(`Maximum ${referenceLimits.images} reference image(s).`);
                      return;
                    }
                    imageFileInputRef.current?.click();
                    return;
                  }
                  if (uploadedImageUrl) clearImageUpload();
                  else imageFileInputRef.current?.click();
                }}
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${
                  showRefImageCircle
                    ? referenceImages.length > 0
                      ? "border-primary/60 bg-primary/5"
                      : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"
                    : uploadedImageUrl
                      ? "border-primary/60 bg-primary/5"
                      : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"
                } group`}
              >
                {imageUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * imageProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {imageProgress}%
                    </span>
                  </div>
                ) : null}

                {showRefImageCircle && firstRefImageAsset ? (
                  <MediaPreviewThumb
                    studioId="video"
                    asset={firstRefImageAsset}
                    kind="image"
                    className="w-full h-full rounded-full"
                  />
                ) : uploadedImageUrl ? (
                  <img
                    src={uploadedImageUrl}
                    alt=""
                    className={`w-full h-full object-cover rounded-full ${imageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                  />
                ) : (
                  !imageUploading && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/40 group-hover:text-primary transition-colors"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )
                )}
                {showRefImageCircle && referenceLimits.images > 1 && referenceImages.length > 0 ? (
                  <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-black/80 rounded-full text-[8px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                    {referenceImages.length}/{referenceLimits.images}
                  </span>
                ) : null}
              </button>
            </div>
            ) : null}

            {/* End-frame upload button (FLF i2v models only) */}
            {imageMode && i2vModels.find((m) => m.id === selectedModel)?.lastImageField && (
              <div className="relative">
                <input
                  ref={endImageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEndImageFileChange}
                />
                <button
                  type="button"
                  title={uploadedEndImageUrl ? "Clear end frame" : "Upload end frame (optional)"}
                  onClick={() =>
                    uploadedEndImageUrl
                      ? clearEndImage()
                      : endImageFileInputRef.current?.click()
                  }
                  className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedEndImageUrl ? "border-primary/60 bg-primary/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
                >
                  {endImageUploading ? (
                    <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                      <svg className="w-8 h-8 -rotate-90">
                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="transparent"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * endImageProgress) / 100}
                          className="text-primary transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-primary leading-none">
                        {endImageProgress}%
                      </span>
                    </div>
                  ) : null}

                  {uploadedEndImageUrl ? (
                    <img
                      src={uploadedEndImageUrl}
                      alt=""
                      className={`w-full h-full object-cover rounded-full ${endImageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    />
                  ) : (
                    !endImageUploading && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-primary transition-colors">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )
                  )}
                  <span className="absolute top-0.5 left-0.5 px-1 h-3.5 bg-black/60 rounded-md text-[7px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                    END
                  </span>
                </button>
              </div>
            )}

            {/* Video: V2V upload or T2V+refs */}
            {(showVideoUploadCircle || showRefVideoCircle) ? (
            <div className="relative">
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <button
                type="button"
                title={
                  showRefVideoCircle
                    ? referenceVideos.length >= referenceLimits.videos
                      ? `Reference videos (${referenceVideos.length}/${referenceLimits.videos}) — max reached`
                      : `Add reference video — ${referenceVideos.length}/${referenceLimits.videos}`
                    : uploadedVideoUrl
                      ? `${uploadedVideoName} — click to clear`
                      : "Upload video to remove watermark"
                }
                aria-label={
                  showRefVideoCircle
                    ? `Add reference video, ${referenceVideos.length} of ${referenceLimits.videos} slots used`
                    : uploadedVideoUrl
                      ? "Clear video"
                      : "Upload video"
                }
                onClick={() => {
                  if (showRefVideoCircle) {
                    if (referenceVideos.length > 0 && referenceLimits.videos === 1) {
                      setReferenceVideos([]);
                      return;
                    }
                    if (referenceVideos.length >= referenceLimits.videos) {
                      alert(`Maximum ${referenceLimits.videos} reference video(s).`);
                      return;
                    }
                    videoFileInputRef.current?.click();
                    return;
                  }
                  if (uploadedVideoUrl) clearVideoUpload();
                  else videoFileInputRef.current?.click();
                }}
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${
                  showRefVideoCircle
                    ? referenceVideos.length > 0
                      ? "border-primary/60 bg-primary/5"
                      : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"
                    : uploadedVideoUrl
                      ? "border-primary/60 bg-white/5"
                      : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"
                } group`}
              >
                {videoUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * videoProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {videoProgress}%
                    </span>
                  </div>
                ) : showRefVideoCircle && firstRefVideoAsset ? (
                  <MediaPreviewThumb
                    studioId="video"
                    asset={firstRefVideoAsset}
                    kind="video"
                    className="w-full h-full rounded-full"
                  />
                ) : uploadedVideoUrl ? (
                  <video
                    src={uploadedVideoUrl}
                    className={`w-full h-full object-cover rounded-full ${videoUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    muted
                  />
                ) : (
                  <VideoIconSvg className="text-white/40 group-hover:text-primary transition-colors" />
                )}
                {showRefVideoCircle && referenceLimits.videos > 1 && referenceVideos.length > 0 ? (
                  <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-black/80 rounded-full text-[8px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                    {referenceVideos.length}/{referenceLimits.videos}
                  </span>
                ) : null}
              </button>
            </div>
            ) : null}

            {/* Reference audio slot (catalog-driven, e.g. Seedance) */}
            {!v2vMode && referenceLimits.audios > 0 && (
              <div className="relative">
                <button
                  type="button"
                  title={
                    referenceAudios.length >= referenceLimits.audios
                      ? `Reference audio (${referenceAudios.length}/${referenceLimits.audios}) — max reached`
                      : `Add reference audio (MP3, WAV) — ${referenceAudios.length}/${referenceLimits.audios}`
                  }
                  aria-label={`Add reference audio, ${referenceAudios.length} of ${referenceLimits.audios} slots used`}
                  onClick={() => {
                    if (referenceAudios.length > 0 && referenceLimits.audios === 1) {
                      clearReferenceAudios();
                      return;
                    }
                    if (referenceAudios.length >= referenceLimits.audios) {
                      alert(`Maximum ${referenceLimits.audios} reference audio file(s).`);
                      return;
                    }
                    openMultimodalPicker("audio");
                  }}
                  className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${
                    referenceAudios.length > 0
                      ? "border-primary/60 bg-primary/5"
                      : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"
                  } group`}
                >
                  {refMultimodalUploading ? (
                    <div className="flex items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : firstRefAudioAsset ? (
                    <MediaPreviewThumb
                      studioId="video"
                      asset={firstRefAudioAsset}
                      kind="audio"
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/40 group-hover:text-primary transition-colors"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  )}
                  {referenceLimits.audios > 1 && referenceAudios.length > 0 ? (
                    <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-black/80 rounded-full text-[8px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                      {referenceAudios.length}/{referenceLimits.audios}
                    </span>
                  ) : null}
                </button>
              </div>
            )}

            {isMultimodalRefMode &&
            (referenceImages.length > 1 ||
              referenceVideos.length > 1 ||
              referenceAudios.length > 1) ? (
              <div className="flex flex-wrap items-center gap-1 max-w-[140px]">
                {referenceImages.slice(1).map((label) => {
                  const asset = isAssetLabel(label) ? getStudioAsset("video", label) : null;
                  return asset ? (
                    <span
                      key={label}
                      className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0"
                      title={label}
                    >
                      <MediaPreviewThumb
                        studioId="video"
                        asset={asset}
                        kind="image"
                        className="w-full h-full"
                      />
                    </span>
                  ) : null;
                })}
                {referenceVideos.slice(1).map((label) => {
                  const asset = isAssetLabel(label) ? getStudioAsset("video", label) : null;
                  return asset ? (
                    <span
                      key={label}
                      className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0"
                      title={label}
                    >
                      <MediaPreviewThumb
                        studioId="video"
                        asset={asset}
                        kind="video"
                        className="w-full h-full"
                      />
                    </span>
                  ) : null;
                })}
                {referenceAudios.slice(1).map((label) => (
                  <span
                    key={label}
                    className="px-1.5 h-5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-primary shrink-0"
                    title={label}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Prompt with @mentions */}
            <MentionPromptField
              inputRef={textareaRef}
              value={prompt}
              onChange={setPrompt}
              assets={mentionAssets}
              placeholder={promptPlaceholder}
              disabled={promptDisabled}
              onInput={handlePromptInput}
              emptyMessage={
                referenceLimits.audios > 0 && referenceAudios.length === 0
                  ? "Upload audio on this card first"
                  : "Upload media on this card first"
              }
              className="w-full bg-transparent border-none text-foreground text-sm placeholder:text-foreground-muted focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40"
            />
          </div>

          {!v2vMode && referenceAudios.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-1 pb-1" role="list" aria-label="Reference audio files">
              {referenceAudios.map((label) => {
                const asset = getStudioAsset("video", label);
                return (
                  <span
                    key={label}
                    role="listitem"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/70"
                  >
                    <span className="text-primary font-mono">@{label}</span>
                    <span className="truncate max-w-[80px]">{asset?.fileName || label}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      className="text-white/40 hover:text-white ml-0.5"
                      onClick={() =>
                        setReferenceAudios((prev) => prev.filter((l) => l !== label))
                      }
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Extend banner */}
          {isExtendMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 mx-3 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary/80 font-medium tracking-tight">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>Extending previous Seedance 2.0 generation</span>
            </div>
          )}

          {/* Bottom row: controls + generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              {/* Model btn */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown("model")}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/10">
                    <span className="text-[9px] font-bold text-black uppercase">
                      V
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-primary transition-colors">
                    {selectedModelName}
                  </span>
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-20 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openDropdown === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-[1.5rem] p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs"
                  >
                    <UnifiedModelDropdown
                      sections={modelSections}
                      selectedModelId={selectedModel}
                      selectedProviderId={selectedModelProvider}
                      onSelect={(m, pid) => handleModelSelect(m, v2vMode, pid)}
                      onClose={() => setOpenDropdown(null)}
                      onOpenApiSettings={onOpenApiSettings}
                      showBrowse={!imageMode && !v2vMode && showRunwareBrowse}
                      browseModels={browseModels}
                      browseLoading={browseLoading}
                      onBrowseSearch={handleBrowseSearch}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio btn */}
              {showAr && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("ar")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-primary transition-colors">
                      {selectedAr}
                    </span>
                  </button>
                  {openDropdown === "ar" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-80 overflow-y-auto custom-scrollbar min-w-[160px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Aspect Ratio
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentAspectRatios(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAr(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity">
                              {r}
                            </span>
                            {selectedAr === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Effect btn */}
              {showEffect && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("effect")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-primary transition-colors max-w-[140px] truncate">
                      {selectedEffect || "Effect"}
                    </span>
                  </button>
                  {openDropdown === "effect" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-80 overflow-y-auto custom-scrollbar min-w-[200px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Effect Type
                      </div>
                      <div className="flex flex-col gap-1">
                        {getEffectsForI2VModel(selectedModel).map((eff) => (
                          <div
                            key={eff}
                            className="flex items-center justify-between p-2 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEffect(eff);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white">
                              {eff}
                            </span>
                            {selectedEffect === eff && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={multimodalRefInputRef}
                type="file"
                className="hidden"
                onChange={handleMultimodalRefPick}
              />

              {getCurrentModel()?.supportsGeneratedAudio ? (
                <StudioToggle
                  checked={generateAudio}
                  onChange={setGenerateAudio}
                  label={CONTROL_STRINGS.audio}
                  statusText={generateAudio ? CONTROL_STRINGS.audioOn : CONTROL_STRINGS.audioOff}
                  ariaLabel="Audio for generated video"
                  className="shrink-0 px-1"
                />
              ) : null}

              {showSeedUi ? (
                <SeedControl value={seedValue} onChange={setSeedValue} className="shrink-0" />
              ) : null}

              {/* Duration btn */}
              {showDuration && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("duration")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs font-semibold text-white/70 group-hover:text-primary transition-colors">
                      {selectedDuration}s
                    </span>
                  </button>
                  {openDropdown === "duration" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[180px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Duration
                      </div>
                      {durationUsesRangeSlider && durationInputSchema ? (
                        <div className="flex flex-col gap-2 px-1 py-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white/70 tabular-nums">
                              {selectedDuration}s
                            </span>
                            <span className="text-[10px] text-white/30 tabular-nums">
                              {durationInputSchema.minValue}–{durationInputSchema.maxValue}s
                            </span>
                          </div>
                          <input
                            type="range"
                            role="slider"
                            aria-valuemin={durationInputSchema.minValue}
                            aria-valuemax={durationInputSchema.maxValue}
                            aria-valuenow={selectedDuration}
                            aria-label="Video duration in seconds"
                            min={durationInputSchema.minValue}
                            max={durationInputSchema.maxValue}
                            step={durationInputSchema.step ?? 1}
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {getCurrentDurations(selectedModel).map((d) => (
                            <div
                              key={d}
                              className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group/opt"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDuration(d);
                                setOpenDropdown(null);
                              }}
                            >
                              <span className="text-xs font-semibold text-white/70 group-hover/opt:text-white">
                                {d}s
                              </span>
                              {selectedDuration === d && <CheckSvg />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Resolution btn */}
              {showResolution && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("resolution")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-primary transition-colors">
                      {selectedResolution || "720p"}
                    </span>
                  </button>
                  {openDropdown === "resolution" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/[0.05] min-w-[140px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Resolution
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentResolutions(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResolution(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white">
                              {r}
                            </span>
                            {selectedResolution === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
              {lastChargedUsd != null ? (
                <span className="text-[10px] text-foreground-muted" dir="ltr">
                  Last charged: {formatCostUsd(lastChargedUsd)}
                </span>
              ) : null}
              <GenerateCostButton
                onClick={handleGenerate}
                disabled={generating}
                generating={generating}
                generateError={generateError}
                unitCostUsd={unitCostUsd}
                source={costSource}
                isLoadingCost={isLoadingCost}
                className="bg-primary text-black px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 w-full sm:w-auto min-w-[100px] shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ FULLSCREEN VIDEO MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {detailEntry ? (
        <GenerationDetailViewer
          entry={detailEntry}
          mediaType="video"
          onClose={() => setDetailEntry(null)}
          onDownload={(e) => e.url && downloadFile(e.url, `video-${e.id || "out"}.mp4`)}
          providerLabel={providerDisplayLabel}
          extraActions={
            detailEntry.model === "seedance-v2.0-t2v" ||
            detailEntry.model === "rw-seedance-2-fast" ? (
              <button
                type="button"
                onClick={() => {
                  setLastGenerationId(detailEntry.id);
                  handleExtend();
                  setDetailEntry(null);
                }}
                className="w-full py-2 rounded-md border border-white/15 text-white/80 text-sm hover:bg-white/5"
              >
                Extend video
              </button>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}
