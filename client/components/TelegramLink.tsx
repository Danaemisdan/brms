"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

export function TelegramLink() {
  const [link, setLink] = useState("https://t.me/samplelelodeals");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz.startsWith("America/")) {
        setLink("https://t.me/samplelelousadeals");
      }
    } catch (e) {
      // ignore error, default to India link
    }
  }, []);

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
      <Send className="w-5 h-5" /> Telegram Community
    </a>
  );
}
