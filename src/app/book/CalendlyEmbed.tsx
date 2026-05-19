"use client";

import { useEffect } from "react";

export default function CalendlyEmbed({ url }: { url: string }) {
  useEffect(() => {
    const id = "calendly-widget-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      className="calendly-inline-widget w-full"
      data-url={url}
      style={{ minWidth: "320px", height: "720px" }}
    />
  );
}
