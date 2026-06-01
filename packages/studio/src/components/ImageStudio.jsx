"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { generateI2IForStudio, stageFileForStudio, generateImageForStudio } from "../studioGenerate.js";
import { formatRunwareErrorForStudio } from "../providers/runware.js";
import MediaPreviewThumb from "./media/MediaPreviewThumb.jsx";
import MentionPromptField from "./media/MentionPromptField.jsx";
import {
  assetsToManifest,
  restoreAssetsForRecreate,
  isStudioAssetRestored,
  manifestFromAssetLabels,
} from "../media/studioAssetPersist.js";
import {
  clearStudioRegistry,
  getStudioAsset,
  removeStudioAsset,
} from "../media/studioAssetRegistry.js";
import {
  cardMentionAssets,
  extractCardLabels,
  stripMentionsFromPrompt,
} from "../media/cardMentionAssets.js";
import { isAssetLabel } from "../media/previewSrc.js";
import { useStudioGenerationCost } from "../cost/useStudioGenerationCost.js";
import GenerateCostButton from "./GenerateCostButton.jsx";
import BatchSizeStepper from "./BatchSizeStepper.jsx";
import TierOptionDropdown, { formatTierChipLabel } from "./TierOptionDropdown.jsx";
import ModelInputChipRow from "./ModelInputChipRow.jsx";
import { formatCostUsd } from "../cost/formatGenerateLabel.js";

/** @param {unknown} ref */
function uploadEntryFromRef(ref) {
  if (!ref) return null;
  if (typeof ref === "string") {
    if (isAssetLabel(ref)) {
      const a = getStudioAsset("image", ref);
      return {
        label: ref,
        url: a?.thumbUrl || "",
        previewUrl: a?.previewUrl || "",
      };
    }
    return { url: ref, previewUrl: ref };
  }
  if (typeof ref === "object") {
    const label =
      typeof ref.label === "string"
        ? ref.label
        : isAssetLabel(ref.url)
          ? ref.url
          : null;
    if (label) {
      const a = getStudioAsset("image", label);
      const legacyBlob =
        typeof ref.url === "string" && ref.url.startsWith("blob:") ? ref.url : "";
      return {
        label,
        url: a?.thumbUrl || legacyBlob,
        previewUrl: a?.previewUrl || ref.previewUrl || legacyBlob,
      };
    }
    if (typeof ref.url === "string") {
      return {
        url: ref.url,
        previewUrl: typeof ref.previewUrl === "string" ? ref.previewUrl : ref.url,
        label: typeof ref.label === "string" ? ref.label : undefined,
      };
    }
  }
  return null;
}
import { resolveProviderForOp, providerDisplayLabel } from "../studioCloud.js";
import { buildRoutingContext } from "../studioProps.js";
import { getStudioOpAvailability } from "../studioOpAvailability.js";
import {
  getT2iModelsForProvider,
  getT2iModelById,
  getModelByIdForStudio,
  getUnifiedModelSections,
  flattenModelSections,
  getAspectRatiosForT2iModel,
  getAspectRatiosForI2iModel,
  getResolutionsForT2iModel,
  getResolutionsForI2iModel,
  getQualityFieldForT2iModel,
  getQualityFieldForI2iModel,
  getQualityOptionsForT2iModel,
  getQualityEnumOptionsForT2iModel,
  getResolutionTierOptionsForT2iModel,
  getModelInputOptionsForField,
  modelHasT2iQualityInput,
  modelHasT2iResolutionInput,
  getModelInputDefault,
  clampModelInputSelection,
  getEffectsForModelRegistry,
  getDefaultEffectForModelRegistry,
  getMaxImagesForI2IModel,
} from "../modelRegistry.js";
import { loadModelPick, saveModelPick } from "../modelPickerPersist.js";
import UnifiedModelDropdown from "./UnifiedModelDropdown.jsx";
import { i2iModels } from "../models.js";
import { isTierResolutionOptions } from "../schemaWidgetUtils.js";
import { useOptimisticGenerationHistory } from "../hooks/useOptimisticGenerationHistory.js";
import GenerationHistoryCard from "./GenerationHistoryCard.jsx";
import GenerationDetailViewer from "./GenerationDetailViewer.jsx";
import CatalogInputChips from "./CatalogInputChips.jsx";
import {
  buildGenerationSnapshot,
  subscribeStudioRecreate,
  subscribeStudioRetry,
} from "../studioRecreate.js";
import { CONTROL_STRINGS } from "../lib/controlStrings.js";
import SeedControl from "./SeedControl.jsx";
import {
  modelSupportsSeed,
  seedForSnapshot,
  seedsForBatch,
  applySeedToParams,
  usedSeedFromResponse,
  advanceSeed,
  snapshotWithCardSeed,
} from "../lib/seedControl.js";
import { STUDIO_PERSIST_MAX_BYTES } from "../media/studioPersistSafety.js";

// fork: theme-aware prompt composer (studio-theme.css component classes)
const PROMPT_CHIP =
  "flex items-center gap-2 px-3 py-2 studio-control rounded-md transition-all group whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const PROMPT_CHIP_LABEL_SM =
  "text-[11px] font-semibold text-foreground-secondary group-hover:text-primary transition-colors";
const PROMPT_CHIP_LABEL =
  "text-xs font-semibold text-foreground-secondary group-hover:text-primary transition-colors";
const PROMPT_POPOVER =
  "absolute bottom-[calc(100%+12px)] left-0 z-50 studio-popover rounded-lg p-3 shadow-2xl custom-scrollbar";
