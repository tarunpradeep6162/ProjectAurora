import {
  lazy,
  Suspense,
} from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import EntryPage from "./pages/EntryPage";
import StoryLayout from "./layouts/StoryLayout";

const StoryPage = lazy(() =>
  import("./pages/StoryPage")
);

const OurStoryPage = lazy(() =>
  import("./pages/OurStoryPage")
);

const MemoriesPage = lazy(() =>
  import("./pages/MemoriesPage")
);

const JourneyPage = lazy(() =>
  import("./pages/JourneyPage")
);

const LoveLetterPage = lazy(() =>
  import("./pages/LoveLetterPage")
);

const BirthdayPage = lazy(() =>
  import("./pages/BirthdayPage")
);

const SurprisePage = lazy(() =>
  import("./pages/SurprisePage")
);

const QuizPage = lazy(() =>
  import("./pages/QuizPage")
);

const GamesPage = lazy(() =>
  import("./pages/GamesPage")
);

function RouteLoader() {
  return (
    <div className="story-route-loader">
      <div className="story-route-loader__glow" />

      <div className="story-route-loader__content">
        <span className="story-route-loader__eyebrow">
          Preparing something beautiful
        </span>

        <div className="story-route-loader__line">
          <span />
        </div>

        <p>Loading our story…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/"
            element={<EntryPage />}
          />

          <Route
            path="/story"
            element={<StoryLayout />}
          >
            <Route
              index
              element={<StoryPage />}
            />

            <Route
              path="our-story"
              element={<OurStoryPage />}
            />

            <Route
              path="memories"
              element={<MemoriesPage />}
            />

            <Route
              path="journey"
              element={<JourneyPage />}
            />

            <Route
              path="love-letter"
              element={<LoveLetterPage />}
            />

            <Route
              path="birthday"
              element={<BirthdayPage />}
            />

            <Route
              path="surprise"
              element={<SurprisePage />}
            />

            <Route
              path="quiz"
              element={<QuizPage />}
            />

            <Route
              path="games"
              element={<GamesPage />}
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
