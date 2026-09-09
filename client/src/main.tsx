import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/fonts.css";
import "./index.css";
import "./styles/redesign.css";
import { installGlobalImageFallback } from "./lib/image-fallback";

installGlobalImageFallback();

createRoot(document.getElementById("root")!).render(<App />);
