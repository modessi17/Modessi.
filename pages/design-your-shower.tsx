import { shower_builder } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, Send, Loader2 } from 'lucide-react';

const siteUrl = 'https://modessi.ca';
const pageTitle = 'Design Your Bath — Modessi Construction Inc.';
const pageDescription = 'Choose a shower base or bathtub, then customize your bathroom.';

const getStepLabel = (step: { key: string; label: string }) =>
  step.key === 'base' ? 'Base or Bathtub' : step.label;

const getStepDescription = (step: { key: string; description: string }) =>
  step.key === 'base' ? 'Choose a shower base or bathtub.' : step.description;

// Official Moen Widen product photography, matched by collection and finish.
// Only combinations with an exact product image are shown in the selector.
const MOEN_TAP_IMAGES: Record<string, string> = {
  'Chrome:rizon': 'https://moen.widen.net/content/7aeyus3bgh/webp/t2813.tif?h=2000&w=2000',
  'Chrome:voss': 'https://moen.widen.net/content/2sh3hm0nrb/webp/t2693.tif?h=2000&w=2000',
  'Chrome:align': 'https://moen.widen.net/content/7z93a6u3yb/webp/t2193.tif?h=2000&w=2000',
  'Matte Black:genta': 'https://moen.widen.net/content/eqx19i8lk4/webp/t2473epbl.tif?h=2000&w=2000',
  'Matte Black:rizon': 'https://moen.widen.net/content/zeneqvyr0l/webp/t2813bl.tif?h=2000&w=2000',
  'Matte Black:voss': 'https://moen.widen.net/content/td00yrvfcg/webp/t2693bl.tif?h=2000&w=2000',
  'Brushed Nickel:brantford': 'https://moen.widen.net/content/ctsqoc0dp4/webp/t2253epbn.tif?h=2000&w=2000',
  'Brushed Nickel:genta': 'https://moen.widen.net/content/ewpuw5qfor/webp/t2473epbn.tif?h=2000&w=2000',
  'Brushed Nickel:voss': 'https://moen.widen.net/content/4wpv9k0fse/webp/t2693bn.tif?h=2000&w=2000',
  'Brushed Gold:voss': 'https://moen.widen.net/content/alqegxj1mn/webp/t2693bg.tif?h=2000&w=2000',
  'Chrome:90-degree': 'https://moen.widen.net/content/oeaqxsunew/webp/ts2713.tif?h=2000&w=2000',
  'Brushed Nickel:90-degree': 'https://moen.widen.net/content/lzsjtp7zah/webp/ts2713bn.tif?h=2000&w=2000',
};

const getMoenTapImage = (option: SelectionOption) => {
  const model = option.id.includes('90-degree') ? '90-degree' : option.id.split('-').at(-1) ?? '';
  return MOEN_TAP_IMAGES[`${option.category}:${model}`];
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const slideIn = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: 'easeIn' as const } },
};

type SelectionOption = { id: string; name: string; image: string; description: string; category?: string; secondImage?: string; finishImages?: Record<string, string>; finishable?: boolean; group?: string; swatch?: string; quantity?: number; surfaceFinish?: string };
type Selections = Record<string, SelectionOption>;
type BaseCategory = 'bigbox' | 'bathtub' | 'standup' | null;
type FloorCategory = 'Vinyl' | 'Tile';
type ExtraKind = 'hardware' | 'accessories' | 'bathroom-accessories';

type SubmitStatus = 'idle' | 'compositing' | 'sending' | 'success' | 'error';

async function prepareBathroomPhoto(dataUrl: string): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not read the uploaded bathroom photo.'));
  });
  const scale = Math.min(1, 1536 / image.width, 1024 / image.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the bathroom photo.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

// Build a single labelled collage from the selected product photos.
async function buildCompositeDataUrl(
  steps: typeof shower_builder.steps,
  selections: Selections,
  selectedSize: string,
  selectedTileSize: string,
  additionalSelections: Record<string, SelectionOption[]> = {},
): Promise<string> {
  const items = steps.flatMap((s) => {
    if (additionalSelections[s.key]?.length) {
      return additionalSelections[s.key].map((selection) => ({ label: s.label, selection }));
    }
    const selection = selections[s.key];
    return selection ? [{ label: s.label, selection }] : [];
  });
  const cols = 3;
  const cellSize = 360;
  const labelHeight = 66;
  const gap = 12;
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const canvasW = cols * cellSize + (cols - 1) * gap;
  const canvasH = rows * (cellSize + labelHeight) + (rows - 1) * gap + 64;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  for (let i = 0; i < items.length; i++) {
    const { label, selection: sel } = items[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (cellSize + gap);
    const y = row * (cellSize + labelHeight + gap);

    // Image cell
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, cellSize, cellSize);

    if (sel) {
      try {
        const img = await loadImage(sel.image);
        // Contain the complete product photo so fixtures stay recognizable.
        const scale = Math.min((cellSize - 32) / img.naturalWidth, (cellSize - 32) / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const offsetX = x + (cellSize - drawW) / 2;
        const offsetY = y + (cellSize - drawH) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cellSize, cellSize);
        ctx.clip();
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      } catch {
        // fallback: dark cell already drawn
      }
    }

    // Gold border
    ctx.strokeStyle = '#B8962E';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, cellSize - 1.5, cellSize - 1.5);

    // Label strip
    const labelY = y + cellSize;
    ctx.fillStyle = '#111111';
    ctx.fillRect(x, labelY, cellSize, labelHeight);

    // Category label (gold, small caps)
    ctx.fillStyle = '#B8962E';
    ctx.font = '500 10px serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(label.toUpperCase(), x + 12, labelY + 20);

    // Selection name (white) — include size for base
    ctx.fillStyle = '#d0d0d0';
    ctx.font = '13px serif';
    ctx.letterSpacing = '0px';
    const rawName = sel?.name ?? '—';
    const stepKey = items[i].label === 'Base or Bathtub' ? 'base' : items[i].label === 'Shower Tile' ? 'tile' : '';
    const selName = stepKey === 'base' && sel && sel.category !== 'bathtub'
      ? `${rawName} (${selectedSize})`
      : stepKey === 'tile' && sel
      ? `${rawName} (${selectedTileSize})${sel.surfaceFinish ? ` · ${sel.surfaceFinish}` : ''}`
      : sel?.category === 'Tile' && sel.surfaceFinish
      ? `${rawName} · ${sel.surfaceFinish}`
      : rawName;
    // Truncate if too long
    const maxW = cellSize - 24;
    let displayName = selName;
    while (ctx.measureText(displayName).width > maxW && displayName.length > 4) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== selName) displayName += '…';
    ctx.fillText(displayName, x + 12, labelY + 40);
  }

  // Watermark
  ctx.fillStyle = 'rgba(184,150,46,0.35)';
  ctx.font = '11px serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('MODESSI CONSTRUCTION INC.', 16, canvasH - 16);

  return canvas.toDataURL('image/jpeg', 0.88);
}

