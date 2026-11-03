"use client";
import { useState } from "react";
import { Dialog } from "./Dialog";
export function CertificateLightbox({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <button
        className="certificate-button"
        onClick={() => setOpen(true)}
        aria-label={`${name} — sertifikatni ko‘rish`}
      >
        <img
          src={src}
          alt={`${name} sertifikati`}
          loading="lazy"
          width={290}
          height={370}
        />
        <span>Sertifikatni ko‘rish ↗</span>
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`${name} sertifikati`}
        className="lightbox"
      >
        <button className="button secondary" onClick={() => setZoom(!zoom)}>
          {zoom ? "Kichraytirish" : "Kattalashtirish"}
        </button>
        <div className="lightbox-scroll">
          <img
            src={src}
            alt={`${name} sertifikati`}
            style={{
              width: zoom ? "150%" : "100%",
              maxWidth: zoom ? "none" : "100%",
            }}
          />
        </div>
      </Dialog>
    </>
  );
}
