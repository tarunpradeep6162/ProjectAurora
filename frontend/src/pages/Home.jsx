import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import HeroSection from "../components/sections/HeroSection";

/* Heavy components are loaded separately */
const CinematicEnvironment = lazy(() =>
  import("../components/environment/CinematicEnvironment")
);

const StorySection = lazy(() =>
  import("../components/sections/StorySection")
);

const JourneySection = lazy(() =>
  import("../components/sections/JourneySection")
);

const MemorySection = lazy(() =>
  import("../components/sections/MemorySection")
);

const LoveLetterSection = lazy(() =>
  import("../components/sections/LoveLetterSection")
);

const BirthdaySection = lazy(() =>
  import("../components/sections/BirthdaySection")
);

const UniverseEndingSection = lazy(() =>
  import("../components/sections/UniverseEndingSection")
);

const MusicPlayer = lazy(() =>
  import("../components/music/MusicPlayer")
);

/* Loading placeholder for lazy sections */
function SectionLoader({
  label = "Preparing this chapter…",
  height = "100svh",
}) {
  return (
    <div
      className="home-section-loader"
      style={{ minHeight: height }}
      role="status"
      aria-live="polite"
    >
      <div className="home-section-loader__content">
        <span
          className="home-section-loader__heart"
          aria-hidden="true"
        >
          ♥
        </span>

        <p>{label}</p>

        <div
          className="home-section-loader__line"
          aria-hidden="true"
        >
          <span />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loadEnvironment, setLoadEnvironment] =
    useState(false);

  useEffect(() => {
    let timeoutId;
    let idleCallbackId;

    const enableEnvironment = () => {
      setLoadEnvironment(true);
    };

    /*
      Load the Three.js environment after the important
      page content has rendered.
    */
    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(
        enableEnvironment,
        {
          timeout: 1200,
        }
      );
    } else {
      timeoutId = window.setTimeout(
        enableEnvironment,
        700
      );
    }

    return () => {
      if (
        idleCallbackId &&
        "cancelIdleCallback" in window
      ) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="birthday-home">
      {/* =============================================
          CINEMATIC BACKGROUND
      ============================================== */}

      <div
        className="birthday-home__environment"
        aria-hidden="true"
      >
        {loadEnvironment && (
          <Suspense fallback={null}>
            <CinematicEnvironment />
          </Suspense>
        )}
      </div>

      <div
        className="birthday-home__fallback-background"
        aria-hidden="true"
      />

      {/* =============================================
          HERO SECTION
      ============================================== */}

      <section
        id="home"
        className="
          birthday-home__section
          birthday-home__section--hero
        "
      >
        <HeroSection />
      </section>

      {/* =============================================
          STORY SECTION
      ============================================== */}

      <section
        id="story"
        className="
          birthday-home__section
          birthday-home__section--story
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Opening our story…" />
          }
        >
          <StorySection />
        </Suspense>
      </section>

      {/* =============================================
          JOURNEY SECTION
      ============================================== */}

      <section
        id="journey"
        className="
          birthday-home__section
          birthday-home__section--journey
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Replaying our journey…" />
          }
        >
          <JourneySection />
        </Suspense>
      </section>

      {/* =============================================
          MEMORY SECTION
      ============================================== */}

      <section
        id="memories"
        className="
          birthday-home__section
          birthday-home__section--memories
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Collecting our memories…" />
          }
        >
          <MemorySection />
        </Suspense>
      </section>

      {/* =============================================
          LOVE LETTER SECTION
      ============================================== */}

      <section
        id="letter"
        className="
          birthday-home__section
          birthday-home__section--letter
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Writing something from my heart…" />
          }
        >
          <LoveLetterSection />
        </Suspense>
      </section>

      {/* =============================================
          BIRTHDAY SECTION
      ============================================== */}

      <section
        id="birthday"
        className="
          birthday-home__section
          birthday-home__section--birthday
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Preparing the celebration…" />
          }
        >
          <BirthdaySection />
        </Suspense>
      </section>

      {/* =============================================
          FINAL SURPRISE SECTION
      ============================================== */}

      <section
        id="surprise"
        className="
          birthday-home__section
          birthday-home__section--surprise
        "
      >
        <Suspense
          fallback={
            <SectionLoader label="Preparing the final surprise…" />
          }
        >
          <UniverseEndingSection />
        </Suspense>
      </section>

      {/* =============================================
          MUSIC PLAYER
      ============================================== */}

      <section
        id="music"
        className="
          birthday-home__section
          birthday-home__section--music
        "
      >
        <Suspense
          fallback={
            <SectionLoader
              label="Preparing our soundtrack…"
              height="30svh"
            />
          }
        >
          <div className="birthday-home__music-wrapper">
            <div className="birthday-home__music-content">
              <p className="birthday-home__music-eyebrow">
                Our Soundtrack
              </p>

              <h2 className="birthday-home__music-title">
                Every love story has a song.
              </h2>

              <p className="birthday-home__music-description">
                This is the soundtrack of our memories,
                our laughter, and every beautiful moment
                we created together.
              </p>
            </div>

            <MusicPlayer />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
