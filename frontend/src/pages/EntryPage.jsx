import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EntryPage() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [isLeaving, setIsLeaving] = useState(false);

  const enterStory = () => {
    if (isLeaving) return;

    setIsLeaving(true);

    timerRef.current = window.setTimeout(() => {
      navigate("/story");
    }, 850);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterStory();
    }
  };

  return (
    <main
      className={`entry-page ${
        isLeaving ? "entry-page--leaving" : ""
      }`}
    >
      <div
        className="entry-page__background"
        aria-hidden="true"
      >
        <div className="entry-page__nebula entry-page__nebula--one" />
        <div className="entry-page__nebula entry-page__nebula--two" />
        <div className="entry-page__stars" />
        <div className="entry-page__shooting-line" />
      </div>

      <div
        className="entry-page__overlay"
        aria-hidden="true"
      />

      <section className="entry-page__content">
        <p className="entry-page__act">
          Act I · The Celebration
        </p>

        <h1 className="entry-page__title">
          <span className="entry-page__title-main">
            Happy
          </span>

          <span className="entry-page__title-accent">
            Birthday
          </span>
        </h1>

        <p className="entry-page__description">
          Not every love story needs a grand beginning.
          Ours became extraordinary, one beautiful moment
          at a time.
        </p>

        <button
          type="button"
          className="entry-page__button"
          onClick={enterStory}
          onKeyDown={handleKeyDown}
          disabled={isLeaving}
          aria-label="Enter our story"
        >
          <span>Enter Our Story</span>

          <span
            className="entry-page__button-line"
            aria-hidden="true"
          />
        </button>
      </section>

      <div
        className="entry-page__corner-text"
        aria-hidden="true"
      >
        Made with love
      </div>
    </main>
  );
}
