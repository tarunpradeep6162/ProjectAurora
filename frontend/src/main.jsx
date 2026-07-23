import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { MusicProvider } from "./music/MusicContext";
import birthdaySong from "./assets/music/birthday.mp3";
import "./index.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <MusicProvider defaultSrc={birthdaySong}>
      <App />
    </MusicProvider>
  </StrictMode>
);
