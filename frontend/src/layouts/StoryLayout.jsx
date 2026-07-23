import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/common/Navbar";

const CinematicEnvironment = lazy(() =>
  import("../components/environment/CinematicEnvironment")
);

const MusicPlayer = lazy(() =>
  import("../components/music/MusicPlayer")
);

function PageLoader() {
  return (
    <div className="story-page-loader">
      <div className="story-page-loader__content">
        <span aria-hidden="true">♥</span>
        <p>Opening this chapter…</p>
      </div>
    </div>
  );
}

export default function StoryLayout() {
  const location = useLocation();
  const [loadEnvironment, setLoadEnvironment] =
    useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  useEffect(() => {
    let timeoutId;
    let idleId;

    const showEnvironment = () => {
      setLoadEnvironment(true);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(
        showEnvironment,
        {
          timeout: 1000,
        }
      );
    } else {
      timeoutId = window.setTimeout(
        showEnvironment,
        500
      );
    }

    return () => {
      if (
        idleId &&
        "cancelIdleCallback" in window
      ) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="story-layout">
      <div
        className="story-layout__fallback"
        aria-hidden="true"
      />

      <div
        className="story-layout__environment"
        aria-hidden="true"
      >
        {loadEnvironment && (
          <Suspense fallback={null}>
            <CinematicEnvironment />
          </Suspense>
        )}
      </div>

      <Navbar />

      <main className="story-layout__content">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <MusicPlayer />
      </Suspense>
    </div>
  );
}
