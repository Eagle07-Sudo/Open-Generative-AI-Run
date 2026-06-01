'use client';

import { useMemo, useState } from 'react';
import {
  getModelByIdForStudio,
  getModelInputOptions,
  getModelInputSchema,
  getModelInputLabel,
} from '../modelRegistry.js';
import { RESERVED_INPUT_FIELDS, getSchemaWidgetKind } from '../schemaWidgetUtils.js';
import ModelInputChipRow from './ModelInputChipRow.jsx';
import SimpleDropdown from './SimpleDropdown.jsx';
import StudioToggle from './StudioToggle.jsx';

const PROMPT_CHIP =
  'flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap';
const PROMPT_POPOVER =
  'absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10';

const SHOWN_BY_STUDIO = new Set([
  'aspect_ratio',
  'resolution',
  'quality',
  'duration',
  'name',
  'mode',
  'seed',
]);

/**
 * @param {{
 *   studioId: 'image' | 'video',
 *   modelId: string,
 *   providerId: string,
 *   catalogMode: string,
 *   values: Record<string, unknown>,
 *   onChange: (field: string, value: unknown) => void,
 * }} props
 */
export default function CatalogInputChips({
  studioId,
  modelId,
  providerId,
  catalogMode,
  values,
  onChange,
}) {
  const [openField, setOpenField] = useState(/** @type {string | null} */ (null));
  const [moreOpen, setMoreOpen] = useState(false);

  const fields = useMemo(() => {
    const model = getModelByIdForStudio(modelId, studioId, providerId, { catalogMode });
    const reserved = new Set([...RESERVED_INPUT_FIELDS, ...SHOWN_BY_STUDIO]);
    const names = new Set(Object.keys(model?.inputs || {}));
    if (providerId === 'runware' && model?.muapiId) {
      const muapi = getModelByIdForStudio(model.muapiId, studioId, 'muapi', { catalogMode });
      for (const key of Object.keys(muapi?.inputs || {})) names.add(key);
    }
    return [...names]
      .filter((name) => !reserved.has(name))
      .map((name) => {
        const schema = getModelInputSchema(modelId, name, providerId, catalogMode);
        if (!schema) return null;
        const options = getModelInputOptions(modelId, name, providerId, catalogMode);
        const kind = getSchemaWidgetKind(schema);
        if (kind === 'boolean') {
          return {
            name,
            schema,
            options,
            kind,
            label: getModelInputLabel(modelId, name, providerId, catalogMode),
          };
        }
        if (kind === 'unknown' || options.length === 0) return null;
        return {
          name,
          schema,
          options,
          kind,
          label: getModelInputLabel(modelId, name, providerId, catalogMode),
        };
      })
      .filter(Boolean);
  }, [studioId, modelId, providerId, catalogMode]);

  if (fields.length === 0) return null;

  const visible = fields.slice(0, 3);
  const overflow = fields.slice(3);

  const renderField = (field) => {
    const { name, options, kind, schema, label } = field;
    const current = values[name] ?? schema.default;

    if (kind === 'boolean') {
      return (
        <StudioToggle
          key={name}
          checked={Boolean(current)}
          onChange={(v) => onChange(name, v)}
          label={label || name}
          className="shrink-0"
        />
      );
    }

    return (
      <ModelInputChipRow
        key={name}
        chipClassName={PROMPT_CHIP}
        label={String(current ?? options[0] ?? label)}
        open={openField === name}
        onToggle={(e) => {
          e.stopPropagation();
          setOpenField((o) => (o === name ? null : name));
        }}
        popoverClassName={`${PROMPT_POPOVER} min-w-[140px]`}
      >
        <SimpleDropdown
          title={label || name}
          options={options}
          selected={current}
          onSelect={(v) => onChange(name, v)}
          onClose={() => setOpenField(null)}
        />
      </ModelInputChipRow>
    );
  };

  return (
    <>
      {visible.map(renderField)}
      {overflow.length > 0 ? (
        <div className="relative">
          <button type="button" className={PROMPT_CHIP} onClick={(e) => { e.stopPropagation(); setMoreOpen((o) => !o); }}>
            <span className="text-xs font-semibold text-white/70">More</span>
          </button>
          {moreOpen ? (
            <div className={`${PROMPT_POPOVER} flex flex-wrap gap-2 min-w-[200px]`} onClick={(e) => e.stopPropagation()}>
              {overflow.map(renderField)}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
