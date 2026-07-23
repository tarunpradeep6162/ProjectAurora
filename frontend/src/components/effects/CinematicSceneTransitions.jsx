import { useEffect } from "react";

const SCENE_CONFIG = [
  {
    selector: "#hero",
    name: "hero",
  },
  {
    selector: "#story",
    name: "story",
  },
  {
    selector: "#memories, #memory",
    name: "memories",
  },
  {
    selector: "#love-letter, #letter",
    name: "letter",
  },
  {
    selector: "#journey",
    name: "journey",
  },
  {
    selector: "#birthday",
    name: "birthday",
  },
  {
    selector: "#universe-ending",
    name: "universe",
  },
];

function CinematicSceneTransitions() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const sceneElements = [];
    const cleanupFunctions = [];

    SCENE_CONFIG.forEach((scene, index) => {
      const element = document.querySelector(scene.selector);

      if (!element) {
        return;
      }

      element.classList.add("cinematic-scene");
      element.dataset.scene = scene.name;
      element.style.setProperty("--scene-index", index);

      sceneElements.push({
        element,
        name: scene.name,
      });
    });

    if (!sceneElements.length) {
      return undefined;
    }

    document.documentElement.classList.add(
      "cinematic-transitions-ready",
    );

    if (prefersReducedMotion) {
      sceneElements.forEach(({ element }) => {
        element.classList.add(
          "cinematic-scene--visible",
          "cinematic-scene--active",
        );
      });

      return () => {
        document.documentElement.classList.remove(
          "cinematic-transitions-ready",
        );
      };
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "cinematic-scene--visible",
          );

          revealObserver.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "10% 0px 8% 0px",
        threshold: 0.08,
      },
    );

    sceneElements.forEach(({ element }, index) => {
      if (index === 0) {
        element.classList.add(
          "cinematic-scene--visible",
        );
      } else {
        revealObserver.observe(element);
      }
    });

    let activeScene = "";
    let animationFrame = null;

    const updateActiveScene = () => {
      animationFrame = null;

      const viewportCenter = window.innerHeight * 0.48;
      let closestScene = sceneElements[0];
      let closestDistance = Number.POSITIVE_INFINITY;

      sceneElements.forEach((scene) => {
        const rect = scene.element.getBoundingClientRect();
        const sceneCenter = rect.top + rect.height / 2;
        const distance = Math.abs(
          sceneCenter - viewportCenter,
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestScene = scene;
        }
      });

      if (
        !closestScene ||
        closestScene.name === activeScene
      ) {
        return;
      }

      activeScene = closestScene.name;

      sceneElements.forEach(({ element, name }) => {
        element.classList.toggle(
          "cinematic-scene--active",
          name === activeScene,
        );
      });

      document.documentElement.dataset.activeScene =
        activeScene;

      window.dispatchEvent(
        new CustomEvent("cinematic-scene-change", {
          detail: {
            scene: activeScene,
          },
        }),
      );
    };

    const requestSceneUpdate = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame =
        window.requestAnimationFrame(updateActiveScene);
    };

    window.addEventListener(
      "scroll",
      requestSceneUpdate,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      requestSceneUpdate,
      {
        passive: true,
      },
    );

    requestSceneUpdate();

    cleanupFunctions.push(() => {
      window.removeEventListener(
        "scroll",
        requestSceneUpdate,
      );

      window.removeEventListener(
        "resize",
        requestSceneUpdate,
      );

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    });

    return () => {
      revealObserver.disconnect();

      cleanupFunctions.forEach((cleanup) => cleanup());

      sceneElements.forEach(({ element }) => {
        element.classList.remove(
          "cinematic-scene",
          "cinematic-scene--visible",
          "cinematic-scene--active",
        );

        delete element.dataset.scene;
        element.style.removeProperty("--scene-index");
      });

      document.documentElement.classList.remove(
        "cinematic-transitions-ready",
      );

      delete document.documentElement.dataset.activeScene;
    };
  }, []);

  return (
    <div
      className="cinematic-transition-system"
      aria-hidden="true"
    >
      <div className="cinematic-transition-system__light" />
      <div className="cinematic-transition-system__vignette" />
      <div className="cinematic-transition-system__grain" />
    </div>
  );
}

export default CinematicSceneTransitions;
