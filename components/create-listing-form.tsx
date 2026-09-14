"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createListing, type ListingState } from "@/app/sell/actions";

const initialState: ListingState = {};

export function CreateListingForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(createListing, initialState);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (imagePaths.length + files.length > 5) {
      setUploadError("You can upload up to five images.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    const supabase = createClient();
    const uploadedPaths: string[] = [];

    for (const file of files) {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 15 * 1024 * 1024) {
        setUploadError("Use JPEG, PNG, or WebP images smaller than 15 MB.");
        continue;
      }
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("item-images").upload(path, file);
      if (error) {
        setUploadError(error.message);
      } else {
        uploadedPaths.push(path);
      }
    }

    setImagePaths((current) => [...current, ...uploadedPaths]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form className="listing-form" action={formAction}>
      <label>Lot title<input name="title" maxLength={160} required /></label>
      <label>Description<textarea name="description" rows={5} /></label>
      <div className="form-columns">
        <label>Starting price<input name="startingPrice" type="number" min="0.01" step="0.01" required /></label>
        <label>Reserve price <small>Optional</small><input name="reservePrice" type="number" min="0" step="0.01" /></label>
      </div>
      <div className="form-columns">
        <label>Starts at<input name="startsAt" type="datetime-local" required /></label>
        <label>Ends at<input name="endsAt" type="datetime-local" required /></label>
      </div>
      <div className="image-upload">
        <label htmlFor="images">Lot images <small>JPEG, PNG, or WebP. Up to 15 MB each.</small></label>
        <input ref={fileInputRef} id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} />
        {isUploading && <p className="form-message form-notice">Uploading images...</p>}
        {uploadError && <p className="form-message form-error" role="alert">{uploadError}</p>}
        {imagePaths.length > 0 && <p className="image-count">{imagePaths.length} image{imagePaths.length === 1 ? "" : "s"} ready for this listing.</p>}
      </div>
      <input type="hidden" name="imagePaths" value={JSON.stringify(imagePaths)} />
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={isUploading}>Submit for approval</button>
    </form>
  );
}