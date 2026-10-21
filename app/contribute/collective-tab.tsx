import Image from "next/image";
import { ImagePlus, Users } from "lucide-react";
import type { SharedContributionProps } from "./types";

export default function CollectiveTab({
  entries,
  imagePreview,
  artistImage,
  bannerImage,
  galleryImages,
  setArtistImage,
  setBannerImage,
  setGalleryImages,
  setImagePreview,
}: SharedContributionProps) {
  return (
    <>
      <label className="field-label" htmlFor="collective-artists">Artists in this collective<span>Separate with commas</span></label>
      <input id="collective-artists" name="artists" list="collective-artist-list" required placeholder="Add artists from the archive" />
      <datalist id="collective-artist-list">{entries.filter((entry) => entry.kind === "artist").map((artist) => <option key={artist.title} value={artist.title} />)}</datalist>
      <p className="collective-hint"><Users size={14} />Every member must have an artist entry in the archive.</p>
      <label className="field-label" htmlFor="collective-image">Collective photo<span>Optional · profile image</span></label>
      <label className="image-picker" htmlFor="collective-image">
        {imagePreview ? <Image src={imagePreview} alt="Collective profile preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
        <span>{artistImage?.name ?? "Choose a profile photo"}</span>
        <input id="collective-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setArtistImage(file);
          setImagePreview(file ? URL.createObjectURL(file) : "");
        }} />
      </label>
      <label className="field-label" htmlFor="collective-banner">Collective banner<span>Optional · wide cover image</span></label>
      <label className="image-picker" htmlFor="collective-banner">
        {bannerImage ? <Image src={URL.createObjectURL(bannerImage)} alt="Collective banner preview" width={36} height={36} unoptimized /> : <ImagePlus size={22} />}
        <span>{bannerImage?.name ?? "Choose a banner image"}</span>
        <input id="collective-banner" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setBannerImage(event.target.files?.[0] ?? null)} />
      </label>
      <label className="field-label" htmlFor="collective-gallery">Additional photos<span>Optional · choose multiple</span></label>
      <label className="image-picker" htmlFor="collective-gallery">
        <ImagePlus size={22} />
        <span>{galleryImages.length ? `${galleryImages.length} photos selected` : "Choose photos"}</span>
        <input id="collective-gallery" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} />
      </label>
      <label className="field-label" htmlFor="entry-bio">About this collective<span>Optional</span></label>
      <textarea id="entry-bio" name="bio" maxLength={2000} rows={4} placeholder="A shared project, crew, or music group…" />
    </>
  );
}
