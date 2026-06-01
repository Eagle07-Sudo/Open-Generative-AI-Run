"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { formatReleaseDateLabel, formatReleaseDateFull } from "../modelReleaseMeta.js";

const VIRTUALIZE_THRESHOLD = 80;
const ROW_HEIGHT = 68;
const VIRTUAL_LIST_MAX_HEIGHT = 360;

/**
 * @param {{ items: object[], rowHeight: number, height: number, getKey: (item: object, index: number) => string, renderRow: (item: object, index: number) => React.ReactNode }} props
 */
function VirtualScrollList({ items, rowHeight, height, getKey, renderRow }) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
  const visible = Math.ceil(height / rowHeight) + 2;
  const end = Math.min(items.length, start + visible);

  return (
    <div
      className="overflow-y-auto custom-scrollbar pr-1 pb-2"
      style={{ maxHeight: height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      role="presentation"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {items.slice(start, end).map((item, offset) => {
          const index = start + offset;
          return (
            <div
              key={getKey(item, index)}
              style={{
                position: "absolute",
                top: index * rowHeight,
                left: 0,
                right: 0,
                minHeight: rowHeight,
              }}
            >
              {renderRow(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ModelRow = memo(function ModelRow({
  model: m,
  section,
  selected,
  onSelect,
  onClose,
}) {
  const dateLabel = formatReleaseDateLabel(m.releaseDate);
  const providerLabel = section.label;
  const subtitle = dateLabel ? `${dateLabel} · ${providerLabel}` : providerLabel;
  const ariaLabel = m.releaseDate
    ? `${m.name || m.id}, released ${formatReleaseDateFull(m.releaseDate)}, ${providerLabel}`
    : `${m.name || m.id}, ${providerLabel}`;

  return (
    <div
      role="option"
      aria-selected={selected}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(m, section.providerId);
        onClose();
      }}
      className={`flex items-center justify-between p-3.5 hover:bg-card-bg rounded-lg cursor-pointer transition-all border border-transparent hover:border-border-subtle ${
        selected ? "bg-card-bg border-border-subtle" : ""
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {(m.name || m.id || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground block truncate">{m.name || m.id}</span>
          <span className="text-[10px] text-foreground-muted block truncate">{subtitle}</span>
        </div>
      </div>
      {selected ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary shrink-0"
          aria-hidden
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : null}
    </div>
  );
});

/**
 * @param {{
 *   sections: Array<{ providerId: string, label: string, models: object[], hint?: string, disabledReason?: string }>,
 *   selectedModelId: string,
 *   selectedProviderId: string,
 *   onSelect: (model: object, providerId: string) => void,
 *   onClose: () => void,
 *   onOpenApiSettings?: () => void,
 *   emptyMessage?: string,
 *   browseModels?: object[],
 *   browseLoading?: boolean,
 *   onBrowseSearch?: (query: string) => void,
 *   showBrowse?: boolean,
 * }} props
 */
function UnifiedModelDropdown({
  sections,
  selectedModelId,
  selectedProviderId,
  onSelect,
  onClose,
  onOpenApiSettings,
  emptyMessage = "Add API keys in Settings to see models.",
  browseModels = [],
  browseLoading = false,
  onBrowseSearch,
  showBrowse = false,
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("catalog");
  const q = search.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!q || tab === "browse") return sections;
    return sections
      .map((section) => ({
        ...section,
        models: section.models.filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.id?.toLowerCase().includes(q) ||
            m.releaseDate?.includes(q) ||
            m.runwareModel?.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.models.length > 0 || s.disabledReason);
  }, [sections, q, tab]);

  const filteredBrowse = useMemo(() => {
    if (!q) return browseModels;
    return browseModels.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q) ||
        m.runwareModel?.toLowerCase().includes(q),
    );
  }, [browseModels, q]);

  const flatCatalogRows = useMemo(() => {
    /** @type {Array<{ type: 'header', section: object } | { type: 'model', model: object, section: object } | { type: 'locked', section: object }>} */
    const rows = [];
    for (const section of filteredSections) {
      rows.push({ type: "header", section });
      if (section.models.length === 0 && section.disabledReason) {
        rows.push({ type: "locked", section });
      }
      for (const model of section.models) {
        rows.push({ type: "model", model, section });
      }
    }
    return rows;
  }, [filteredSections]);

  const totalModels = sections.reduce((n, s) => n + s.models.length, 0);
  const hasLockedSection = sections.some((s) => s.disabledReason && s.models.length === 0);
  const showEmptyOnly = totalModels === 0 && !hasLockedSection && !showBrowse;
  const useVirtualList = flatCatalogRows.filter((r) => r.type === "model").length > VIRTUALIZE_THRESHOLD;

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      if (tab === "browse" && onBrowseSearch) {
        onBrowseSearch(value);
      }
    },
    [tab, onBrowseSearch],
  );

  const renderCatalogRow = useCallback(
    (row) => {
      if (row.type === "header") {
        const section = row.section;
        return (
          <div
            id={`section-${section.providerId}`}
            className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted px-2 py-1 sticky top-0 bg-panel-bg/95 backdrop-blur-sm z-10"
          >
            {section.label}
            {section.hint ? (
              <span className="block normal-case font-normal text-[9px] text-foreground-muted/80 mt-0.5">
                {section.hint}
              </span>
            ) : null}
          </div>
        );
      }
      if (row.type === "locked") {
        const section = row.section;
        return (
          <div className="px-3 py-3 rounded-lg border border-dashed border-border-subtle bg-card-bg/50">
            <p className="text-[11px] text-foreground-muted leading-relaxed">{section.disabledReason}</p>
            {onOpenApiSettings ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenApiSettings();
                  onClose();
                }}
                className="mt-2 text-[11px] font-semibold text-primary hover:underline"
              >
                Open API Settings
              </button>
            ) : null}
          </div>
        );
      }
      const selected =
        selectedModelId === row.model.id && selectedProviderId === row.section.providerId;
      return (
        <ModelRow
          model={row.model}
          section={row.section}
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
        />
      );
    },
    [selectedModelId, selectedProviderId, onSelect, onClose, onOpenApiSettings],
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
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder={tab === "browse" ? "Search Runware library..." : "Search models..."}
            value={search}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-transparent border-none text-xs text-foreground focus:ring-0 w-full p-0 focus:outline-none placeholder:text-foreground-muted"
            aria-label="Search models"
          />
        </div>
      </div>

      {showBrowse ? (
        <div className="flex gap-1 shrink-0 px-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "catalog"}
            onClick={(e) => {
              e.stopPropagation();
              setTab("catalog");
            }}
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded ${
              tab === "catalog" ? "bg-primary/15 text-primary" : "text-foreground-muted"
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "browse"}
            onClick={(e) => {
              e.stopPropagation();
              setTab("browse");
              if (onBrowseSearch) onBrowseSearch(search);
            }}
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded ${
              tab === "browse" ? "bg-primary/15 text-primary" : "text-foreground-muted"
            }`}
          >
            Browse library
          </button>
        </div>
      ) : null}

      <div className="text-xs font-medium text-secondary py-2 shrink-0">
        Available models
        {useVirtualList ? (
          <span className="text-[9px] text-foreground-muted font-normal ml-2">({totalModels} models)</span>
        ) : null}
      </div>

      {tab === "browse" && showBrowse ? (
        <div
          className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 pb-2 max-h-[45vh]"
          role="listbox"
        >
          {browseLoading ? (
            <p className="text-[11px] text-foreground-muted px-2 py-4">Searching Runware library…</p>
          ) : filteredBrowse.length === 0 ? (
            <p className="text-[11px] text-foreground-muted px-2 py-4">
              Type to search checkpoint models on Runware.
            </p>
          ) : (
            filteredBrowse.map((m) => (
              <div
                key={m.id || m.runwareModel}
                role="option"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(m, "runware");
                  onClose();
                }}
                className="flex items-center gap-3 p-3 hover:bg-card-bg rounded-lg cursor-pointer border border-transparent hover:border-border-subtle"
              >
                <span className="text-sm font-semibold text-foreground truncate">{m.name || m.id}</span>
                <span className="text-[9px] text-foreground-muted truncate">{m.runwareModel}</span>
              </div>
            ))
          )}
        </div>
      ) : showEmptyOnly ? (
        <p className="text-[11px] text-foreground-muted px-2 py-4">{emptyMessage}</p>
      ) : useVirtualList ? (
        <div role="listbox" aria-label="Available models">
          <VirtualScrollList
            items={flatCatalogRows}
            rowHeight={ROW_HEIGHT}
            height={VIRTUAL_LIST_MAX_HEIGHT}
            getKey={(row, index) =>
              row.type === "model"
                ? `${row.section.providerId}:${row.model.id}`
                : `${row.type}-${row.section.providerId}-${index}`
            }
            renderRow={(row) => renderCatalogRow(row)}
          />
        </div>
      ) : (
        <div
          className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 pb-2 max-h-[45vh]"
          role="listbox"
          aria-label="Available models"
        >
          {filteredSections.map((section) => (
            <div key={section.providerId} role="group" aria-labelledby={`section-${section.providerId}`}>
              <div
                id={`section-${section.providerId}`}
                className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted px-2 py-1 sticky top-0 bg-panel-bg/95 backdrop-blur-sm z-10"
              >
                {section.label}
                {section.hint ? (
                  <span className="block normal-case font-normal text-[9px] text-foreground-muted/80 mt-0.5">
                    {section.hint}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                {section.models.length === 0 && section.disabledReason ? (
                  <div className="px-3 py-3 rounded-lg border border-dashed border-border-subtle bg-card-bg/50">
                    <p className="text-[11px] text-foreground-muted leading-relaxed">{section.disabledReason}</p>
                    {onOpenApiSettings ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApiSettings();
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-semibold text-primary hover:underline"
                      >
                        Open API Settings
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {section.models.map((m) => {
                  const selected =
                    selectedModelId === m.id && selectedProviderId === section.providerId;
                  return (
                    <ModelRow
                      key={`${section.providerId}:${m.id}`}
                      model={m}
                      section={section}
                      selected={selected}
                      onSelect={onSelect}
                      onClose={onClose}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {filteredSections.length === 0 && q ? (
            <p className="text-[11px] text-foreground-muted px-2 py-2">No models match your search.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default memo(UnifiedModelDropdown);
