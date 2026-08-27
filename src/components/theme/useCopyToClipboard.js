import { useState } from 'react';

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };
  return { copied, copy };
}
