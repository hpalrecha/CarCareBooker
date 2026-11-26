declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function loadRazorpay(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log("Razorpay already available");
      resolve(window.Razorpay);
      return;
    }

    console.log("Loading Razorpay script...");
    
    // Remove any existing CSP restrictions
    const cspMetas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    cspMetas.forEach(meta => meta.remove());

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        console.error("Razorpay object not found after load");
        reject(new Error("Razorpay object not available"));
      }
    };
    
    script.onerror = (error) => {
      console.error("Failed to load Razorpay script:", error);
      reject(new Error("Failed to load Razorpay script"));
    };
    
    document.head.appendChild(script);
    
    // Add timeout for safety
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error("Razorpay load timeout");
        reject(new Error("Razorpay load timeout"));
      }
    }, 15000);
  });
}
