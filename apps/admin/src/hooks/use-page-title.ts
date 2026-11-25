import { useEffect } from "react";

// Sets the document title for a page and restores the previous title on unmount.
// SPA routes don't set <title> on their own, so several pages showed the default.
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
