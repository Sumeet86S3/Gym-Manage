import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Camera,
  Cookie,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
  Coffee,
  Dumbbell,
  Droplets,
  Salad,
  Soup,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { MealTypeBadge } from "@/components/meal/meal-type-badge";
import type { MealEntry, MealType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/meals")({
  component: ClientMealsPage,
});

const mealOptions: { value: MealType; icon: LucideIcon; hint: string }[] = [
  { value: "Warm water", icon: Droplets, hint: "Hydration check" },
  { value: "Breakfast", icon: Coffee, hint: "Morning fuel" },
  { value: "Lunch", icon: Salad, hint: "Midday refuel" },
  { value: "Evening Snack", icon: Cookie, hint: "Light evening bite" },
  { value: "Dinner", icon: Soup, hint: "Evening recovery" },
  { value: "Pre-Workout", icon: Dumbbell, hint: "Before training" },
  { value: "Post-Workout", icon: Dumbbell, hint: "After training" },
];

const MAX_MEAL_IMAGE_SIZE = 10 * 1024 * 1024;
const MEAL_IMAGE_MAX_DIMENSION = 1600;
const MEAL_IMAGE_QUALITY = 0.78;

function ClientMealsPage() {
  const { user } = useAuth();
  const { data: loadedMeals, setData: setLoadedMeals } = useApiResource<
    Array<MealEntry & { imageUrl?: string; loggedAt?: string }>
  >("/meals", []);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const compressionIdRef = useRef(0);
  const [type, setType] = useState<MealType>("Breakfast");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<{
    dataUrl: string;
    fileName: string;
    originalSize: number;
    optimizedSize: number;
  } | null>(null);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const meals = useMemo(() => loadedMeals.map(normalizeMealEntry), [loadedMeals]);
  const setMeals = setLoadedMeals;

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > MAX_MEAL_IMAGE_SIZE) {
      toast.error("Please upload an image under 10MB");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    const compressionId = compressionIdRef.current + 1;
    compressionIdRef.current = compressionId;
    setSelectedFile(file);
    setOptimizedImage(null);
    setOptimizingImage(true);
    setPreview(url);

    optimizeMealImage(file)
      .then((optimized) => {
        if (compressionIdRef.current !== compressionId) return;
        setOptimizedImage(optimized);
      })
      .catch(() => {
        if (compressionIdRef.current !== compressionId) return;
        toast.error("Unable to optimize this image. Try another photo.");
      })
      .finally(() => {
        if (compressionIdRef.current === compressionId) setOptimizingImage(false);
      });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    compressionIdRef.current += 1;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setOptimizedImage(null);
    setOptimizingImage(false);
    setNote("");
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const submit = async () => {
    if (!selectedFile) {
      toast.error("Add a meal photo first");
      return;
    }
    setSubmitting(true);
    try {
      const image = optimizedImage ?? (await optimizeMealImage(selectedFile));
      const now = new Date();
      const saved = await api<{
        id: string;
        clientId: string;
        type: MealType;
        note?: string;
        imageUrl: string;
        loggedAt: string;
      }>("/meals", {
        method: "POST",
        body: JSON.stringify({
          type,
          note: note.trim() || undefined,
          imageData: image.dataUrl,
          imageFileName: image.fileName,
          loggedAt: now.toISOString(),
        }),
      });
      const entry: MealEntry = {
        id: saved.id,
        clientId: saved.clientId,
        clientName: user?.name ?? "You",
        type: saved.type,
        time: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        timestamp: new Date(saved.loggedAt).getTime(),
        note: saved.note,
        image: saved.imageUrl,
      };
      setMeals((m) => [entry, ...m]);
      toast.success("Meal uploaded! Your trainer can see it now. 🥗");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload meal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meal Tracker"
        description="Snap, log, and stay accountable. Your trainer sees every entry in real time."
      />

      {/* Upload card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/15 via-primary-glow/10 to-accent/15 blur-2xl" />
        <div className="relative grid gap-6 p-5 md:grid-cols-[1.1fr_1fr] md:p-7">
          {/* Upload area */}
          <div>
            <label className="text-sm font-medium text-foreground">Meal photo</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "group relative mt-2 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
                dragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted/60",
              )}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Meal preview" className="h-full w-full object-cover" />
                  <button
                    onClick={reset}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-card backdrop-blur transition hover:scale-105"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow">
                    <UploadCloud className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Drag & drop your meal photo
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PNG, JPG up to 10MB — or pick a source below
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium shadow-soft transition hover:bg-muted"
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium shadow-soft transition hover:bg-muted"
                    >
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-foreground">Meal type</label>
              <Select value={type} onValueChange={(v) => setType(v as MealType)}>
                <SelectTrigger className="mt-2 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{opt.value}</span>
                        <span className="text-xs text-muted-foreground">· {opt.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="e.g. High protein breakfast, cheat meal, post workout meal…"
                className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className={cn(
                "group relative mt-auto inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-glow px-5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-70",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {optimizingImage ? "Optimizing…" : "Uploading…"}
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload Meal
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Today's Meal Uploads
            </h2>
            <p className="text-sm text-muted-foreground">
              {meals.length} {meals.length === 1 ? "entry" : "entries"} logged
            </p>
          </div>
        </div>

        {meals.length === 0 ? (
          <EmptyMeals />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((m) => (
              <MealHistoryCard key={m.id} meal={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function normalizeMealEntry(meal: MealEntry & { imageUrl?: string; loggedAt?: string }): MealEntry {
  const loggedAt = meal.loggedAt ? new Date(meal.loggedAt) : undefined;
  return {
    ...meal,
    image: meal.image ?? meal.imageUrl ?? "",
    timestamp: meal.timestamp ?? (loggedAt ? loggedAt.getTime() : Date.now()),
    time:
      meal.time ??
      (loggedAt ? loggedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Now"),
  };
}

async function optimizeMealImage(file: File) {
  if (file.size <= 500 * 1024 && /^image\/jpe?g$/i.test(file.type)) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      fileName: file.name,
      originalSize: file.size,
      optimizedSize: estimateDataUrlBytes(dataUrl),
    };
  }

  const image = await loadImageSource(file);
  const scale = Math.min(1, MEAL_IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Unable to optimize meal image.");

  context.drawImage(image.source, 0, 0, width, height);
  image.close?.();

  const blob = await canvasToBlob(canvas, "image/jpeg", MEAL_IMAGE_QUALITY);
  const dataUrl = await readFileAsDataUrl(blob);

  return {
    dataUrl,
    fileName: replaceImageExtension(file.name, "jpg"),
    originalSize: file.size,
    optimizedSize: blob.size,
  };
}

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadHtmlImage(dataUrl);
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load meal image."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to optimize meal image."));
      },
      type,
      quality,
    );
  });
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read meal image."));
    };
    reader.onerror = () => reject(new Error("Unable to read meal image."));
    reader.readAsDataURL(file);
  });
}

function replaceImageExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName || "meal-photo"}.${extension}`;
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function MealHistoryCard({ meal }: { meal: MealEntry }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={meal.image}
          alt={meal.type}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <MealTypeBadge type={meal.type} />
        </div>
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {meal.time}
        </div>
        {meal.note && <p className="line-clamp-2 text-sm text-foreground">{meal.note}</p>}
      </div>
    </article>
  );
}

function EmptyMeals() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UploadCloud className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">No meals logged yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload your first meal photo above — your trainer will see it instantly.
      </p>
    </div>
  );
}