const PROMPT_ICON = "opacity-40 text-foreground-muted group-hover:opacity-100";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function downloadImage(url, filename) {
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ UploadButton (inline picker) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * @param {{
 *   routing: ReturnType<typeof buildRoutingContext>,
 *   apiKey?: string,
 *   maxImages: number,
 *   onSelect: (payload: { url: string, urls: string[], thumbnail: string }) => void,
 *   onClear?: () => void,
 *   initialUrls?: string[],
 * }} props
 */
const STAGE_UPLOAD_TIMEOUT_MS = 45_000;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function UploadButton({ routing, apiKey, maxImages, onSelect, onClear, initialUrls = [] }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState([]); // [{id, name, url, thumbnail}]
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  /** @type {import('react').MutableRefObject<Set<string>>} */
  const cancelledUploadIdsRef = useRef(new Set());

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      // Avoid infinite loops by only updating if URLs actually changed
      const currentKeys = selectedEntries.map((e) => e.label || e.url);
      const isSame =
        initialUrls.length === currentKeys.length &&
        initialUrls.every((u) => currentKeys.includes(u));
      if (isSame) return;

      const newEntries = initialUrls
        .map((ref) => uploadEntryFromRef(ref))
        .filter(Boolean);
      if (newEntries.length) setSelectedEntries(newEntries);

      setUploadHistory((prev) => {
        const existingKeys = new Set(
          prev.map((h) => h.label || h.url).filter(Boolean),
        );
        const missing = initialUrls
          .map((ref) => uploadEntryFromRef(ref))
          .filter((e) => e && !existingKeys.has(e.label || e.url))
          .map((e) => {
            const thumb = e.url || e.previewUrl || null;
            return {
              id: `restored-${e.label || e.url}`,
              name: "Restored Image",
              url: thumb,
              label: e.label,
              progress: thumb ? 100 : 0,
              status: thumb ? "ready" : "failed",
            };
          });
        return missing.length ? [...missing, ...prev] : prev;
      });
    }
  }, [initialUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleParentClear = useCallback(() => {
    if (!onClear) return;
    queueMicrotask(() => onClear());
  }, [onClear]);

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) scheduleParentClear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages, selectedEntries.length, scheduleParentClear]);

  useEffect(() => {
    const pending = uploadHistory.some((h) => h.status === "uploading" && !h.url);
    if (!pending && uploading) {
      setUploading(false);
      setLastUploadProgress(0);
    }
  }, [uploadHistory, uploading]);

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const labels = entries.map((e) => e.label || e.url);
      onSelect({
        url: labels[0],
        urls: labels,
        thumbnail: entries[0].url,
      });
    },
    [onSelect],
  );

  const removeHistoryEntry = useCallback(
    (entry) => {
      cancelledUploadIdsRef.current.add(entry.id);
      if (entry.label) removeStudioAsset("image", entry.label);
      if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);

      setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));

      let shouldClearParent = false;
      setSelectedEntries((prev) => {
        const next = prev.filter((s) => {
          if (entry.label && s.label) return s.label !== entry.label;
          if (entry.url && s.url) return s.url !== entry.url;
          return true;
        });
        if (next.length === 0) shouldClearParent = true;
        return next;
      });
      if (shouldClearParent) scheduleParentClear();
    },
    [scheduleParentClear],
  );

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `The following images are too large (max 10MB): ${tooLarge.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setUploading(true);
    try {
      const toUpload =
        maxImages === 1
          ? files.slice(0, 1)
          : files.slice(0, maxImages - selectedEntries.length || 1);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();
          cancelledUploadIdsRef.current.delete(id);

          const placeholder = {
            id,
            name: file.name,
            url: null,
            progress: 0,
            status: "uploading",
          };
          setUploadHistory((prev) => [placeholder, ...prev]);

          try {
            const asset = await withTimeout(
              stageFileForStudio("image", file),
              STAGE_UPLOAD_TIMEOUT_MS,
              "Image staging timed out. Cancel and try again.",
            );

            if (cancelledUploadIdsRef.current.has(id)) return;

            setLastUploadProgress(100);
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return {
                    ...h,
                    url: asset.thumbUrl,
                    label: asset.label,
                    progress: 100,
                    status: "ready",
                  };
                }
                return h;
              }),
            );

            if (selectedEntries.length < maxImages) {
              const newEntry = {
                url: asset.thumbUrl,
                label: asset.label,
                previewUrl: asset.previewUrl,
              };
              setSelectedEntries((prev) => [...prev, newEntry]);

              if (maxImages === 1) {
                fireOnSelect([newEntry]);
                setPanelOpen(false);
              }
            }
          } catch (err) {
            if (cancelledUploadIdsRef.current.has(id)) return;
            console.error("[UploadButton] Upload failed for", file.name, err);
            setUploadHistory((prev) =>
              prev.map((h) =>
                h.id === id
                  ? {
                      ...h,
                      status: "failed",
                      progress: 0,
                      error: err?.message || "Upload failed",
                    }
                  : h,
              ),
            );
          }
        }),
      );
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
    }
  };

  const handleCellClick = (entry) => {
    if (!entry.url) return;
    const selIdx = selectedEntries.findIndex(
      (e) =>
        (entry.label && e.label === entry.label) ||
        (entry.url && e.url === entry.url),
    );
    const isSelected = selIdx !== -1;
    const atMax =
      maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) scheduleParentClear();
      } else {
        next = [
          ...selectedEntries,
          { url: entry.url, localUrl: entry.localUrl },
        ];
      }
      setSelectedEntries(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    removeHistoryEntry(entry);
  };

  const handleDone = (e) => {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern Ã¢â‚¬â€ parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  let triggerContent;
  if (hasSelection || uploading) {
    const mainEntry = selectedEntries[0] || uploadHistory[0];
    const canAddMore = isMulti && count < maxImages;
    let badge;
    if (uploading && !hasSelection) {
      badge = (
        <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-foreground-muted"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * lastUploadProgress) / 100}
              className="text-primary transition-all duration-300"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-primary leading-none">
            {lastUploadProgress}%
          </span>
        </div>
      );
    } else if (count > 1) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <span className="text-[9px] font-black text-black leading-none">
            {count}
          </span>
        </div>
      );
    } else if (canAddMore) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60">
          <span className="text-[9px] font-black text-black leading-none">
            +
          </span>
        </div>
      );
    } else {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    triggerContent = (
      <>
        {uploading && hasSelection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
            <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {count > 1 ? (
          <div className="relative w-full h-full p-1.5 flex items-center justify-center">
            {/* Bottom Image */}
            {selectedEntries[1]?.url && (
              <div className="absolute top-1 left-1 w-6 h-6 rounded-md border border-black/40 overflow-hidden shadow-lg rotate-[-8deg] translate-x-[-1px] translate-y-[-1px]">
                <img
                  src={selectedEntries[1].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Top Image */}
            {selectedEntries[0]?.url && (
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-sm border-[1.5px] border-black/60 overflow-hidden shadow-2xl z-10 rotate-[4deg] translate-x-[1px] translate-y-[1px]">
                <img
                  src={selectedEntries[0].url}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    uploading && hasSelection ? "blur-[2px] opacity-60" : "opacity-100"
                  }`}
                />
              </div>
            )}
          </div>
        ) : mainEntry?.url || mainEntry?.label ? (
          <MediaPreviewThumb
            studioId="image"
            asset={mainEntry.label ? getStudioAsset("image", mainEntry.label) : undefined}
            url={mainEntry.url || mainEntry.label}
            kind="image"
            className={`w-full h-full transition-all duration-300 ${
              uploading && hasSelection ? "blur-[2px] scale-110 opacity-60" : "blur-0 scale-100 opacity-100"
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse">
            <div className="w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {!uploading && badge}
      </>
    );
  } else {
    triggerContent = (
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
    );
  }

  const triggerTitle = hasSelection
    ? count > 1
      ? `${count} of ${maxImages} images selected Ã¢â‚¬â€ click to manage`
      : isMulti
        ? `1 image selected Ã¢â‚¬â€ click to add more (up to ${maxImages})`
        : "Reference image"
    : isMulti
      ? `Add up to ${maxImages} images`
      : "Reference image";

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden mt-1.5 studio-control group ${
          hasSelection
            ? "border-primary/60 hover:border-primary/40"
            : "border-border-subtle hover:border-primary/40"
        }`}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-[calc(100%+8px)] left-0 studio-popover rounded-xl p-3 w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-border-subtle">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-secondary">
                Reference Images
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  Select up to {maxImages} images
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  Ã¢Å“â€œ Done ({count})
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "Upload files" : "Upload new"}
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">No uploads yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const isPending = entry.status === "uploading" && !entry.url;
                const isFailed = entry.status === "failed";
                const selIdx = selectedEntries.findIndex(
                  (e) =>
                    (entry.label && e.label === entry.label) ||
                    (entry.url && e.url === entry.url),
                );
                const isSelected = selIdx !== -1 && Boolean(entry.url);
                const atMax =
                  isMulti && !isSelected && selectedEntries.length >= maxImages;

                return (
                  <div
                    key={entry.id}
                    title={
                      isFailed
                        ? entry.error || "Upload failed — remove to retry"
                        : entry.name
                    }
                    onClick={() => entry.url && handleCellClick(entry)}
                    className={`relative rounded-xl overflow-hidden border-2 group/cell aspect-square transition-all ${
                      isSelected
                        ? "border-primary shadow-glow cursor-pointer"
                        : isFailed
                          ? "border-red-500/50 cursor-default"
                          : "border-border-subtle hover:border-foreground-muted"
                    } ${atMax ? "opacity-40 cursor-not-allowed" : ""} ${isPending ? "cursor-default" : entry.url ? "cursor-pointer" : ""}`}
                  >
                    {entry.url ? (
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isFailed ? (
                      <div className="w-full h-full bg-card-bg flex flex-col items-center justify-center gap-1 px-1 text-center">
                        <span className="text-[9px] font-bold text-red-400 leading-tight">
                          Failed
                        </span>
                        <span className="text-[8px] text-muted line-clamp-2">
                          {entry.error || "Upload error"}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-card-bg flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1" />
                        <span className="text-[10px] font-black text-primary">
                          {isPending ? "…" : `${entry.progress}%`}
                        </span>
                      </div>
                    )}

                    {/* Remove / cancel — always visible (including stuck uploads) */}
                    <div
                      className={`absolute top-1 right-1 z-10 flex items-center gap-1 ${
                        entry.url
                          ? "opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100"
                          : "opacity-100"
                      } transition-opacity`}
                    >
                      {isPending && (
                        <span className="text-[8px] font-bold text-white/90 bg-black/70 px-1 rounded">
                          Cancel
                        </span>
                      )}
                      <button
                        type="button"
                        title={
                          isPending
                            ? "Cancel upload and remove"
                            : "Remove from history"
                        }
                        onClick={(e) => handleRemoveFromHistory(e, entry)}
                        className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-md flex items-center justify-center transition-colors shadow-md"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    {/* Selection badge */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1">
                        {isMulti ? (
                          <span className="text-[10px] font-black text-black">
                            {selIdx + 1}
                          </span>
                        ) : (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom bar for multi-select */}
          {isMulti && hasSelection && (
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs text-secondary">
                {count} of {maxImages} selected
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
              >
                Use Selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ModelDropdown Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ModelDropdown({ models, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2 h-full max-h-[60vh]">
      <div className="border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3 bg-card-bg rounded-xl px-4 py-2.5 border border-border-subtle focus-within:border-primary/50 transition-colors">
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
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-foreground focus:ring-0 w-full p-0 focus:outline-none placeholder:text-foreground-muted"
          />
        </div>
      </div>
      <div className="text-xs font-medium text-secondary py-2 shrink-0">
        Available models
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m);
              onClose();
            }}
            className={`flex items-center justify-between p-3.5 hover:bg-card-bg rounded-lg cursor-pointer transition-all border border-transparent hover:border-border-subtle ${
              selectedModel === m.id ? "bg-card-bg border-border-subtle" : ""
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 ${
                  m.family === "kontext"
                    ? "bg-blue-500/10 text-blue-400"
                    : m.family === "effects"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-primary/10 text-primary"
                } border border-border-subtle rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase`}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground tracking-tight">
                  {m.name}
                </span>
              </div>
            </div>
            {selectedModel === m.id && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SimpleDropdown Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function SimpleDropdown({ title, options, selected, onSelect, onClose }) {
  return (
    <>
      <div className="text-xs font-medium text-foreground-muted pb-2 border-b border-border-subtle mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
            className="flex items-center justify-between p-2 hover:bg-card-bg rounded-md cursor-pointer transition-all group"
          >
            <span className="text-xs font-bold text-foreground-secondary group-hover:text-foreground">
              {opt}
            </span>
            {selected === opt && (
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
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function ImageStudio({
  apiKey,
  muapiKey,
  runwareApiKey = "",
  cloudProvider = "muapi",
  routingPrefs,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
  onOpenApiSettings,
}) {
  const PERSIST_KEY = "hg_image_studio_persistent";
  const baseRouting = buildRoutingContext({
    apiKey,
    muapiKey: muapiKey ?? apiKey,
    runwareApiKey,
    routingPrefs,
  });
  const defaultResolved = useMemo(
    () => resolveProviderForOp("image", "imageT2i", baseRouting),
    [
      baseRouting.routingMode,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      baseRouting.allowMuapiFallback,
      routingPrefs?.perStudioRouting,
    ],
  );
  const defaultProviderId = defaultResolved.providerId;

  const [imageMode, setImageMode] = useState(false); // false=t2i, true=i2i
  const [selectedModelProvider, setSelectedModelProvider] = useState(defaultProviderId);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [selectedAr, setSelectedAr] = useState("1:1");
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedResolutionTier, setSelectedResolutionTier] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState("");
  const [maxImages, setMaxImages] = useState(1);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Prompt / upload state Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [prompt, setPrompt] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ UI state Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'model' | 'ar' | 'quality' | 'resolution' | null
  const [generating, setGenerating] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("");
  const [generateError, setGenerateError] = useState(null);
  const [lastChargedUsd, setLastChargedUsd] = useState(/** @type {number | null} */ (null));
  const [detailEntry, setDetailEntry] = useState(/** @type {object | null} */ (null));

  // Ã¢â€â‚¬Ã¢â€â‚¬ Canvas / history state Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [batchSize, setBatchSize] = useState(1);
  const [seedValue, setSeedValue] = useState(/** @type {number | null} */ (null));
  const {
    history: localHistory,
    setHistory: setLocalHistory,
    prependPending,
    resolvePending,
    failPending,
    retryPending,
  } = useOptimisticGenerationHistory([]);

  const [extraControls, setExtraControls] = useState(/** @type {Record<string, unknown>} */ ({}));
  const [recreateRefWarning, setRecreateRefWarning] = useState(null);

  const history = historyItems ?? localHistory;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Refs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const dropdownRef = useRef(null);
  const uploadPickerResetRef = useRef(null); // not used directly Ã¢â‚¬â€ managed via key

  // Ã¢â€â‚¬Ã¢â€â‚¬ Close dropdown on outside click Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  const applyDefaultT2iSelection = useCallback(
    (provider) => {
      const models = getT2iModelsForProvider(provider);
      const first = models[0];
      if (!first) return;
      const ars = getAspectRatiosForT2iModel(first.id, provider);
      const hasQ = modelHasT2iQualityInput(first.id, provider);
      const hasR = modelHasT2iResolutionInput(first.id, provider);
      const qualityOpts = hasQ ? getQualityEnumOptionsForT2iModel(first.id, provider) : [];
      const resOpts = hasR ? getResolutionTierOptionsForT2iModel(first.id, provider) : getResolutionsForT2iModel(first.id, provider);
      const qualityDefault = hasQ
        ? getModelInputDefault(first.id, 'quality', provider, 't2i')
        : null;
      const resDefault = hasR
        ? getModelInputDefault(first.id, 'resolution', provider, 't2i')
        : getModelInputDefault(
            first.id,
            getQualityFieldForT2iModel(first.id, provider) || 'resolution',
            provider,
            't2i',
          );
      setImageMode(false);
      setSelectedModelProvider(provider);
      setSelectedModelId(first.id);
      setSelectedModelName(first.name);
      setSelectedAr(getModelInputDefault(first.id, 'aspect_ratio', provider, 't2i') || ars[0] || "1:1");
      setSelectedQuality(
        hasQ
          ? clampModelInputSelection(null, qualityOpts, qualityDefault || qualityOpts[0] || null)
          : hasR
            ? null
            : resDefault || resOpts[0] || null,
      );
      setSelectedResolutionTier(
        hasR ? clampModelInputSelection(null, resOpts, resDefault || resOpts[0] || null) : null,
      );
      setSelectedEffect("");
      setMaxImages(1);
      setUploadedImageUrls([]);
      saveModelPick("image", { v: 1, modelId: first.id, providerId: provider });
    },
    [],
  );

  const providerSwitchReady = useRef(false);
  const prevRoutingPrefsKeyRef = useRef(/** @type {string | null} */ (null));
  const routingPrefsKey = JSON.stringify(routingPrefs || {});

  const modelSections = useMemo(() => {
    const sections = getUnifiedModelSections("image", {
      routingMode: baseRouting.routingMode,
      allowMuapiFallback: baseRouting.allowMuapiFallback,
      muapiKey: baseRouting.muapiKey,
      runwareApiKey: baseRouting.runwareApiKey,
      catalogMode: imageMode ? "i2i" : "t2i",
    });
    return sections;
  }, [
      baseRouting.routingMode,
      baseRouting.allowMuapiFallback,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      imageMode,
      routingPrefsKey,
    ],
  );

  const generationRouting = useMemo(
    () =>
      buildRoutingContext({
        apiKey,
        muapiKey: muapiKey ?? apiKey,
        runwareApiKey,
        routingPrefs,
        providerOverride: imageMode ? undefined : selectedModelProvider,
      }),
    [
      apiKey,
      muapiKey,
      runwareApiKey,
      routingPrefsKey,
      selectedModelProvider,
      imageMode,
    ],
  );

  const genResolved = useMemo(
    () =>
      resolveProviderForOp(
        "image",
        imageMode ? "imageI2i" : "imageT2i",
        generationRouting,
      ),
    [generationRouting, imageMode],
  );

  const catalogProvider = selectedModelProvider || defaultProviderId;

  const uploadAvail = useMemo(
    () => getStudioOpAvailability("image", "upload", baseRouting),
    [
      baseRouting.routingMode,
      baseRouting.muapiKey,
      baseRouting.runwareApiKey,
      baseRouting.allowMuapiFallback,
      routingPrefsKey,
    ],
  );

  const i2iAvail = useMemo(
    () => getStudioOpAvailability("image", "imageI2i", generationRouting),
    [generationRouting],
  );

  const providerPreviewLabel = genResolved.blockReason
    ? genResolved.blockReason === "missing_key"
      ? "Add the required API key in API Settings"
      : "Not available on the selected provider"
    : `Will run via ${providerDisplayLabel(genResolved.providerId)}${genResolved.usedFallback ? " (fallback)" : ""}`;

  const imageGenOp = imageMode ? "imageI2i" : "imageT2i";
  const imageCatalogMode = imageMode ? "i2i" : "t2i";
  const showSeedUi = modelSupportsSeed(selectedModelId, catalogProvider, imageCatalogMode);

  // Reset selection only when routing prefs change — not on first hydrate after persist load
  useEffect(() => {
    if (!providerSwitchReady.current) return;
    if (prevRoutingPrefsKeyRef.current === null) {
      prevRoutingPrefsKeyRef.current = routingPrefsKey;
      return;
    }
    if (prevRoutingPrefsKeyRef.current === routingPrefsKey) return;
    prevRoutingPrefsKeyRef.current = routingPrefsKey;
    applyDefaultT2iSelection(defaultProviderId);
  }, [routingPrefsKey, defaultProviderId, applyDefaultT2iSelection]);

  // Persistence load — deferred so first paint stays interactive (H2: sync getItem/parse froze tab)
  useEffect(() => {
    providerSwitchReady.current = true;
    let cancelled = false;
    const hydrate = () => {
      if (cancelled) return;
      try {
        const stored = localStorage.getItem(PERSIST_KEY);
        if (stored) {
          if (stored.length > STUDIO_PERSIST_MAX_BYTES) {
            console.warn("[ImageStudio] Persist too large; cleared.", stored.length);
            localStorage.removeItem(PERSIST_KEY);
          } else {
            const data = JSON.parse(stored);
            if (data.imageMode !== undefined) setImageMode(!!data.imageMode);
            if (data.prompt) setPrompt(data.prompt);
            if (data.batchSize) setBatchSize(data.batchSize);
            if (data.seedValue != null) setSeedValue(data.seedValue);
            if (data.localHistory) {
              setLocalHistory(
                Array.isArray(data.localHistory)
                  ? data.localHistory.slice(0, 20)
                  : data.localHistory,
              );
            }
            if (data.uploadedImageUrls) {
              setUploadedImageUrls(data.uploadedImageUrls);
            }
            const pick = loadModelPick("image");
            const pickProvider = pick?.providerId || defaultProviderId;
            const pickModel =
              pick && getModelByIdForStudio(pick.modelId, "image", pickProvider);
            if (pickModel) {
              setSelectedModelProvider(pickProvider);
              setSelectedModelId(pick.modelId);
              setSelectedModelName(pickModel.name || pick.modelId);
              if (data.selectedAr) setSelectedAr(data.selectedAr);
              if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
              if (data.selectedResolutionTier) {
                setSelectedResolutionTier(data.selectedResolutionTier);
              }
              if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
              if (data.maxImages) setMaxImages(data.maxImages);
            } else if (
              data.selectedModelId &&
              getModelByIdForStudio(data.selectedModelId, "image", pickProvider)
            ) {
              setSelectedModelProvider(pickProvider);
              setSelectedModelId(data.selectedModelId);
              if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
              if (data.selectedAr) setSelectedAr(data.selectedAr);
              if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
              if (data.selectedResolutionTier) {
                setSelectedResolutionTier(data.selectedResolutionTier);
              }
              if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
              if (data.maxImages) setMaxImages(data.maxImages);
            }
          }
        } else {
          const pick = loadModelPick("image");
          if (pick && getModelByIdForStudio(pick.modelId, "image", pick.providerId)) {
            const m = getModelByIdForStudio(pick.modelId, "image", pick.providerId);
            setSelectedModelProvider(pick.providerId);
            setSelectedModelId(pick.modelId);
            setSelectedModelName(m.name || pick.modelId);
          } else {
            applyDefaultT2iSelection(defaultProviderId);
          }
        }
      } catch (err) {
        console.warn("Failed to load ImageStudio persistence:", err);
        try {
          localStorage.removeItem(PERSIST_KEY);
        } catch {
          /* ignore */
        }
      }
    };
    const id = setTimeout(hydrate, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Adjust height on load Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Ã¢â€â‚¬Ã¢â€â‚¬ Persistence: Save Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          selectedModelId,
          selectedModelName,
          selectedAr,
          selectedQuality,
          selectedResolutionTier,
          selectedEffect,
          maxImages,
          prompt,
          uploadedImageUrls,
          batchSize,
          seedValue,
          localHistory: localHistory
            .filter((e) => e.status === "ready" && e.url)
            .slice(0, 20)
            .map((e) => ({
              status: e.status,
              id: e.id,
              url: e.url,
              prompt: e.prompt ? String(e.prompt).slice(0, 500) : undefined,
              model: e.model,
              providerId: e.providerId,
              aspect_ratio: e.aspect_ratio,
              snapshot: e.snapshot,
            })),
        };
        const json = JSON.stringify(state);
        if (json.length <= STUDIO_PERSIST_MAX_BYTES) {
          localStorage.setItem(PERSIST_KEY, json);
        }
      } catch (err) {
        console.warn("Failed to save ImageStudio persistence:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    imageMode,
    selectedModelId,
    selectedModelName,
    selectedAr,
    selectedQuality,
    selectedResolutionTier,
    selectedEffect,
    maxImages,
    prompt,
    uploadedImageUrls,
    batchSize,
    seedValue,
    localHistory,
  ]);

  useEffect(() => {
    if (!uploadedImageUrls.length) return undefined;
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(PERSIST_KEY);
        const prev = stored ? JSON.parse(stored) : {};
        const assetManifest = assetsToManifest(
          uploadedImageUrls.map((l) => getStudioAsset("image", l)).filter(Boolean),
        );
        localStorage.setItem(
          PERSIST_KEY,
          JSON.stringify({ ...prev, assetManifest }),
        );
      } catch (err) {
        console.warn("Failed to save ImageStudio asset manifest:", err);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [uploadedImageUrls]);

  const processDroppedImages = async (files) => {
    if (!uploadAvail.canRun) {
      alert(uploadAvail.message);
      return;
    }
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `The following images are too large (max 10MB): ${tooLarge.map((f) => f.name).join(", ")}`
      );
      return;
    }

    setGenerating(true); // Show as generating/busy
    try {
      const toUpload =
        maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages);
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          try {
            const asset = await stageFileForStudio("image", file);
            return asset.label;
          } catch (err) {
            console.error(
              "[ImageStudio] Drop upload failed for",
              file.name,
              err
            );
            throw err;
          }
        })
      );

      handleUploadSelect({ urls });
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Handle Dropped Files Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processDroppedImages(imageFiles);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImages]);

  const t2iKeyMissing =
    genResolved.blockReason === "missing_key" && genResolved.providerId === "runware";

  // Ã¢â€â‚¬Ã¢â€â‚¬ Derived: current model lists & helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const currentModels = imageMode ? flattenModelSections(modelSections) : [];
  const currentAspectRatios = imageMode
    ? getAspectRatiosForI2iModel(selectedModelId, catalogProvider)
    : getAspectRatiosForT2iModel(selectedModelId, catalogProvider);
  const hasT2iQualityInput =
    !imageMode && modelHasT2iQualityInput(selectedModelId, catalogProvider);
  const hasT2iResolutionInput =
    !imageMode && modelHasT2iResolutionInput(selectedModelId, catalogProvider);
  const resolutionOptionsResolved = getModelInputOptionsForField(
    selectedModelId,
    "resolution",
    catalogProvider,
    imageCatalogMode,
  );
  const useTierResolutionUi = isTierResolutionOptions(resolutionOptionsResolved);
  const qualityEnumOptions = hasT2iQualityInput
    ? getQualityEnumOptionsForT2iModel(selectedModelId, catalogProvider)
    : [];
  const resolutionTierOptions = useTierResolutionUi
    ? resolutionOptionsResolved
    : hasT2iResolutionInput
      ? getResolutionTierOptionsForT2iModel(selectedModelId, catalogProvider)
      : imageMode
        ? resolutionOptionsResolved
        : [];
  const currentQualityOptions = imageMode
    ? useTierResolutionUi
      ? []
      : getResolutionsForI2iModel(selectedModelId, catalogProvider)
    : hasT2iQualityInput || useTierResolutionUi
      ? []
      : getQualityOptionsForT2iModel(selectedModelId, catalogProvider);
  const currentQualityField = imageMode
    ? getQualityFieldForI2iModel(selectedModelId, catalogProvider)
    : getQualityFieldForT2iModel(selectedModelId, catalogProvider);
  const showQualityChip = qualityEnumOptions.length > 0;
  const showResolutionChip =
    useTierResolutionUi ||
    resolutionTierOptions.length > 0 ||
    (!hasT2iQualityInput && currentQualityOptions.length > 0);
  const showLegacySingleChip =
    !imageMode && !showQualityChip && !useTierResolutionUi && !hasT2iResolutionInput && currentQualityOptions.length > 0;
  const legacyResolutionOptions = showLegacySingleChip ? currentQualityOptions : resolutionTierOptions;
  const currentEffects = imageMode
    ? getEffectsForModelRegistry(selectedModelId, catalogProvider, 'i2i')
    : [];
  const showEffectBtn = currentEffects.length > 0;

  const costPayload = useMemo(() => {
    const base = { model: selectedModelId, aspect_ratio: selectedAr };
    if (showQualityChip && selectedQuality) base.quality = selectedQuality;
    if (useTierResolutionUi && selectedResolutionTier) {
      base.resolution = selectedResolutionTier;
    } else if (hasT2iResolutionInput && selectedResolutionTier) {
      base.resolution = selectedResolutionTier;
    } else if (showLegacySingleChip && selectedQuality && currentQualityField) {
      base[currentQualityField] = selectedQuality;
    }
    if (imageMode) {
      return {
        ...base,
        images_list: uploadedImageUrls,
        image_url: uploadedImageUrls[0],
        ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
      };
    }
    return {
      ...base,
      prompt: prompt.trim(),
    };
  }, [
    imageMode,
    selectedModelId,
    selectedAr,
    prompt,
    uploadedImageUrls,
    showQualityChip,
    selectedQuality,
    useTierResolutionUi,
    hasT2iResolutionInput,
    selectedResolutionTier,
    showLegacySingleChip,
    currentQualityField,
  ]);

  const { unitCostUsd, source: costSource, isLoadingCost } = useStudioGenerationCost({
    studioId: "image",
    op: imageGenOp,
    routing: generationRouting,
    modelId: selectedModelId,
    providerId: selectedModelProvider || catalogProvider,
    catalogMode: imageCatalogMode,
    payload: costPayload,
    enabled: Boolean(selectedModelId) && !generating,
  });

  const mentionAssets = useMemo(
    () => cardMentionAssets("image", uploadedImageUrls),
    [uploadedImageUrls],
  );

  const cardLabels = useMemo(
    () => extractCardLabels(uploadedImageUrls),
    [uploadedImageUrls],
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Upload picker callbacks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleUploadSelect = useCallback(
    ({ url, urls }) => {
      const newUrls = urls || [url];
      setUploadedImageUrls(newUrls);

      if (!imageMode && i2iAvail.canRun) {
        const firstI2I = i2iModels[0];
        const ars = getAspectRatiosForI2iModel(firstI2I.id, defaultProviderId);
        const resolutions = getResolutionsForI2iModel(firstI2I.id, defaultProviderId);
        const effects = getEffectsForModelRegistry(firstI2I.id, defaultProviderId, 'i2i');
        setImageMode(true);
        setSelectedModelId(firstI2I.id);
        setSelectedModelName(firstI2I.name);
        setSelectedAr(getModelInputDefault(firstI2I.id, 'aspect_ratio', defaultProviderId, 'i2i') || ars[0] || "1:1");
        setSelectedQuality(resolutions[0] || null);
        setSelectedEffect(effects.length > 0 ? (getDefaultEffectForModelRegistry(firstI2I.id, defaultProviderId, 'i2i') || effects[0]) : "");
        setMaxImages(getMaxImagesForI2IModel(firstI2I.id, defaultProviderId));
      }
    },
    [imageMode, i2iAvail.canRun],
  );

  const handleUploadClear = useCallback(() => {
    setUploadedImageUrls([]);
    clearStudioRegistry("image");
    applyDefaultT2iSelection(defaultProviderId);
  }, [applyDefaultT2iSelection, defaultProviderId]);

  const handleModelSelect = (m, providerId = "muapi") => {
    const mode = imageMode ? 'i2i' : 't2i';
    const ars = imageMode
      ? getAspectRatiosForI2iModel(m.id, providerId)
      : getAspectRatiosForT2iModel(m.id, providerId);
    const hasQ = !imageMode && modelHasT2iQualityInput(m.id, providerId);
    const hasR = !imageMode && modelHasT2iResolutionInput(m.id, providerId);
    const qualityOpts = hasQ ? getQualityEnumOptionsForT2iModel(m.id, providerId) : [];
    const resOpts = hasR
      ? getResolutionTierOptionsForT2iModel(m.id, providerId)
      : imageMode
        ? getResolutionsForI2iModel(m.id, providerId)
        : getResolutionsForT2iModel(m.id, providerId);
    const qualityField = imageMode
      ? getQualityFieldForI2iModel(m.id, providerId)
      : getQualityFieldForT2iModel(m.id, providerId);
    const qualityDefault = hasQ
      ? getModelInputDefault(m.id, 'quality', providerId, mode)
      : qualityField
        ? getModelInputDefault(m.id, qualityField, providerId, mode)
        : null;
    const resDefault = hasR
      ? getModelInputDefault(m.id, 'resolution', providerId, mode)
      : qualityDefault;
    if (!imageMode) {
      setSelectedModelProvider(providerId);
      saveModelPick("image", { v: 1, modelId: m.id, providerId });
    } else {
      setSelectedModelProvider(providerId);
      saveModelPick("image", { v: 1, modelId: m.id, providerId, catalogMode: "i2i" });
    }
    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setSelectedAr(clampModelInputSelection(selectedAr, ars, getModelInputDefault(m.id, 'aspect_ratio', providerId, mode) || ars[0] || "1:1"));
    if (hasQ) {
      setSelectedQuality(
        clampModelInputSelection(
          selectedQuality === 'auto' ? null : selectedQuality,
          qualityOpts,
          qualityDefault || qualityOpts[0] || null,
        ),
      );
    } else if (!hasR) {
      setSelectedQuality(
        clampModelInputSelection(selectedQuality, resOpts, resDefault || resOpts[0] || null),
      );
    } else {
      setSelectedQuality(null);
    }
    setSelectedResolutionTier(
      hasR
        ? clampModelInputSelection(selectedResolutionTier, resOpts, resDefault || resOpts[0] || null)
        : null,
    );
    if (imageMode) {
      setMaxImages(getMaxImagesForI2IModel(m.id, providerId));
      const effects = getEffectsForModelRegistry(m.id, providerId, 'i2i');
      setSelectedEffect(effects.length > 0 ? (getDefaultEffectForModelRegistry(m.id, providerId, 'i2i') || effects[0]) : "");
    } else {
      setSelectedEffect("");
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ History helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const buildImageSnapshot = useCallback(
    () =>
      buildGenerationSnapshot({
        studioId: "image",
        catalogMode: imageCatalogMode,
        modelId: selectedModelId,
        providerId: catalogProvider,
        prompt: prompt.trim(),
        controls: {
          aspect_ratio: selectedAr,
          ...(showQualityChip && selectedQuality ? { quality: selectedQuality } : {}),
          ...(useTierResolutionUi && selectedResolutionTier
            ? { resolution: selectedResolutionTier }
            : selectedQuality && currentQualityField
              ? { [currentQualityField]: selectedQuality }
              : {}),
          ...extraControls,
          ...(seedForSnapshot(seedValue) != null ? { seed: seedForSnapshot(seedValue) } : {}),
        },
        assetLabels: cardLabels,
        assetManifest: manifestFromAssetLabels("image", cardLabels),
        imageMode,
        batchSize,
      }),
    [
      imageCatalogMode,
      selectedModelId,
      catalogProvider,
      prompt,
      selectedAr,
      showQualityChip,
      selectedQuality,
      useTierResolutionUi,
      selectedResolutionTier,
      currentQualityField,
      extraControls,
      cardLabels,
      imageMode,
      batchSize,
      seedValue,
    ],
  );

  const runGenerationFromSnapshot = useCallback(
    async (snap, pendingId) => {
      const slotImageMode = !!snap.imageMode;
      const apiPrompt = stripMentionsFromPrompt(snap.prompt || "");
      const ctrl = snap.controls || {};
      const slotSeed = ctrl.seed;
      const labels = snap.assetLabels?.length ? snap.assetLabels : [];
      const routing = {
        ...generationRouting,
        providerOverride: snap.providerId,
      };
      const refUrls =
        slotImageMode && labels.length
          ? labels
              .map((label) => {
                const a = getStudioAsset("image", label);
                return a?.inferenceRef || label;
              })
              .filter(Boolean)
          : uploadedImageUrls;

      if (slotImageMode) {
        if (!refUrls.length) {
          failPending(pendingId, CONTROL_STRINGS.refsMissingRecreate);
          return null;
        }
        const genParams = {
          model: snap.modelId,
          images_list: refUrls,
          image_url: refUrls[0],
          aspect_ratio: ctrl.aspect_ratio,
          prompt: apiPrompt,
          ...Object.fromEntries(
            Object.entries(ctrl).filter(
              ([k]) => !["aspect_ratio", "quality", "resolution", "seed"].includes(k),
            ),
          ),
        };
        if (ctrl.quality) genParams.quality = ctrl.quality;
        if (ctrl.resolution) genParams.resolution = ctrl.resolution;
        applySeedToParams(genParams, slotSeed, snap.modelId, snap.providerId, snap.catalogMode);
        const res = await generateI2IForStudio(routing, genParams, {
          imageLabels: refUrls,
          cardLabels: labels,
        });
        if (res?.url) {
          const manifest = snap.assetManifest?.length
            ? snap.assetManifest
            : manifestFromAssetLabels("image", labels);
          resolvePending(pendingId, {
            id: res.id || pendingId,
            url: res.url,
            providerId: res._providerId || snap.providerId,
            snapshot: snapshotWithCardSeed(
              { ...snap, assetManifest: manifest, assetLabels: labels },
              usedSeedFromResponse(slotSeed, res),
            ),
          });
        } else {
          failPending(pendingId, "No image URL returned");
        }
        return res;
      }

      const genParams = {
        model: snap.modelId,
        prompt: apiPrompt,
        aspect_ratio: ctrl.aspect_ratio,
        ...Object.fromEntries(
          Object.entries(ctrl).filter(
            ([k]) => !["aspect_ratio", "quality", "resolution", "seed"].includes(k),
          ),
        ),
      };
      if (ctrl.quality) genParams.quality = ctrl.quality;
      if (ctrl.resolution) genParams.resolution = ctrl.resolution;
      applySeedToParams(genParams, slotSeed, snap.modelId, snap.providerId, snap.catalogMode);
      const res = await generateImageForStudio(routing, genParams);
      if (res?.url) {
        const manifest = snap.assetManifest?.length
          ? snap.assetManifest
          : manifestFromAssetLabels("image", labels);
        resolvePending(pendingId, {
          id: res.id || pendingId,
          url: res.url,
          providerId: res._providerId || snap.providerId,
          snapshot: snapshotWithCardSeed(
            { ...snap, assetManifest: manifest, assetLabels: labels },
            usedSeedFromResponse(slotSeed, res),
          ),
        });
      } else {
        failPending(pendingId, "No image URL returned");
      }
      return res;
    },
    [generationRouting, uploadedImageUrls, failPending, resolvePending],
  );

  const handleRetryEntry = useCallback(
    async (entry) => {
      const snap = entry?.snapshot;
      if (!snap?.modelId || generating) return;
      retryPending(entry.id);
      setGenerating(true);
      setGenerateError(null);
      try {
        await runGenerationFromSnapshot(snap, entry.id);
      } catch (e) {
        failPending(entry.id, e?.message || "Generation failed");
        setGenerateError(formatRunwareErrorForStudio(e));
        setTimeout(() => setGenerateError(null), 6000);
      } finally {
        setGenerating(false);
      }
    },
    [generating, retryPending, runGenerationFromSnapshot, failPending],
  );

  useEffect(() => {
    return subscribeStudioRetry((detail) => {
      if (detail.snapshot?.studioId !== "image" || !detail.pendingId) return;
      void handleRetryEntry({ id: detail.pendingId, snapshot: detail.snapshot });
    });
  }, [handleRetryEntry]);

  useEffect(() => {
    return subscribeStudioRecreate((snap) => {
      if (snap.studioId !== "image") return;
      setRecreateRefWarning(null);
      setImageMode(!!snap.imageMode);
      setSelectedModelProvider(snap.providerId);
      setSelectedModelId(snap.modelId);
      const m = getModelByIdForStudio(snap.modelId, "image", snap.providerId, {
        catalogMode: snap.catalogMode,
      });
      if (m?.name) setSelectedModelName(m.name);
      if (snap.controls?.aspect_ratio) setSelectedAr(String(snap.controls.aspect_ratio));
      if (snap.controls?.quality) setSelectedQuality(snap.controls.quality);
      if (snap.controls?.resolution) setSelectedResolutionTier(snap.controls.resolution);
      if (snap.controls?.seed != null && Number.isFinite(Number(snap.controls.seed))) {
        setSeedValue(Number(snap.controls.seed));
      } else {
        setSeedValue(null);
      }
      setExtraControls(
        Object.fromEntries(
          Object.entries(snap.controls || {}).filter(
            ([k]) => !["aspect_ratio", "quality", "resolution", "seed"].includes(k),
          ),
        ),
      );
      setPrompt(snap.prompt || "");
      if (snap.batchSize) setBatchSize(snap.batchSize);
      void restoreAssetsForRecreate("image", snap).then(({ restored, missing }) => {
        setUploadedImageUrls(restored);
        if (missing.length > 0) {
          setRecreateRefWarning(CONTROL_STRINGS.refsMissingRecreate);
        }
      });
    });
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ View state Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const resetToPrompt = () => {
    setCurrentImageUrl(null);
    setPrompt("");
    applyDefaultT2iSelection(defaultProviderId);
  };

  const handleGenerate = async () => {
    if (generating) return;

    if (t2iKeyMissing) {
      setGenerateError(providerPreviewLabel);
      setTimeout(() => setGenerateError(null), 4000);
      return;
    }

    const trimmedPrompt = prompt.trim();
    const apiPrompt = stripMentionsFromPrompt(trimmedPrompt);

    if (imageMode) {
      if (!i2iAvail.canRun) {
        setGenerateError(i2iAvail.message);
        setTimeout(() => setGenerateError(null), 4000);
        return;
      }
      if (uploadedImageUrls.length === 0) {
        alert("Please upload a reference image first.");
        return;
      }
      if (!apiPrompt) {
        alert("Please describe the edit you want (text besides @mentions).");
        return;
      }
    } else {
      if (!apiPrompt) {
        alert("Please enter a prompt to generate an image.");
        return;
      }
    }

    setGenerating(true);
    setGenerateError(null);
    setUploadPhase("");

    const snapshot = buildImageSnapshot();
    const batchSeeds = seedsForBatch(seedValue, batchSize);
    const pendingIds = Array.from({ length: batchSize }, (_, index) =>
      prependPending({
        prompt: prompt.trim(),
        model: selectedModelId,
        aspect_ratio: selectedAr,
        resolution: selectedResolutionTier || selectedQuality,
        providerId: catalogProvider,
        snapshot: snapshotWithCardSeed(snapshot, batchSeeds[index]),
        mediaType: "image",
      }),
    );

    try {
      const results = await Promise.all(
        pendingIds.map(async (pendingId, index) => {
          try {
            if (imageMode) {
              const genParams = {
                model: selectedModelId,
                images_list: uploadedImageUrls,
                image_url: uploadedImageUrls[0],
                aspect_ratio: selectedAr,
                ...extraControls,
              };
              genParams.prompt = apiPrompt;
              if (showQualityChip && selectedQuality) genParams.quality = selectedQuality;
              if (useTierResolutionUi && selectedResolutionTier) {
                genParams.resolution = selectedResolutionTier;
              } else if (currentQualityField && selectedQuality) {
                genParams[currentQualityField] = selectedQuality;
              }
              if (showEffectBtn && selectedEffect) genParams.name = selectedEffect;
              applySeedToParams(
                genParams,
                batchSeeds[index],
                selectedModelId,
                catalogProvider,
                imageCatalogMode,
              );
              const res = await generateI2IForStudio(generationRouting, genParams, {
                imageLabels: uploadedImageUrls,
                cardLabels,
                onUploadProgress: (pct) => setUploadPhase(`Uploading assets… ${pct}%`),
              });
              if (res?.url) {
                const finalizedManifest = manifestFromAssetLabels("image", cardLabels);
                const cardSeed = usedSeedFromResponse(batchSeeds[index], res);
                resolvePending(pendingId, {
                  id: res.id || pendingId,
                  url: res.url,
                  providerId: res._providerId || genResolved.providerId,
                  snapshot: snapshotWithCardSeed(
                    {
                      ...snapshot,
                      assetManifest: finalizedManifest,
                      assetLabels: cardLabels,
                    },
                    cardSeed,
                  ),
                });
              } else {
                failPending(pendingId, "No image URL returned");
              }
              return res;
            }
            const genParams = {
              model: selectedModelId,
              prompt: apiPrompt,
              aspect_ratio: selectedAr,
              ...extraControls,
            };
            if (showQualityChip && selectedQuality) genParams.quality = selectedQuality;
            if (useTierResolutionUi && selectedResolutionTier) {
              genParams.resolution = selectedResolutionTier;
            } else if (showLegacySingleChip && currentQualityField && selectedQuality) {
              genParams[currentQualityField] = selectedQuality;
            }
            applySeedToParams(
              genParams,
              batchSeeds[index],
              selectedModelId,
              catalogProvider,
              imageCatalogMode,
            );
            const res = await generateImageForStudio(generationRouting, genParams);
            if (res?.url) {
              const finalizedManifest = manifestFromAssetLabels("image", cardLabels);
              const cardSeed = usedSeedFromResponse(batchSeeds[index], res);
              resolvePending(pendingId, {
                id: res.id || pendingId,
                url: res.url,
                providerId: res._providerId || genResolved.providerId,
                snapshot: snapshotWithCardSeed(
                  {
                    ...snapshot,
                    assetManifest: finalizedManifest,
                    assetLabels: cardLabels,
                  },
                  cardSeed,
                ),
              });
            } else {
              failPending(pendingId, "No image URL returned");
            }
            return res;
          } catch (err) {
            failPending(pendingId, err?.message || "Generation failed");
            throw err;
          }
        }),
      );

      const firstCost = results.find((r) => r && typeof r.costUsd === "number")?.costUsd;
      if (typeof firstCost === "number") setLastChargedUsd(firstCost);

      results.forEach((res) => {
        if (res && res.url) {
          setActiveHistoryIdx(0);
          setCurrentImageUrl(res.url);
          onGenerationComplete?.({
            url: res.url,
            model: selectedModelId,
            prompt: prompt.trim(),
            type: "image",
          });
        }
      });
      const lastRes = results.filter(Boolean).pop();
      const lastSlotSeed = batchSeeds[batchSeeds.length - 1];
      if (lastRes) {
        setSeedValue(advanceSeed(usedSeedFromResponse(lastSlotSeed, lastRes)));
      }
    } catch (e) {
      console.error("[ImageStudio] Generation failed:", e);
      setGenerateError(formatRunwareErrorForStudio(e));
      setTimeout(() => setGenerateError(null), 6000);
    } finally {
      setGenerating(false);
    }
  };

  const placeholderText =
    uploadedImageUrls.length > 1
      ? `${uploadedImageUrls.length} images selected — describe the transformation; use @image1, @image2`
      : imageMode
        ? "Describe how to transform this image (optional); use @image1 to reference uploads"
        : "Describe the image you want to create";

  // Ã¢â€â‚¬Ã¢â€â‚¬ Render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden">
      
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CENTRAL GALLERY AREA Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <GenerationHistoryCard
                key={entry.id || idx}
                entry={{
                  status: entry.status || (entry.url ? "ready" : "pending"),
                  ...entry,
                }}
                mediaType="image"
                onOpen={(e) => setDetailEntry(e)}
                onDownload={(e) =>
                  e.url &&
                  downloadImage(e.url, `${e.providerId || catalogProvider}-${e.id || idx}.jpg`)
                }
                onRetry={handleRetryEntry}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-primary opacity-80"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">
                  Ã¢Å“Â¨
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-4 text-center px-4">
              <span className="text-foreground-muted font-medium">START CREATING WITH</span>
              <br />
              <span className="text-foreground">IMAGE STUDIO</span>
            </h1>
            <p className="text-foreground-muted text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Describe a scene, character, mood, or style Ã¢â‚¬â€ and watch it come to life
            </p>
          </div>
        )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ BOTTOM PROMPT BAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div 
        className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" 
        style={{ animationDelay: "0.2s" }}
      >
        <div className="w-full studio-surface backdrop-blur-3xl rounded-md p-4 flex flex-col gap-2 shadow-2xl">
          {/* Top row: upload picker + textarea */}
          <div className="flex items-center gap-2">
            <div
              className={uploadAvail.canRun ? "" : "opacity-50 pointer-events-none"}
              title={uploadAvail.canRun ? undefined : uploadAvail.message}
            >
              <UploadButton
                routing={baseRouting}
                apiKey={apiKey}
                maxImages={maxImages}
                onSelect={handleUploadSelect}
                onClear={handleUploadClear}
                initialUrls={uploadedImageUrls}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <MentionPromptField
                value={prompt}
                onChange={setPrompt}
                assets={mentionAssets}
                placeholder={placeholderText}
                rows={1}
                className="w-full bg-transparent border-none text-foreground text-sm placeholder:text-foreground-muted focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
              />
            </div>
          </div>

          {/* Bottom row: controls + generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-border-subtle relative">
            {/* Left controls */}
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              {/* Model button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "model" ? null : "model"));
                  }}
                  className={PROMPT_CHIP}
                >
                  <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-black uppercase">G</span>
                  </div>
                  <span className={PROMPT_CHIP_LABEL}>
                    {selectedModelName}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {dropdownOpen === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className={`${PROMPT_POPOVER} w-[calc(100vw-3rem)] max-w-xs max-h-[60vh] overflow-y-auto`}
                  >
                    <UnifiedModelDropdown
                      sections={modelSections}
                      selectedModelId={selectedModelId}
                      selectedProviderId={selectedModelProvider}
                      onSelect={handleModelSelect}
                      onClose={() => setDropdownOpen(null)}
                      onOpenApiSettings={onOpenApiSettings}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "ar" ? null : "ar"));
                  }}
                  className={PROMPT_CHIP}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={PROMPT_ICON}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  <span className={PROMPT_CHIP_LABEL_SM}>
                    {selectedAr}
                  </span>
                </button>

                {dropdownOpen === "ar" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`${PROMPT_POPOVER} rounded-md max-h-[40vh] overflow-y-auto min-w-[160px]`}
                  >
                    <SimpleDropdown
                      title="Aspect Ratio"
                      options={currentAspectRatios}
                      selected={selectedAr}
                      onSelect={(val) => setSelectedAr(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </div>
                )}
              </div>

              {/* Quality chip (GPT Image 2) */}
              {showQualityChip ? (
                <ModelInputChipRow
                  chipClassName={`${PROMPT_CHIP} group`}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={PROMPT_ICON}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  }
                  label={
                    selectedQuality
                      ? String(selectedQuality).charAt(0).toUpperCase() + String(selectedQuality).slice(1)
                      : "Medium"
                  }
                  open={dropdownOpen === "quality"}
                  onToggle={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "quality" ? null : "quality"));
                  }}
                  popoverClassName={`${PROMPT_POPOVER} rounded-md max-h-[40vh] overflow-y-auto min-w-[160px]`}
                >
                  <SimpleDropdown
                    title="Quality"
                    options={qualityEnumOptions}
                    selected={selectedQuality}
                    onSelect={(val) => setSelectedQuality(val)}
                    onClose={() => setDropdownOpen(null)}
                  />
                </ModelInputChipRow>
              ) : null}

              {/* Resolution tier chip (GPT Image 2 / Nano Banana) */}
              {showResolutionChip ? (
                <ModelInputChipRow
                  chipClassName={`${PROMPT_CHIP} group`}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={PROMPT_ICON}>
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                  }
                  label={
                    useTierResolutionUi
                      ? formatTierChipLabel(selectedResolutionTier || resolutionTierOptions[0])
                      : selectedQuality || legacyResolutionOptions[0]
                  }
                  open={dropdownOpen === "resolution"}
                  onToggle={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "resolution" ? null : "resolution"));
                  }}
                  popoverClassName={`${PROMPT_POPOVER} rounded-md max-h-[40vh] overflow-y-auto min-w-[180px]`}
                >
                  {useTierResolutionUi ? (
                    <TierOptionDropdown
                      title="Select resolution"
                      options={resolutionTierOptions}
                      selected={selectedResolutionTier || resolutionTierOptions[0]}
                      onSelect={(val) => setSelectedResolutionTier(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  ) : (
                    <SimpleDropdown
                      title="Resolution"
                      options={legacyResolutionOptions}
                      selected={selectedQuality}
                      onSelect={(val) => setSelectedQuality(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  )}
                </ModelInputChipRow>
              ) : null}

              {/* Effect type button */}
              {showEffectBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "effect" ? null : "effect"));
                    }}
                    className={PROMPT_CHIP}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={PROMPT_ICON}>
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className={`${PROMPT_CHIP_LABEL_SM} max-w-[140px] truncate`}>
                      {selectedEffect || "Effect"}
                    </span>
                  </button>

                  {dropdownOpen === "effect" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`${PROMPT_POPOVER} rounded-md max-h-[40vh] overflow-y-auto min-w-[200px]`}
                    >
                      <SimpleDropdown
                        title="Effect Type"
                        options={currentEffects}
                        selected={selectedEffect}
                        onSelect={(val) => setSelectedEffect(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {recreateRefWarning ? (
                <p className="text-[10px] text-amber-400/90 px-1" role="status">
                  {recreateRefWarning}
                </p>
              ) : null}

              <CatalogInputChips
                studioId="image"
                modelId={selectedModelId}
                providerId={catalogProvider}
                catalogMode={imageCatalogMode}
                values={extraControls}
                onChange={(field, value) =>
                  setExtraControls((prev) => ({ ...prev, [field]: value }))
                }
              />

              {showSeedUi ? (
                <SeedControl value={seedValue} onChange={setSeedValue} className="shrink-0" />
              ) : null}

              {!imageMode ? (
                <BatchSizeStepper
                  value={batchSize}
                  min={1}
                  max={4}
                  onChange={setBatchSize}
                  className="shrink-0"
                />
              ) : null}
            </div>

            <p className="text-[11px] text-foreground-muted mb-2 w-full sm:w-auto" role="status">
              {providerPreviewLabel}
              {lastChargedUsd != null ? (
                <span className="block mt-0.5" dir="ltr">
                  Last charged: {formatCostUsd(lastChargedUsd)}
                </span>
              ) : null}
            </p>
            <GenerateCostButton
              onClick={handleGenerate}
              disabled={generating || t2iKeyMissing || Boolean(genResolved.blockReason)}
              generating={generating}
              generateError={generateError}
              uploadPhase={uploadPhase}
              unitCostUsd={unitCostUsd}
              batchSize={batchSize}
              source={costSource}
              isLoadingCost={isLoadingCost}
              className="bg-primary text-black px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 w-full sm:w-auto min-w-[100px] shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            />
          </div>
        </div>
      </div>

      {detailEntry ? (
        <GenerationDetailViewer
          entry={detailEntry}
          mediaType="image"
          onClose={() => setDetailEntry(null)}
          onDownload={(e) =>
            e.url &&
            downloadImage(e.url, `${e.providerId || catalogProvider}-${e.id || "out"}.jpg`)
          }
          providerLabel={providerDisplayLabel}
        />
      ) : null}
    </div>
  );
}
