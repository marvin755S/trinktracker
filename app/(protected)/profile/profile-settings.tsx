"use client";
/* eslint-disable @next/next/no-img-element */

import { updateAvatarPath, updateProfileName } from "@/lib/profile-actions";
import { createClient } from "@/lib/supabase";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSettings({ initialName, email, userId, avatarUrl }: { initialName: string; email: string; userId: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const cropCanvas = useRef<HTMLCanvasElement>(null);
  const cropEditor = useRef<HTMLDivElement>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [editorSize, setEditorSize] = useState({ width: 288, height: 288 });
  const cropDiameter = Math.min(160, Math.min(editorSize.width, editorSize.height) * 0.72);

  useEffect(() => {
    if (!cropImage || !cropCanvas.current) return;
    const canvas = cropCanvas.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const cropSize = Math.min(cropImage.naturalWidth, cropImage.naturalHeight) / zoom;
    const circleRadius = cropDiameter / 2;
    const horizontalPadding = (circleRadius / editorSize.width) * 100;
    const verticalPadding = (circleRadius / editorSize.height) * 100;
    const horizontalPosition = (horizontal - horizontalPadding) / (100 - horizontalPadding * 2);
    const verticalPosition = (vertical - verticalPadding) / (100 - verticalPadding * 2);
    const sourceX = (cropImage.naturalWidth - cropSize) * horizontalPosition;
    const sourceY = (cropImage.naturalHeight - cropSize) * verticalPosition;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(cropImage, sourceX, sourceY, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
  }, [cropDiameter, cropImage, editorSize, horizontal, vertical, zoom]);

  useEffect(() => {
    const editor = cropEditor.current;
    if (!editor || !cropImage) return;
    const observer = new ResizeObserver(([entry]) => {
      setEditorSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(editor);
    return () => observer.disconnect();
  }, [cropImage]);

  useEffect(() => {
    const editor = cropEditor.current;
    if (!editor || !cropImage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.max(1, Math.min(3, current + (event.deltaY < 0 ? 0.1 : -0.1))));
    };

    editor.addEventListener("wheel", handleWheel, { passive: false });
    return () => editor.removeEventListener("wheel", handleWheel);
  }, [cropImage]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await updateProfileName(name);
    if (result.error) return setMessage(result.error);
    setMessage("Name gespeichert.");
    router.refresh();
  }

  async function verifyCurrentPassword() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (error) {
      setMessage("Das aktuelle Passwort ist nicht korrekt.");
      return null;
    }
    return supabase;
  }

  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = await verifyCurrentPassword();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) return setMessage(error.message);
    setCurrentPassword("");
    setMessage("Bestätige die E-Mail-Änderung über die Nachricht in deinem Postfach.");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword.length < 8) return setMessage("Das neue Passwort muss mindestens 8 Zeichen haben.");
    const supabase = await verifyCurrentPassword();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setMessage(error.message);
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Passwort geändert.");
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage("Erlaubt sind JPG, PNG oder WebP bis maximal 2 MB.");
      return;
    }
    const image = new Image();
    image.onload = () => {
      setCropImage(image);
      setZoom(1);
      setHorizontal(50);
      setVertical(50);
      setMessage("Wähle den Bildausschnitt und speichere anschließend.");
    };
    image.src = URL.createObjectURL(file);
  }

  function moveCrop(clientX: number, clientY: number) {
    const rect = cropEditor.current?.getBoundingClientRect();
    if (!rect) return;
    const circleRadius = cropDiameter / 2;
    const minHorizontal = (circleRadius / rect.width) * 100;
    const minVertical = (circleRadius / rect.height) * 100;
    setHorizontal(Math.max(minHorizontal, Math.min(100 - minHorizontal, ((clientX - rect.left) / rect.width) * 100)));
    setVertical(Math.max(minVertical, Math.min(100 - minVertical, ((clientY - rect.top) / rect.height) * 100)));
  }

  async function saveAvatar() {
    if (!cropCanvas.current || !cropImage) return setMessage("Bitte wähle zuerst ein Bild aus.");
    const blob = await new Promise<Blob | null>((resolve) => cropCanvas.current?.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return setMessage("Der Bildausschnitt konnte nicht erstellt werden.");
    const path = `${userId}/avatar`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
    if (uploadError) return setMessage(uploadError.message);

    const result = await updateAvatarPath(path);
    if (result.error) return setMessage(result.error);
    setAvatarPreview(cropCanvas.current.toDataURL("image/jpeg"));
    setCropImage(null);
    setMessage("Profilbild gespeichert.");
    router.refresh();
  }

  async function removeAvatar() {
    setMessage("");
    const supabase = createClient();
    const { error: removeError } = await supabase.storage.from("avatars").remove([`${userId}/avatar`]);
    if (removeError) return setMessage(removeError.message);
    const result = await updateAvatarPath(null);
    if (result.error) return setMessage(result.error);
    setAvatarPreview(null);
    setMessage("Profilbild entfernt.");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Profilbild</h2>
        <div className="mt-4 flex items-center gap-4">
          {avatarPreview ? <img className="h-20 w-20 rounded-full object-cover" src={avatarPreview} alt="Dein Profilbild" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">{initialName.slice(0, 1).toUpperCase()}</div>}
          <div className="flex-1">
            <input className="block w-full text-sm" accept="image/jpeg,image/png,image/webp" type="file" onChange={selectAvatar} />
            {avatarPreview && <button className="mt-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700" type="button" onClick={removeAvatar}>Bild entfernen</button>}
          </div>
        </div>
        {cropImage && <div className="mt-5 rounded-lg bg-zinc-100 p-4">
          <div
            ref={cropEditor}
            className="relative mx-auto w-full max-w-lg touch-none overflow-hidden rounded-lg bg-zinc-900"
            style={{ aspectRatio: `${cropImage.naturalWidth} / ${cropImage.naturalHeight}` }}
            onPointerMove={(event) => { if (isDraggingCrop) moveCrop(event.clientX, event.clientY); }}
            onPointerUp={() => setIsDraggingCrop(false)}
            onPointerLeave={() => setIsDraggingCrop(false)}
          >
            <img
              className="h-full w-full select-none object-contain"
              src={cropImage.src}
              alt="Bild für den Profilausschnitt"
              draggable={false}
              style={{ transform: `scale(${zoom})`, transformOrigin: `${horizontal}% ${vertical}%` }}
            />
            <div
              className="absolute cursor-grab rounded-full border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.55)] active:cursor-grabbing"
              style={{ width: cropDiameter, height: cropDiameter, left: `calc(${horizontal}% - ${cropDiameter / 2}px)`, top: `calc(${vertical}% - ${cropDiameter / 2}px)` }}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setIsDraggingCrop(true); moveCrop(event.clientX, event.clientY); }}
            />
          </div>
          <canvas ref={cropCanvas} width="512" height="512" className="hidden" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-700">Kreis verschieben, mit dem Mausrad zoomen.</p>
            <button className="shrink-0 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white" type="button" onClick={saveAvatar}>Ausschnitt speichern</button>
          </div>
        </div>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Name</h2>
        <form className="mt-4 flex gap-2" onSubmit={saveName}>
          <input className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">Speichern</button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">E-Mail ändern</h2>
        <form className="mt-4 grid gap-3" onSubmit={saveEmail}>
          <input className="rounded-md border border-zinc-300 px-3 py-2" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Aktuelles Passwort" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <button className="w-fit rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">E-Mail-Änderung anfordern</button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Passwort ändern</h2>
        <form className="mt-4 grid gap-3" onSubmit={savePassword}>
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Aktuelles Passwort" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Neues Passwort (mindestens 8 Zeichen)" type="password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          <button className="w-fit rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">Passwort ändern</button>
        </form>
      </section>

      {message && <p className="text-sm text-zinc-700" role="status">{message}</p>}
    </div>
  );
}