/* ── Shared card used for every base option ─────────────────────────── */
function BaseCard({
  option,
  isSelected,
  selectedSize,
  onSelect,
}: {
  option: { id: string; name: string; image: string; secondImage?: string };
  isSelected: boolean;
  selectedSize: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative w-full text-left border transition-all duration-300 overflow-hidden focus:outline-none ${
        isSelected ? 'border-primary bg-card' : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      {/* Photo area — single image or side-by-side pair */}
      {option.secondImage ? (
        <div className="w-full bg-white flex" style={{ aspectRatio: '21/9' }}>
          <div className="flex-1 flex items-center justify-center overflow-hidden border-r border-border/30 p-6 sm:p-8">
            <img
              src={option.image}
              alt={option.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden p-6 sm:p-8 bg-white">
            <img
              src={option.secondImage}
              alt={`${option.name} detail`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        <div
          className="w-full bg-white flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '21/9', padding: '2rem 2.5rem' }}
        >
          <img
            src={option.image}
            alt={option.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}

      {/* Name bar */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          <p
            className={`text-sm transition-colors ${isSelected ? 'text-foreground' : 'text-foreground/70'}`}
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}
          >
            {option.name}
          </p>
          {selectedSize && isSelected && (
            <span
              className="text-[11px] text-primary border border-primary/40 px-2 py-0.5"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}
            >
              {selectedSize}
            </span>
          )}
        </div>
        {isSelected ? (
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
            <Check size={11} className="text-primary-foreground" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-border/60 shrink-0" />
        )}
      </div>

      {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
    </button>
  );
}

export default function ShowerBuilderPage() {
  const steps = shower_builder.steps;
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [selectedHardware, setSelectedHardware] = useState<SelectionOption[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<SelectionOption[]>([]);
  const [selectedBathroomAccessories, setSelectedBathroomAccessories] = useState<SelectionOption[]>([]);
  const [showMoodboard, setShowMoodboard] = useState(false);
  const [uploadedBathroomPhoto, setUploadedBathroomPhoto] = useState<string | null>(null);
  const [uploadedPhotoRevision, setUploadedPhotoRevision] = useState(0);
  const [aiPreviewStatus, setAiPreviewStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [generatedBathroomPreview, setGeneratedBathroomPreview] = useState<{ dataUrl: string; fingerprint: string } | null>(null);
  const [failedPreviewFingerprint, setFailedPreviewFingerprint] = useState('');
  const autoPreviewFingerprintRef = useRef('');
  const designFingerprint = JSON.stringify({ selections, selectedHardware, selectedAccessories, selectedBathroomAccessories, uploadedPhotoRevision });
  const currentGeneratedImage = generatedBathroomPreview?.fingerprint === designFingerprint ? generatedBathroomPreview.dataUrl : null;

  function handleBathroomPhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (!window.confirm('Use this bathroom photo as the reference for your AI design? The photo will be sent to OpenAI to create the rendering.')) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setUploadedBathroomPhoto(reader.result); setUploadedPhotoRevision((revision) => revision + 1); } };
    reader.readAsDataURL(file);
  }

  const generateRealisticBathroomPreview = useCallback(async () => {
    if (aiPreviewStatus === 'generating') return;
    setAiPreviewStatus('generating');
    try {
      const labels = new Map(steps.map((step) => [step.key, getStepLabel(step)]));
      const selectionsForRender = [
        ...Object.entries(selections)
          .filter(([key]) => !['hardware', 'accessories', 'bathroom-accessories'].includes(key))
          .map(([key, item]) => ({ label: labels.get(key) ?? key, id: item.id, name: item.name, image: item.image })),
        ...selectedHardware.map((item) => ({ label: 'Shower hardware', id: item.id, name: item.name, image: item.image })),
        ...selectedAccessories.map((item) => ({ label: item.group ?? 'Shower accessories', id: item.id, name: item.name, image: item.image })),
        ...selectedBathroomAccessories.map((item) => ({ label: item.group ?? 'Bathroom accessories', id: item.id, name: item.name, image: item.image })),
      ];
      if (selectionsForRender.length === 0) throw new Error('Choose your bathroom items first.');
      const roomImageDataUrl = uploadedBathroomPhoto ? await prepareBathroomPhoto(uploadedBathroomPhoto) : undefined;
      const response = await fetch('/api/realistic-bathroom-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImageDataUrl,
          baseImagePath: '/assets/uploads/realistic-bathroom-base.png',
          selections: selectionsForRender,
        }),
      });
      const result = await response.json() as { imageDataUrl?: string; error?: string };
      if (!response.ok || !result.imageDataUrl) throw new Error(result.error ?? 'Could not create the bathroom image. Please try again.');
      setGeneratedBathroomPreview({ dataUrl: result.imageDataUrl, fingerprint: designFingerprint });
      setFailedPreviewFingerprint('');
      setAiPreviewStatus('idle');
    } catch (error) {
      // Keep provider details in the server log; the customer preview stays
      // quiet and retries automatically when they change a selection.
      console.warn('Bathroom preview could not be generated.', error);
      setFailedPreviewFingerprint(designFingerprint);
      setAiPreviewStatus('error');
    }
  }, [aiPreviewStatus, designFingerprint, selectedAccessories, selectedBathroomAccessories, selectedHardware, selections, steps, uploadedBathroomPhoto]);

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null);
  const compositeRef = useRef<string | null>(null);

  // Size selector (base step only)
  const BASE_SIZES = ['60" × 36"', '60" × 32"', '48" × 36"', '42" × 42"', '36" × 48"', '36" × 36"'];
  const [selectedSize, setSelectedSize] = useState(BASE_SIZES[0]);

  // Size selector (tile step only)
  const TILE_SIZES = ['36" × 36"', '24" × 24"', '24" × 12"'];
  const [selectedTileSize, setSelectedTileSize] = useState(TILE_SIZES[0]);

  // Base category picker
  const [baseCategory, setBaseCategory] = useState<BaseCategory>(null);
  const [floorCategory, setFloorCategory] = useState<FloorCategory>('Vinyl');
  const [selectedTileFinish, setSelectedTileFinish] = useState<'Polished' | 'Matte'>('Matte');
  const [selectedFloorTileFinish, setSelectedFloorTileFinish] = useState<'Polished' | 'Matte'>('Matte');
  const progressRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const designHeadingRef = useRef<HTMLHeadingElement>(null);
  const flowMountedRef = useRef(false);

  const step = steps[currentStep];
  const stepOptions = (step?.options ?? []) as unknown as SelectionOption[];
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const currentSelection = selections[step?.key ?? ''];
  const allSelected = steps.every((s) => selections[s.key]);
  const isBaseStep = step?.key === 'base';
  const isTileStep = step?.key === 'tile';
  const isTapsStep = step?.key === 'taps';
  const isHardwareStep = step?.key === 'hardware';
  const isDoorsStep = step?.key === 'doors';
  const isAccessoriesStep = step?.key === 'accessories';
  const isFloorStep = step?.key === 'floor';
  const isVanityStep = step?.key === 'vanity';
  const isWallColourStep = step?.key === 'wall-colour';
  const isBathroomAccessoriesStep = step?.key === 'bathroom-accessories';
  const compositeExtras = { hardware: selectedHardware, accessories: selectedAccessories, 'bathroom-accessories': selectedBathroomAccessories };

  // Taps finish picker
  const TAP_FINISHES = ['Chrome', 'Matte Black', 'Brushed Nickel', 'Brushed Gold'];
  const [selectedFinish, setSelectedFinish] = useState<string>(TAP_FINISHES[0]);

  useEffect(() => {
    if (!flowMountedRef.current) {
      flowMountedRef.current = true;
      return;
    }
    const target = showMoodboard ? designHeadingRef.current : stepHeadingRef.current;
    const timer = window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => window.clearTimeout(timer);
  }, [currentStep, showMoodboard]);

  useEffect(() => {
    if (!showMoodboard || aiPreviewStatus === 'generating' || failedPreviewFingerprint === designFingerprint) return;
    if (autoPreviewFingerprintRef.current === designFingerprint) return;
    const fingerprint = designFingerprint;
    const timer = window.setTimeout(() => {
      if (autoPreviewFingerprintRef.current === fingerprint) return;
      autoPreviewFingerprintRef.current = fingerprint;
      void generateRealisticBathroomPreview();
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [aiPreviewStatus, designFingerprint, failedPreviewFingerprint, generateRealisticBathroomPreview, showMoodboard]);

  useEffect(() => {
    if (!showMoodboard) return;
    let cancelled = false;
    buildCompositeDataUrl(steps, selections, selectedSize, selectedTileSize, compositeExtras).then((url) => {
      if (cancelled) return;
      compositeRef.current = url;
      setCompositeDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [showMoodboard, selections, selectedHardware, selectedAccessories, selectedBathroomAccessories, selectedSize, selectedTileSize, steps]);

  function updateFinalSelection(key: string, option: SelectionOption) {
    const image = key === 'taps' ? getMoenTapImage(option) : option.finishImages?.[selectedFinish] ?? option.image;
    const surfaceFinish = key === 'tile' ? selectedTileFinish : key === 'floor' && option.category === 'Tile' ? selectedFloorTileFinish : option.surfaceFinish;
    setSelections((previous) => ({
      ...previous,
      [key]: { ...option, image: image ?? option.image, category: option.finishable ? selectedFinish : option.category, ...(surfaceFinish ? { surfaceFinish } : {}) },
    }));
  }

  function chooseSurfaceFinish(key: 'tile' | 'floor', finish: 'Polished' | 'Matte') {
    if (key === 'tile') setSelectedTileFinish(finish);
    else setSelectedFloorTileFinish(finish);
    setSelections((previous) => previous[key] ? { ...previous, [key]: { ...previous[key], surfaceFinish: finish } } : previous);
  }

  function toggleFinalExtra(kind: ExtraKind, option: SelectionOption) {
    const usesFinish = kind === 'hardware' || option.finishable;
    const image = option.finishImages?.[selectedFinish] ?? option.image;
    const item = { ...option, image, category: usesFinish ? selectedFinish : undefined, name: `${option.name}${usesFinish ? ` (${selectedFinish})` : ''}`, quantity: 1 };
    const update = (previous: SelectionOption[]) => {
      const active = previous.some((entry) => entry.id === option.id && (!usesFinish || entry.category === selectedFinish));
      return active ? previous.filter((entry) => entry.id !== option.id) : [...previous.filter((entry) => entry.id !== option.id), item];
    };
    if (kind === 'hardware') setSelectedHardware(update);
    else if (kind === 'accessories') setSelectedAccessories(update);
    else setSelectedBathroomAccessories(update);
  }

  function adjustAccessoryQuantity(option: SelectionOption, delta: number) {
    const usesFinish = option.finishable;
    const image = option.finishImages?.[selectedFinish] ?? option.image;
    setSelectedAccessories((previous) => {
      const existing = previous.find((entry) => entry.id === option.id && (!usesFinish || entry.category === selectedFinish));
      const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);
      const withoutOption = previous.filter((entry) => entry.id !== option.id);
      if (!nextQuantity) return withoutOption;
      return [...withoutOption, {
        ...option,
        image,
        category: usesFinish ? selectedFinish : undefined,
        name: `${option.name}${usesFinish ? ` (${selectedFinish})` : ''}`,
        quantity: nextQuantity,
      }];
    });
  }

  function selectOption(option: SelectionOption) {
    const image = isTapsStep ? getMoenTapImage(option) : option.finishImages?.[selectedFinish] ?? option.image;
    const surfaceFinish = isTileStep ? selectedTileFinish : isFloorStep && floorCategory === 'Tile' ? selectedFloorTileFinish : option.surfaceFinish;
    const updatedSelections = {
      ...selections,
      [step.key]: { ...option, image: image ?? option.image, category: option.finishable ? selectedFinish : option.category, ...(surfaceFinish ? { surfaceFinish } : {}) },
    };
    setSelections(updatedSelections);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowMoodboard(true);
      buildCompositeDataUrl(steps, updatedSelections, selectedSize, selectedTileSize, compositeExtras).then((url) => {
        compositeRef.current = url;
        setCompositeDataUrl(url);
      });
    }
  }

  function goNext() {
    if (isHardwareStep) {
      const summary = selectedHardware.length
        ? { id: 'hardware-summary', name: selectedHardware.map((item) => item.name).join(', '), image: selectedHardware[0].image, description: '' }
        : { id: 'hardware-none', name: 'None selected', image: '', description: '' };
      setSelections((prev) => ({ ...prev, hardware: summary }));
    }
    if (isAccessoriesStep) {
      const summary = selectedAccessories.length
        ? { id: 'accessories-summary', name: selectedAccessories.map((item) => `${item.name}${(item.quantity ?? 1) > 1 ? ` ×${item.quantity}` : ''}`).join(', '), image: selectedAccessories.find((item) => item.image)?.image ?? '', description: '' }
        : { id: 'accessories-none', name: 'None added', image: '', description: '' };
      setSelections((prev) => ({ ...prev, accessories: summary }));
    }
    if (isBathroomAccessoriesStep) {
      const summary = selectedBathroomAccessories.length
        ? { id: 'bathroom-accessories-summary', name: selectedBathroomAccessories.map((item) => item.name).join(', '), image: selectedBathroomAccessories.find((item) => item.image)?.image ?? '', description: '' }
        : { id: 'bathroom-accessories-none', name: 'None added', image: '', description: '' };
      setSelections((prev) => ({ ...prev, 'bathroom-accessories': summary }));
    }
    if (isLastStep) {
      setShowMoodboard(true);
      const finalSelections = { ...selections,
        accessories: selectedAccessories.length ? { id: 'accessories-summary', name: selectedAccessories.map((item) => `${item.name}${(item.quantity ?? 1) > 1 ? ` ×${item.quantity}` : ''}`).join(', '), image: '', description: '' } : { id: 'accessories-none', name: 'None added', image: '', description: '' },
        hardware: selectedHardware.length ? { id: 'hardware-summary', name: selectedHardware.map((item) => item.name).join(', '), image: '', description: '' } : { id: 'hardware-none', name: 'None selected', image: '', description: '' },
        'bathroom-accessories': selectedBathroomAccessories.length ? { id: 'bathroom-accessories-summary', name: selectedBathroomAccessories.map((item) => item.name).join(', '), image: '', description: '' } : { id: 'bathroom-accessories-none', name: 'None added', image: '', description: '' },
      };
      setSelections(finalSelections);
      buildCompositeDataUrl(steps, finalSelections, selectedSize, selectedTileSize, compositeExtras).then((url) => {
        compositeRef.current = url;
        setCompositeDataUrl(url);
      });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function goBack() {
    if (showMoodboard) {
      setShowMoodboard(false);
      setSubmitStatus('idle');
    } else if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function restart() {
    setSelections({});
    setSelectedHardware([]);
    setSelectedAccessories([]);
    setSelectedBathroomAccessories([]);
    setCurrentStep(0);
    setShowMoodboard(false);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setFormErrors({});
    setSubmitStatus('idle');
    setSubmitErrorMessage('');
    setCompositeDataUrl(null);
    compositeRef.current = null;
    setBaseCategory(null);
    setFloorCategory('Vinyl');
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!contactName.trim()) errors.name = 'Full name is required.';
    if (!contactEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!contactPhone.trim()) errors.phone = 'Phone number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      setSubmitErrorMessage('');
      setSubmitStatus('compositing');

      // Build composite if not already done
      let dataUrl = compositeRef.current;
      if (!dataUrl) {
        dataUrl = await buildCompositeDataUrl(steps, selections, selectedSize, selectedTileSize, compositeExtras);
        compositeRef.current = dataUrl;
        setCompositeDataUrl(dataUrl);
      }

      setSubmitStatus('sending');

      const res = await fetch('/api/shower-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          selections: {
            ...selections,
            ...(selections['base'] ? { base: { ...selections['base'], name: selections['base'].category === 'bathtub' ? selections['base'].name : `${selections['base'].name} (${selectedSize})` } } : {}),
            ...(selections['tile'] ? { tile: { ...selections['tile'], name: `${selections['tile'].name} (${selectedTileSize}) · ${selections['tile'].surfaceFinish ?? selectedTileFinish}` } } : {}),
            ...(selections['floor']?.category === 'Tile' ? { floor: { ...selections['floor'], name: `${selections['floor'].name} · ${selections['floor'].surfaceFinish ?? selectedFloorTileFinish}` } } : {}),
          },
          hardware: selectedHardware.map((item) => ({ ...item, finish: item.category })),
          accessories: selectedAccessories.map((item) => ({ ...item, finish: item.finishable ? item.category : undefined })),
          bathroomAccessories: selectedBathroomAccessories.map((item) => ({ ...item, finish: item.category })),
          compositeImageDataUrl: dataUrl,
        }),
      });

      const result = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(result.error || 'The request could not be sent. Check the email settings and try again.');
      setSubmitStatus('success');
    } catch (error) {
      setSubmitErrorMessage(error instanceof Error ? error.message : 'The request could not be sent. Check the email settings and try again.');
      setSubmitStatus('error');
    }
  }

  const isSending = submitStatus === 'compositing' || submitStatus === 'sending';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/design-your-shower`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/design-your-shower`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/design-your-shower#webpage`,
          name: pageTitle,
          url: `${siteUrl}/design-your-shower`,
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#organization` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        {/* Page Header */}
        <section className="pt-40 pb-20 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-primary" />
                <span className="text-xs tracking-widest text-primary" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                  BATHROOM DESIGN
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-normal text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Design Your Bath
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Builder Body */}
        <section className="py-xxl bg-background min-h-screen">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">

            {!showMoodboard ? (
              <>
                {/* Progress Bar */}
                <div ref={progressRef} className="mb-12 scroll-mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs tracking-widest text-foreground/40 uppercase"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                    >
                      Step {currentStep + 1} of {totalSteps}
                    </span>
                    <span
                      className="text-xs tracking-widest text-primary uppercase"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                    >
                      {getStepLabel(step)}
                    </span>
                  </div>
                  <div className="space-y-6">
                    {[steps.slice(0, 6), steps.slice(6)].map((group, groupIndex) => (
                      <div key={groupIndex}>
                        <div className="mb-2 text-[10px] uppercase tracking-[.18em] text-foreground/35" style={{ fontFamily: 'var(--font-heading)' }}>
                          {groupIndex === 0 ? 'Shower' : 'Bathroom'}
                        </div>
                        <div className="flex items-center gap-2">
                          {group.map((s, index) => {
                            const i = groupIndex === 0 ? index : index + 6;
                            return (
                              <button key={s.id} onClick={() => setCurrentStep(i)} className="group relative flex-1" aria-label={`Go to ${getStepLabel(s)}`}>
                                <div className={`h-0.5 w-full transition-all duration-300 ${i <= currentStep ? 'bg-primary' : 'bg-border'}`} />
                                {selections[s.key] && i !== currentStep && <div className="absolute -top-1.5 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-primary"><Check size={7} className="text-primary-foreground" strokeWidth={3} /></div>}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-start gap-2">
                          {group.map((s, index) => {
                            const i = groupIndex === 0 ? index : index + 6;
                            return <div key={s.id} className="flex-1 text-center"><span className={`text-[10px] sm:text-xs lg:text-sm leading-tight uppercase transition-colors ${i === currentStep ? 'text-primary' : 'text-foreground/30'}`} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>{getStepLabel(s)}</span></div>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    variants={slideIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <h2
                      ref={stepHeadingRef}
                      className="scroll-mt-28 text-2xl lg:text-3xl font-normal text-foreground mb-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {getStepLabel(step)}
                    </h2>
                    <div className="h-px w-8 bg-primary mb-2" />
                    <p className="text-sm text-foreground/50 mb-8" style={{ fontFamily: 'var(--font-sans)' }}>
                      {getStepDescription(step)}
                    </p>

                    {/* Size selector — base step, standup category only */}
                    {isBaseStep && baseCategory === 'standup' && (
                      <div className="mb-10 border border-border bg-card p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px w-6 bg-primary" />
                          <p
                            className="text-[11px] uppercase tracking-widest text-primary"
                            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}
                          >
                            Select Base Size
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {BASE_SIZES.map((size) => {
                            const isActive = selectedSize === size;
                            return (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`relative inline-flex items-center gap-2 px-4 py-2.5 border text-sm transition-all duration-200 focus:outline-none ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'border-border bg-background text-foreground/50 hover:border-primary/50 hover:text-foreground/80'
                                }`}
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {isActive && (
                                  <Check size={11} className="text-primary shrink-0" strokeWidth={3} />
                                )}
                                {size}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-[11px] text-foreground/30 italic" style={{ fontFamily: 'var(--font-sans)' }}>
                          Selected size will be included in your design request.
                        </p>
                      </div>
                    )}

                    {/* Size selector — tile step only */}
                    {isTileStep && (
                      <div className="mb-10 border border-border bg-card p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px w-6 bg-primary" />
                          <p
                            className="text-[11px] uppercase tracking-widest text-primary"
                            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}
                          >
                            Select Tile Size
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {TILE_SIZES.map((size) => {
                            const isActive = selectedTileSize === size;
                            return (
                              <button
                                key={size}
                                onClick={() => setSelectedTileSize(size)}
                                className={`relative inline-flex items-center gap-2 px-4 py-2.5 border text-sm transition-all duration-200 focus:outline-none ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'border-border bg-background text-foreground/50 hover:border-primary/50 hover:text-foreground/80'
                                }`}
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {isActive && (
                                  <Check size={11} className="text-primary shrink-0" strokeWidth={3} />
                                )}
                                {size}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-[11px] text-foreground/30 italic" style={{ fontFamily: 'var(--font-sans)' }}>
                          Selected size will be included in your design request.
                        </p>
                      </div>
                    )}

                    {(isTileStep || (isFloorStep && floorCategory === 'Tile')) && (
                      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-5 py-4">
                        <div><p className="text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Tile surface</p><p className="mt-1 text-xs text-foreground/45">Choose the look for your tile.</p></div>
                        <div className="flex gap-2">
                          {(['Polished', 'Matte'] as const).map((finish) => {
                            const active = (isTileStep ? selectedTileFinish : selectedFloorTileFinish) === finish;
                            return <button key={finish} onClick={() => chooseSurfaceFinish(isTileStep ? 'tile' : 'floor', finish)} className={`border px-5 py-2.5 text-sm transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/55 hover:border-primary/50'}`} style={{ fontFamily: 'var(--font-heading)' }}>{finish}{active && <Check size={12} className="ml-2 inline" />}</button>;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Option Cards */}
                    {isTileStep ? (
                      /* Tile step — grouped portrait cards */
                      <div className="space-y-10 mb-10">
                        {['White', 'Gray', 'Black', 'Beige'].map((group) => {
                          const groupOptions = stepOptions.filter((o) => o.category === group);
                          if (groupOptions.length === 0) return null;
                          return (
                            <div key={group}>
                              <div className="flex items-center gap-3 mb-5">
                                <div className="h-px w-5 bg-primary shrink-0" />
                                <p
                                  className="text-[11px] uppercase tracking-widest text-primary"
                                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}
                                >
                                  {group}
                                </p>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {groupOptions.map((option) => {
                                  const isSelected = currentSelection?.id === option.id;
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={() => selectOption(option)}
                                      className={`group relative text-left border transition-all duration-300 overflow-hidden focus:outline-none flex flex-col ${
                                        isSelected ? 'border-primary bg-card' : 'border-border bg-card hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="relative w-full overflow-hidden bg-secondary" style={{ aspectRatio: '3/4' }}>
                                        <img
                                          src={option.image}
                                          alt={option.name}
                                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${selectedTileFinish === 'Polished' ? 'brightness-110 saturate-[0.92]' : ''}`}
                                          loading="lazy"
                                        />
                                        {selectedTileFinish === 'Polished' && <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />}
                                      </div>
                                      <div className="px-3 py-3">
                                        <p className="text-xs leading-snug text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                                          {option.name}
                                        </p>
                                        <p className="mt-1 text-[10px] uppercase tracking-wider text-foreground/40">{selectedTileFinish}</p>
                                      </div>
                                      {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                          <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                                        </div>
                                      )}
                                      {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : isBaseStep ? (
                      /* Base step — Standup Shower | Bathtub tab switcher */
                      <div className="mb-10">

                        {/* Tab bar — full-width underline style */}
                        <div className="flex border-b border-border mb-10">
                          {([
                            { key: 'standup' as BaseCategory, label: 'Standup Shower' },
                            { key: 'bathtub' as BaseCategory, label: 'Bathtub' },
                          ]).map((cat) => (
                            <button
                              key={cat.key}
                              onClick={() => { setBaseCategory(cat.key); setSelections((prev) => { const next = { ...prev }; delete next['base']; return next; }); }}
                              className={`relative flex-1 py-3 text-sm transition-all duration-200 focus:outline-none ${
                                baseCategory === cat.key
                                  ? 'text-foreground'
                                  : 'text-foreground/40 hover:text-foreground/70'
                              }`}
                              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}
                            >
                              {cat.label}
                              {baseCategory === cat.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                              )}
                            </button>
                          ))}
                        </div>

                        {!baseCategory && (
                          <p className="text-center text-muted-foreground text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                            Choose a shower base or bathtub.
                          </p>
                        )}

                        {/* Standup Shower — composites first, then named bases */}
                        {baseCategory === 'standup' && (
                          <div className="max-w-3xl mx-auto space-y-5">
                            {/* Composite bases */}
                            {stepOptions.filter((o) => o.category === 'bigbox').map((option) => {
                              const isSelected = currentSelection?.id === option.id;
                              return (
                                <BaseCard
                                  key={option.id}
                                  option={option}
                                  isSelected={isSelected}
                                  selectedSize={selectedSize}
                                  onSelect={() => selectOption(option)}
                                />
                              );
                            })}
                            {/* Divider between composite and standard */}
                            {stepOptions.filter((o) => o.category === 'bigbox').length > 0 && (
                              <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[11px] text-foreground/30 tracking-widest" style={{ fontFamily: 'var(--font-heading)' }}>OTHER OPTIONS</span>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                            )}
                            {/* Standard bases */}
                            {(['base-1','base-2','base-5','base-3','base-4'] as const).map((id) => {
                              const option = stepOptions.find((o) => o.id === id);
                              if (!option) return null;
                              const isSelected = currentSelection?.id === option.id;
                              return (
                                <BaseCard
                                  key={option.id}
                                  option={option}
                                  isSelected={isSelected}
                                  selectedSize={selectedSize}
                                  onSelect={() => selectOption(option)}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Bathtub — each tub centred, full-width within container */}
                        {baseCategory === 'bathtub' && (
                          <div className="max-w-3xl mx-auto space-y-5">
                            {stepOptions.filter((o) => o.category === 'bathtub').map((option) => {
                              const isSelected = currentSelection?.id === option.id;
                              return (
                                <BaseCard
                                  key={option.id}
                                  option={option}
                                  isSelected={isSelected}
                                  selectedSize={null}
                                  onSelect={() => selectOption(option)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : isTapsStep ? (
                      /* Taps step — finish chips at top, 5 model cards below */
                      <div className="mb-10">
                        {/* Finish selector */}
                        <p className="text-[11px] uppercase tracking-widest text-foreground/40 mb-4" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}>
                          Select Finish
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {TAP_FINISHES.map((finish) => {
                            const isActive = selectedFinish === finish;
                            return (
                              <button
                                key={finish}
                                onClick={() => {
                                  setSelectedFinish(finish);
                                  setSelections((prev) => { const next = { ...prev }; delete next.taps; return next; });
                                }}
                                className={`px-5 py-2.5 border text-sm transition-all duration-200 focus:outline-none flex items-center gap-2 ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'border-border text-foreground/50 hover:border-primary/50 hover:text-foreground/80'
                                }`}
                                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}
                              >
                                <span className={`w-3 h-3 rounded-full border shrink-0 ${
                                  finish === 'Chrome' ? 'bg-gray-300 border-gray-400' :
                                  finish === 'Matte Black' ? 'bg-zinc-900 border-zinc-700' :
                                  finish === 'Brushed Nickel' ? 'bg-stone-400 border-stone-500' :
                                  'bg-yellow-600 border-yellow-700'
                                }`} />
                                {finish}
                                {isActive && <Check size={11} className="text-primary shrink-0" strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* 5 model cards for selected finish */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stepOptions
                            .filter((o) => o.category === selectedFinish && getMoenTapImage(o))
                            .map((option) => {
                              const isSelected = currentSelection?.id === option.id;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => selectOption(option)}
                                  className={`group relative text-left border transition-all duration-300 overflow-hidden focus:outline-none flex flex-col ${
                                    isSelected ? 'border-primary bg-card' : 'border-border bg-card hover:border-primary/40'
                                  }`}
                                >
                                  {/* Square product image */}
                                  <div className="w-full bg-white overflow-hidden p-4 sm:p-6" style={{ aspectRatio: '4/3' }}>
                                    <img
                                      src={getMoenTapImage(option)}
                                      alt={option.name}
                                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                                      loading="lazy"
                                    />
                                  </div>
                                  {/* Name + finish bar */}
                                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 flex-1">
                                    <div>
                                      <p className="text-sm text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                                        {option.name}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`w-2 h-2 rounded-full border shrink-0 ${
                                          selectedFinish === 'Chrome' ? 'bg-gray-300 border-gray-400' :
                                          selectedFinish === 'Matte Black' ? 'bg-zinc-900 border-zinc-700' :
                                          selectedFinish === 'Brushed Nickel' ? 'bg-stone-400 border-stone-500' :
                                          'bg-yellow-600 border-yellow-700'
                                        }`} />
                                        <span className="text-[10px] text-foreground/40" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                                          {selectedFinish}
                                        </span>
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                                        <Check size={11} className="text-primary-foreground" strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border border-border/50 shrink-0" />
                                    )}
                                  </div>
                                  {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
                                </button>
                              );
                            })}
                        </div>

                        {/* Spec sheet link */}
                        <div className="mt-6 flex justify-center">
                          <a
                            href="/data/ALL - POSITEMP.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-foreground/40 hover:text-primary border-b border-foreground/20 hover:border-primary transition-colors duration-200"
                            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}
                          >
                            View Full Spec Sheet (Positemp)
                          </a>
                        </div>
                      </div>
                    ) : isDoorsStep ? (
                      <div className="mb-10">
                        <p className="text-[11px] uppercase tracking-widest text-foreground/40 mb-4" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}>
                          Door Hardware Finish
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {TAP_FINISHES.map((finish) => (
                            <button key={finish} onClick={() => setSelectedFinish(finish)} className={`px-5 py-2.5 border text-sm transition-all flex items-center gap-2 ${selectedFinish === finish ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-foreground/50 hover:border-primary/50'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                              <span className={`w-3 h-3 rounded-full border ${finish === 'Chrome' ? 'bg-gray-300 border-gray-400' : finish === 'Matte Black' ? 'bg-zinc-900 border-zinc-700' : finish === 'Brushed Nickel' ? 'bg-stone-400 border-stone-500' : 'bg-yellow-600 border-yellow-700'}`} />
                              {finish}{selectedFinish === finish && <Check size={11} className="text-primary" />}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {stepOptions.map((option) => {
                            const image = option.finishImages?.[selectedFinish] ?? option.image;
                            const isSelected = currentSelection?.id === option.id && currentSelection?.category === selectedFinish;
                            return (
                              <button key={option.id} onClick={() => selectOption(option)} className={`group relative text-left border transition-all duration-300 overflow-hidden bg-card ${isSelected ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                                <div className="w-full bg-white overflow-hidden p-2 sm:p-3" style={{ aspectRatio: '4/3' }}>
                                  <img src={image} alt={`${option.name} in ${selectedFinish}`} className="block w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
                                </div>
                                <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border/50">
                                  <div>
                                    <p className="text-lg text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</p>
                                    <p className="text-xs text-foreground/45 mt-1">{selectedFinish}</p>
                                  </div>
                                  {isSelected ? <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Check size={12} className="text-primary-foreground" /></span> : <span className="w-6 h-6 rounded-full border border-border" />}
                                </div>
                                {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : isFloorStep ? (
                      <div className="mb-10">
                        <div className="mb-8 flex border-b border-border">
                          {(['Vinyl', 'Tile'] as FloorCategory[]).map((category) => (
                            <button key={category} onClick={() => { setFloorCategory(category); setSelections((previous) => { const next = { ...previous }; delete next.floor; return next; }); }} className={`relative flex-1 py-3 text-sm transition-colors ${floorCategory === category ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/70'}`} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                              {category}
                              {floorCategory === category && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
                            </button>
                          ))}
                        </div>
                        {floorCategory === 'Tile' ? <div className="space-y-10">
                          {['White', 'Gray', 'Black', 'Beige'].map((group) => <section key={group}>
                            <div className="mb-5 flex items-center gap-3"><div className="h-px w-5 bg-primary" /><h3 className="text-[11px] uppercase tracking-[.18em] text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{group}</h3><div className="h-px flex-1 bg-border" /></div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                              {stepOptions.filter((option) => option.category === 'Tile' && option.group === group).map((option) => {
                                const selected = currentSelection?.id === option.id;
                                return <button key={option.id} onClick={() => selectOption(option)} className={`group relative overflow-hidden border bg-card text-left transition-all ${selected ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                                  <div className="relative aspect-square overflow-hidden bg-white"><img src={option.image} alt={option.name} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${selectedFloorTileFinish === 'Polished' ? 'brightness-110' : ''}`} />{selectedFloorTileFinish === 'Polished' && <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />}</div>
                                  <div className="p-3"><p className="text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</p><p className="mt-1 text-[10px] uppercase text-foreground/40">{selectedFloorTileFinish}</p></div>
                                  {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary"><Check size={10} className="text-primary-foreground" /></span>}
                                </button>;
                              })}
                            </div>
                          </section>)}
                        </div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                          {stepOptions.filter((option) => option.category === floorCategory).map((option) => {
                            const selected = currentSelection?.id === option.id;
                            return <button key={option.id} onClick={() => selectOption(option)} className={`group relative overflow-hidden border bg-card text-left transition-all ${selected ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                              <div className="h-52 overflow-hidden bg-white"><img src={option.image} alt={option.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                              <div className="p-4"><p className="text-base text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</p><p className="mt-1 text-xs text-foreground/45">{option.description}</p></div>
                              {selected && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary"><Check size={12} className="text-primary-foreground" /></span>}
                            </button>;
                          })}
                        </div>}
                      </div>
                    ) : isVanityStep ? (
                      <div className="mb-10 space-y-10">
                        {['Single Sink', 'Single Sink — Floor Standing', 'Double Sink — Floor Standing'].map((group) => <section key={group}>
                          <div className="mb-5 flex items-center gap-3"><div className="h-px w-5 bg-primary" /><h3 className="text-[11px] uppercase tracking-[.18em] text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{group}</h3><div className="h-px flex-1 bg-border" /></div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {stepOptions.filter((option) => option.group === group).map((option) => {
                              const selected = currentSelection?.id === option.id;
                              return <button key={option.id} onClick={() => selectOption(option)} className={`group relative overflow-hidden border bg-card text-left transition-all ${selected ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                                <div className="h-40 bg-white p-2"><img src={option.image} alt={option.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" /></div>
                                <div className="border-t border-border/50 p-3"><p className="text-sm leading-snug text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</p><p className="mt-1 text-[10px] text-foreground/40">{option.description}</p></div>
                                {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary"><Check size={10} className="text-primary-foreground" /></span>}
                              </button>;
                            })}
                          </div>
                        </section>)}
                      </div>
                    ) : isWallColourStep ? (
                      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                        {stepOptions.map((option) => {
                          const selected = currentSelection?.id === option.id;
                          return <button key={option.id} onClick={() => selectOption(option)} className={`relative border p-3 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}>
                            <span className="mb-3 block h-20 w-full border border-black/10 shadow-inner" style={{ backgroundColor: option.swatch }} />
                            <span className="text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</span>
                            {selected && <span className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full bg-primary"><Check size={10} className="text-primary-foreground" /></span>}
                          </button>;
                        })}
                      </div>
                    ) : isHardwareStep || isAccessoriesStep || isBathroomAccessoriesStep ? (
                      <div className="mb-10">
                        <p className="text-[11px] uppercase tracking-widest text-foreground/40 mb-4" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}>
                          {isHardwareStep ? 'Hardware Finish' : isBathroomAccessoriesStep ? 'Towel Bar Finish' : 'Shelf & Grab Bar Finish'}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {TAP_FINISHES.map((finish) => (
                            <button key={finish} onClick={() => setSelectedFinish(finish)} className={`px-5 py-2.5 border text-sm transition-all flex items-center gap-2 ${selectedFinish === finish ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-foreground/50 hover:border-primary/50'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                              <span className={`w-3 h-3 rounded-full border ${finish === 'Chrome' ? 'bg-gray-300 border-gray-400' : finish === 'Matte Black' ? 'bg-zinc-900 border-zinc-700' : finish === 'Brushed Nickel' ? 'bg-stone-400 border-stone-500' : 'bg-yellow-600 border-yellow-700'}`} />
                              {finish}{selectedFinish === finish && <Check size={11} className="text-primary" />}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-10">
                          {(isHardwareStep ? ['Rain Heads', 'Handhelds & Slider Bars'] : isBathroomAccessoriesStep ? ['Mirrors', 'Towel Bar Sets'] : ['Shelves', 'Benches & Footrests', 'Grab Bars']).map((group) => {
                            const groupOptions = stepOptions.filter((option) => option.group === group && (!isHardwareStep || option.finishImages?.[selectedFinish]));
                            if (!groupOptions.length) return null;
                            return (
                              <section key={group}>
                                <div className="flex items-center gap-3 mb-5">
                                  <div className="h-px w-5 bg-primary shrink-0" />
                                  <h3 className="text-[11px] uppercase tracking-widest text-primary" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}>{group}</h3>
                                  <div className="h-px flex-1 bg-border" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {groupOptions.map((option) => {
                                    const selectedItems = isHardwareStep ? selectedHardware : isBathroomAccessoriesStep ? selectedBathroomAccessories : selectedAccessories;
                                    const usesFinish = isHardwareStep || option.finishable;
                                    const activeItem = selectedItems.find((item) => item.id === option.id && (!usesFinish || item.category === selectedFinish));
                                    const active = Boolean(activeItem);
                                    const image = option.finishImages?.[selectedFinish] ?? option.image;
                                    const allowsQuantity = isAccessoriesStep && (group === 'Shelves' || group === 'Grab Bars');
                                    const kind: ExtraKind = isHardwareStep ? 'hardware' : isBathroomAccessoriesStep ? 'bathroom-accessories' : 'accessories';
                                    return (
                                      <div key={option.id} className={`group relative overflow-hidden border transition-all ${active ? 'border-primary bg-card' : 'border-border bg-card hover:border-primary/50'}`}>
                                        <button onClick={() => allowsQuantity ? (!active && adjustAccessoryQuantity(option, 1)) : toggleFinalExtra(kind, option)} className="block w-full text-left">
                                          {option.image && <div className="flex w-full items-center justify-center bg-white/95 p-4" style={{ aspectRatio: '4/3' }}><img src={image} alt={option.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" /></div>}
                                          <div className="px-5 py-4">
                                            <div className="mb-3 h-px w-6 bg-primary" />
                                            <p className="text-lg text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{option.name}</p>
                                            <p className="mt-1 text-sm text-foreground/45">{option.description}</p>
                                            {usesFinish && <p className="mt-2 text-xs text-primary">{selectedFinish}</p>}
                                          </div>
                                          <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${active ? 'bg-primary' : 'border border-border bg-background'}`}>{active && <Check size={12} className="text-primary-foreground" />}</span>
                                        </button>
                                        {allowsQuantity && <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
                                          <span className="text-[10px] uppercase tracking-widest text-foreground/45">Quantity</span>
                                          <div className="flex items-center gap-3">
                                            <button type="button" aria-label={`Remove one ${option.name}`} onClick={() => adjustAccessoryQuantity(option, -1)} disabled={!activeItem} className="flex h-8 w-8 items-center justify-center border border-border text-lg text-foreground/70 disabled:opacity-25">−</button>
                                            <span className="min-w-5 text-center text-sm text-primary">{activeItem?.quantity ?? 0}</span>
                                            <button type="button" aria-label={`Add one ${option.name}`} onClick={() => adjustAccessoryQuantity(option, 1)} className="flex h-8 w-8 items-center justify-center border border-primary/60 text-lg text-primary">+</button>
                                          </div>
                                        </div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                        <p className="text-xs text-foreground/40 mt-4">{isHardwareStep ? 'Select as many hardware items as you need.' : isBathroomAccessoriesStep ? 'Add a mirror, a matching towel set, or both.' : 'Optional. Use + and − to add multiple shelves and grab bars.'}</p>
                        {isHardwareStep && <div className="mt-5"><a href="/data/SHOWERHEAD.pdf" target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-widest text-foreground/45 border-b border-foreground/20 hover:text-primary hover:border-primary transition-colors">View Shower Head Spec Sheet</a></div>}
                      </div>
                    ) : (
                      /* All other steps — original landscape card layout */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        {stepOptions.map((option) => {
                          const isSelected = currentSelection?.id === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={() => selectOption(option)}
                              className={`group relative text-left border transition-all duration-300 overflow-hidden focus:outline-none flex flex-row ${
                                isSelected
                                  ? 'border-primary bg-card'
                                  : 'border-border bg-card hover:border-primary/50'
                              }`}
                            >
                              <div className="w-44 shrink-0 bg-secondary flex items-center justify-center" style={{ minHeight: '140px' }}>
                                <img
                                  src={option.image}
                                  alt={option.name}
                                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                                  style={{ minHeight: '140px', maxHeight: '180px' }}
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex flex-col justify-center px-5 py-4 flex-1 min-w-0">
                                <div className="h-px w-6 bg-primary mb-3" />
                                <p
                                  className="text-lg font-normal text-foreground mb-1.5 leading-snug"
                                  style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                  {option.name}
                                </p>
                                <p
                                  className="text-sm text-foreground/45 leading-relaxed"
                                  style={{ fontFamily: 'var(--font-sans)' }}
                                >
                                  {option.description}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                                  <Check size={12} className="text-primary-foreground" strokeWidth={3} />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={goBack}
                        disabled={currentStep === 0}
                        className="inline-flex items-center gap-2 px-6 py-3 border border-border text-xs tracking-widest text-foreground/50 hover:border-primary/50 hover:text-foreground transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                      >
                        <ArrowLeft size={13} /> BACK
                      </button>
                      <button
                        onClick={goNext}
                        disabled={!currentSelection && !isHardwareStep && !isAccessoriesStep && !isBathroomAccessoriesStep}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
                      >
                        {isLastStep ? 'VIEW MY DESIGN' : 'NEXT'} <ArrowRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              /* ── Mood Board ── */
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-10 bg-primary" />
                  <span
                    className="text-xs tracking-widest text-primary"
                    style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
                  >
                    YOUR DESIGN
                  </span>
                </div>
                <h2
                  ref={designHeadingRef}
                  className="scroll-mt-28 text-3xl lg:text-4xl font-normal text-foreground mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Your Design
                </h2>
                <div className="h-px w-10 bg-primary mb-4" />
                <p className="text-sm text-foreground/50 mb-10 max-w-xl" style={{ fontFamily: 'var(--font-sans)' }}>
                  Review your selections below, then send us your design request.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start mb-10">
                  <section className="border border-border bg-card p-4 sm:p-6 min-w-0 lg:sticky lg:top-8">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div><p className="text-xs tracking-widest text-primary uppercase" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>AI Bathroom Rendering</p><p className="text-xs text-foreground/40 mt-1">Updates automatically as you change selections.</p></div>
                      {currentGeneratedImage && <a href={currentGeneratedImage} download="modessi-realistic-bathroom.jpg" className="text-[11px] uppercase tracking-widest text-foreground/50 hover:text-primary shrink-0">Download</a>}
                    </div>
                    {!uploadedBathroomPhoto && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-4">
                      <div><p className="text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Use your bathroom photo</p></div>
                      <label className="cursor-pointer border border-primary/60 px-4 py-2.5 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/10">Upload bathroom photo<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleBathroomPhotoUpload(event.target.files[0])} /></label>
                    </div>}
                    <div className="relative">
                    {currentGeneratedImage ? <div className="relative aspect-[3/2] overflow-hidden border border-border bg-black"><img src={currentGeneratedImage} alt="AI-generated bathroom rendering using the selected materials and fixtures" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute left-4 top-4 rounded-full border border-primary/40 bg-black/75 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-primary">Generated bathroom concept</div></div> : <div className="flex aspect-[3/2] items-center justify-center border border-border bg-black text-center">
                      {aiPreviewStatus === 'error' && failedPreviewFingerprint === designFingerprint ? <div className="flex flex-col items-center gap-3 px-6"><p role="status" className="text-sm text-foreground/50">Preview could not be updated.</p><button type="button" onClick={() => { setFailedPreviewFingerprint(''); autoPreviewFingerprintRef.current = ''; void generateRealisticBathroomPreview(); }} className="border border-primary/70 px-4 py-2 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10">Try again</button></div> : <div className="flex flex-col items-center gap-3"><Loader2 size={30} className="animate-spin text-primary"/><span className="text-xs uppercase tracking-[.16em] text-white">Creating your bathroom</span></div>}
                    </div>}
                    </div>
                  </section>

                  <aside className="border border-border bg-card p-5">
                    <h3 className="text-sm tracking-widest text-primary mb-2 uppercase" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>Your Selections</h3>
                    <p className="text-xs text-foreground/40 mb-5">Open a section to change it without leaving this page.</p>
                    <div className="space-y-2">
                      {steps.map((s) => {
                        const sel = selections[s.key];
                        const displayName = s.key === 'base' && sel ? (sel.category === 'bathtub' ? sel.name : `${sel.name} — ${selectedSize}`)
                          : s.key === 'tile' && sel ? `${sel.name} — ${selectedTileSize} · ${sel.surfaceFinish ?? selectedTileFinish}`
                          : s.key === 'hardware' ? (selectedHardware.map((item) => item.name).join(', ') || 'None selected')
                          : s.key === 'accessories' ? (selectedAccessories.map((item) => `${item.name}${(item.quantity ?? 1) > 1 ? ` ×${item.quantity}` : ''}`).join(', ') || 'None added')
                          : s.key === 'bathroom-accessories' ? (selectedBathroomAccessories.map((item) => item.name).join(', ') || 'None added')
                          : sel ? `${sel.name}${sel.surfaceFinish ? ` · ${sel.surfaceFinish}` : ''}` : '—';
                        return (
                          <details key={s.id} className="group border border-border/70 bg-background open:border-primary/50">
                            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-primary/80 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{getStepLabel(s)}</p><p className="text-xs text-foreground/75 truncate">{displayName}</p></div>
                              <span className="text-primary transition-transform group-open:rotate-90">›</span>
                            </summary>
                            <div className="border-t border-border p-3">
                              {(s.key === 'tile' || s.key === 'floor') && <div className="mb-3 space-y-2">
                                {s.key === 'floor' && <div className="grid grid-cols-2 gap-1.5">{(['Vinyl', 'Tile'] as FloorCategory[]).map((category) => <button key={category} onClick={() => setFloorCategory(category)} className={`border px-2 py-2 text-[10px] ${floorCategory === category ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/50'}`}>{category}</button>)}</div>}
                                {(s.key === 'tile' || floorCategory === 'Tile') && <div className="grid grid-cols-2 gap-1.5">{(['Polished', 'Matte'] as const).map((finish) => { const active = (s.key === 'tile' ? selectedTileFinish : selectedFloorTileFinish) === finish; return <button key={finish} onClick={() => chooseSurfaceFinish(s.key as 'tile' | 'floor', finish)} className={`border px-2 py-2 text-[10px] ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/50'}`}>{finish}</button>; })}</div>}
                              </div>}
                              {(s.key === 'taps' || s.key === 'hardware' || s.key === 'doors' || s.key === 'accessories' || s.key === 'bathroom-accessories') && <div className="grid grid-cols-2 gap-1.5 mb-3">{TAP_FINISHES.map((finish) => <button key={finish} onClick={() => setSelectedFinish(finish)} className={`px-2 py-2 text-[10px] border ${selectedFinish === finish ? 'border-primary text-primary bg-primary/10' : 'border-border text-foreground/45'}`}>{finish}</button>)}</div>}
                              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                                {(s.options as unknown as SelectionOption[]).filter((option) => {
                                  if (s.key === 'taps') return option.category === selectedFinish && getMoenTapImage(option);
                                  if (s.key === 'hardware') return option.finishImages?.[selectedFinish];
                                  if (s.key === 'floor') return option.category === floorCategory;
                                  return true;
                                }).map((option) => {
                                  const isExtra = s.key === 'hardware' || s.key === 'accessories' || s.key === 'bathroom-accessories';
                                  const usesFinish = s.key === 'hardware' || option.finishable;
                                  const list = s.key === 'hardware' ? selectedHardware : s.key === 'bathroom-accessories' ? selectedBathroomAccessories : selectedAccessories;
                                  const activeItem = isExtra ? list.find((item) => item.id === option.id && (!usesFinish || item.category === selectedFinish)) : undefined;
                                  const active = isExtra
                                    ? Boolean(activeItem)
                                    : sel?.id === option.id && (!usesFinish || sel.category === selectedFinish);
                                  const image = s.key === 'taps' ? getMoenTapImage(option) : option.finishImages?.[selectedFinish] ?? option.image;
                                  const allowsQuantity = s.key === 'accessories' && (option.group === 'Shelves' || option.group === 'Grab Bars');
                                  return <div key={option.id} className={`relative border ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                    <button onClick={() => allowsQuantity ? (!active && adjustAccessoryQuantity(option, 1)) : isExtra ? toggleFinalExtra(s.key as ExtraKind, option) : updateFinalSelection(s.key, option)} className="block w-full p-2 text-left">
                                      {image && <div className="mb-2 h-20 bg-white"><img src={image} alt={option.name} className="h-full w-full object-contain" /></div>}
                                      {option.swatch && <span className="mb-2 block h-16 w-full border border-black/10" style={{ backgroundColor: option.swatch }} />}
                                      <p className="text-[11px] leading-tight text-foreground/80">{option.name}</p>
                                      {(s.key === 'tile' || (s.key === 'floor' && option.category === 'Tile')) && <p className="mt-1 text-[9px] text-foreground/40">{s.key === 'tile' ? selectedTileFinish : selectedFloorTileFinish}</p>}
                                      {usesFinish && <p className="mt-1 text-[9px] text-primary">{selectedFinish}</p>}
                                      {active && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary"><Check size={9} className="text-primary-foreground" /></span>}
                                    </button>
                                    {allowsQuantity && <div className="flex items-center justify-center gap-2 border-t border-border/60 p-1.5"><button onClick={() => adjustAccessoryQuantity(option, -1)} disabled={!activeItem} className="h-6 w-6 border border-border text-sm disabled:opacity-20">−</button><span className="min-w-4 text-center text-[10px] text-primary">{activeItem?.quantity ?? 0}</span><button onClick={() => adjustAccessoryQuantity(option, 1)} className="h-6 w-6 border border-primary/60 text-sm text-primary">+</button></div>}
                                  </div>;
                                })}
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </aside>
                </div>

                {/* ── Contact Form ── */}
                {submitStatus !== 'success' && (
                  <div className="border border-border bg-card p-6 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8 bg-primary" />
                      <h3
                        className="text-sm tracking-widest text-primary uppercase"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                      >
                        Your Contact Information
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/40 mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
                      All fields are required. We'll use these details to follow up on your design request.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-[11px] uppercase tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                        >
                          Full Name <span className="text-primary">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          value={contactName}
                          onChange={(e) => {
                            setContactName(e.target.value);
                            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                          }}
                          placeholder="Jane Smith"
                          className={`w-full bg-background border px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary transition-colors ${
                            formErrors.name ? 'border-red-500/60' : 'border-border'
                          }`}
                          style={{ fontFamily: 'var(--font-sans)' }}
                        />
                        {formErrors.name && (
                          <p className="mt-1.5 text-[11px] text-red-400" style={{ fontFamily: 'var(--font-sans)' }}>
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-[11px] uppercase tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                        >
                          Email Address <span className="text-primary">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => {
                            setContactEmail(e.target.value);
                            if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          placeholder="jane@example.com"
                          className={`w-full bg-background border px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary transition-colors ${
                            formErrors.email ? 'border-red-500/60' : 'border-border'
                          }`}
                          style={{ fontFamily: 'var(--font-sans)' }}
                        />
                        {formErrors.email && (
                          <p className="mt-1.5 text-[11px] text-red-400" style={{ fontFamily: 'var(--font-sans)' }}>
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-[11px] uppercase tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                        >
                          Phone Number <span className="text-primary">*</span>
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => {
                            setContactPhone(e.target.value);
                            if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          placeholder="519-555-0100"
                          className={`w-full bg-background border px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary transition-colors ${
                            formErrors.phone ? 'border-red-500/60' : 'border-border'
                          }`}
                          style={{ fontFamily: 'var(--font-sans)' }}
                        />
                        {formErrors.phone && (
                          <p className="mt-1.5 text-[11px] text-red-400" style={{ fontFamily: 'var(--font-sans)' }}>
                            {formErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Success State ── */}
                {submitStatus === 'success' && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="border border-primary/40 bg-primary/5 p-8 mb-8 text-center"
                  >
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={22} className="text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <h3
                      className="text-xl font-normal text-foreground mb-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Design Request Sent
                    </h3>
                    <p className="text-sm text-foreground/50 max-w-md mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
                      Thank you, <span className="text-foreground/80">{contactName}</span>. We've received your shower design and will be in touch at <span className="text-foreground/80">{contactEmail}</span> shortly.
                    </p>
                  </motion.div>
                )}

                {/* ── Error State ── */}
                {submitStatus === 'error' && (
                  <div className="border border-primary/30 bg-primary/5 px-5 py-4 mb-6">
                    <p className="text-xs text-foreground/70" style={{ fontFamily: 'var(--font-sans)' }}>
                      {submitErrorMessage || 'The request could not be sent. Please try again or call us at 519-556-8217.'}
                    </p>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {submitStatus !== 'success' && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSending}
                      className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {submitStatus === 'compositing' ? 'PREPARING…' : 'SENDING…'}
                        </>
                      ) : (
                        <>
                          <Send size={14} /> SEND DESIGN REQUEST
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={goBack}
                    disabled={isSending}
                    className="inline-flex items-center gap-2 px-6 py-4 border border-border text-xs tracking-widest text-foreground/50 hover:border-primary/50 hover:text-foreground transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                  >
                    <ArrowLeft size={13} /> EDIT DESIGN
                  </button>

                  <button
                    onClick={restart}
                    disabled={isSending}
                    className="text-xs tracking-widest text-foreground/30 hover:text-foreground/60 transition-colors underline underline-offset-4 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                  >
                    START OVER
                  </button>
                </div>

                {!allSelected && (
                  <p className="mt-6 text-xs text-foreground/30 italic" style={{ fontFamily: 'var(--font-sans)' }}>
                    Some steps were skipped. You can go back to complete them.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
