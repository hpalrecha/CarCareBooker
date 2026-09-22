import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/fonts.css";
import "./index.css";
import "./styles/redesign.css";
// editorial.css, landing.css and landing-pages.css moved into the lazy route chunks that
// actually use them (blog-index.tsx, campaign-landing.tsx, ppf-ceramic-landing.tsx). All
// three used to be imported here unconditionally, so Vite folded them into the ONE
// render-blocking stylesheet every route downloads before first paint — including Home,
// which needs none of them (see App.tsx's route-level JS code splitting for the same
// argument applied to CSS instead of JS).
import { installGlobalImageFallback } from "./lib/image-fallback";

installGlobalImageFallback();

createRoot(document.getElementById("root")!).render(<App />);
