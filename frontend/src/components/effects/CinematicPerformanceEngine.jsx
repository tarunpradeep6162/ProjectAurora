import { useEffect } from "react";

const SECTION_SELECTORS = [
  "#hero",
  "#story",
  "#memories",
  "#memory",
  "#love-letter",
  "#letter",
  "#journey",
  "#birthday",
  "#universe-ending",
];

function getDeviceProfile() {
  const coarsePointer = window.matchMedia(
    "(pointer: coarse)",
  ).matches;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const narrowScreen = window.matchMedia(
    "(max-width: 768px)",
  ).matches;

  const limitedMemory =
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 4;

  const limitedCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  const saveData =
    navigator.connection?.saveData === true;

  const mobile =
    coarsePointer || narrowScreen;

  const lowPower =
    reducedMotion ||
    saveData ||
    limitedMemory ||
    limitedCpu;

  return {
    mobile,
    lowPower,
    reducedMotion,
    saveData,
  };
}

function CinematicPerformanceEngine() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    let profile = getDeviceProfile();
    let resizeFrame = null;
    let scrollFrame = null;
    let lastScrollY = window.scrollY;
    let scrollStopTimer = null;

    const applyDeviceProfile = () => {
      profile = getDeviceProfile();

      root.classList.toggle(
        "cinematic-mobile-device",
        profile.mobile,
      );

      root.classList.toggle(
        "cinematic-low-power",
        profile.lowPower,
      );

      root.classList.toggle(
        "cinematic-reduced-motion",
        profile.reducedMotion,
      );

      root.classList.toggle(
        "cinematic-save-data",
        profile.saveData,
      );

      root.dataset.performanceMode =
        profile.lowPower
          ? "light"
          : profile.mobile
            ? "mobile"
            : "full";
    };

    const sectionElements = [
      ...new Set(
        SECTION_SELECTORS.flatMap((selector) =>
          Array.from(
            document.querySelectorAll(selector),
          ),
        ),
      ),
    ];

    sectionElements.forEach((section) => {
      section.classList.add(
        "performance-aware-section",
      );

      section.dataset.inViewport = "false";
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;

          entry.target.dataset.inViewport =
            String(isVisible);

          entry.target.classList.toggle(
            "performance-section-visible",
            isVisible,
          );

          if (isVisible) {
            window.dispatchEvent(
              new CustomEvent(
                "cinematic-section-visible",
                {
                  detail: {
                    id:
                      entry.target.id ||
                      entry.target.dataset.scene ||
                      "unknown",
                  },
                },
              ),
            );
          }
        });
      },
      {
        root: null,
        rootMargin: "30% 0px 30% 0px",
        threshold: 0.01,
      },
    );

    sectionElements.forEach((section) => {
      sectionObserver.observe(section);
    });

    const updateScrollState = () => {
      scrollFrame = null;

      const currentScrollY = window.scrollY;
      const scrollDifference =
        currentScrollY - lastScrollY;

      root.classList.add("cinematic-is-scrolling");

      root.dataset.scrollDirection =
        scrollDifference > 1
          ? "down"
          : scrollDifference < -1
            ? "up"
            : root.dataset.scrollDirection || "down";

      root.style.setProperty(
        "--cinematic-scroll-y",
        `${currentScrollY}px`,
      );

      lastScrollY = currentScrollY;

      window.clearTimeout(scrollStopTimer);

      scrollStopTimer = window.setTimeout(() => {
        root.classList.remove(
          "cinematic-is-scrolling",
        );
      }, 140);
    };

    const requestScrollUpdate = () => {
      if (scrollFrame !== null) {
        return;
      }

      scrollFrame =
        window.requestAnimationFrame(
          updateScrollState,
        );
    };

    const handleResize = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(
          resizeFrame,
        );
      }

      resizeFrame =
        window.requestAnimationFrame(() => {
          resizeFrame = null;
          applyDeviceProfile();

          root.style.setProperty(
            "--cinematic-vh",
            `${window.innerHeight * 0.01}px`,
          );
        });
    };

    const handleVisibilityChange = () => {
      const hidden = document.hidden;

      root.classList.toggle(
        "cinematic-tab-hidden",
        hidden,
      );

      body.classList.toggle(
        "cinematic-effects-paused",
        hidden,
      );

      window.dispatchEvent(
        new CustomEvent(
          "cinematic-visibility-change",
          {
            detail: {
              hidden,
            },
          },
        ),
      );
    };

    const handlePageShow = () => {
      root.classList.remove(
        "cinematic-tab-hidden",
      );

      body.classList.remove(
        "cinematic-effects-paused",
      );
    };

    applyDeviceProfile();

    root.style.setProperty(
      "--cinematic-vh",
      `${window.innerHeight * 0.01}px`,
    );

    root.classList.add(
      "cinematic-performance-ready",
    );

    window.addEventListener(
      "scroll",
      requestScrollUpdate,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      handleResize,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "orientationchange",
      handleResize,
      {
        passive: true,
      },
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "pageshow",
      handlePageShow,
    );

    requestScrollUpdate();

    return () => {
      sectionObserver.disconnect();

      sectionElements.forEach((section) => {
        section.classList.remove(
          "performance-aware-section",
          "performance-section-visible",
        );

        delete section.dataset.inViewport;
      });

      window.removeEventListener(
        "scroll",
        requestScrollUpdate,
      );

      window.removeEventListener(
        "resize",
        handleResize,
      );

      window.removeEventListener(
        "orientationchange",
        handleResize,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "pageshow",
        handlePageShow,
      );

      if (scrollFrame !== null) {
        window.cancelAnimationFrame(
          scrollFrame,
        );
      }

      if (resizeFrame !== null) {
        window.cancelAnimationFrame(
          resizeFrame,
        );
      }

      window.clearTimeout(scrollStopTimer);

      root.classList.remove(
        "cinematic-performance-ready",
        "cinematic-mobile-device",
        "cinematic-low-power",
        "cinematic-reduced-motion",
        "cinematic-save-data",
        "cinematic-tab-hidden",
        "cinematic-is-scrolling",
      );

      body.classList.remove(
        "cinematic-effects-paused",
      );

      delete root.dataset.performanceMode;
      delete root.dataset.scrollDirection;

      root.style.removeProperty(
        "--cinematic-scroll-y",
      );

      root.style.removeProperty(
        "--cinematic-vh",
      );
    };
  }, []);

  return null;
}

export default CinematicPerformanceEngine;
