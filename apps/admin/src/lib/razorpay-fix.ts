// Razorpay CORS and Security Fix
export function prepareRazorpayEnvironment() {
  // Remove any existing security restrictions
  if (typeof document !== 'undefined') {
    // Override CSP if present
    const metaCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCsp) {
      metaCsp.remove();
    }
    
    // Ensure iframe embedding is allowed
    const metaFrameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (metaFrameOptions) {
      metaFrameOptions.remove();
    }
  }
  
  // Override fetch to handle CORS for Razorpay resources
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.includes('razorpay')) {
      const newInit = {
        ...init,
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
      };
      return originalFetch(input, newInit);
    }
    return originalFetch(input, init);
  };
}

// Initialize environment fixes
if (typeof window !== 'undefined') {
  prepareRazorpayEnvironment();
}