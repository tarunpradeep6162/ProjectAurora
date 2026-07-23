import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const questions = [
  {
    question: "What is the name of our special song?",
    options: [
      "Perfect",
      "Our Forever Song",
      "Until I Found You",
      "Photograph",
    ],
    answer: "Our Forever Song",
  },
  {
    question: "Which memory always makes us smile?",
    options: [
      "Our first conversation",
      "Our first trip",
      "Our funniest fight",
      "All of them",
    ],
    answer: "All of them",
  },
  {
    question: "What is the best gift in this story?",
    options: [
      "Flowers",
      "Chocolate",
      "A surprise",
      "Having each other",
    ],
    answer: "Having each other",
  },
];

export default function QuizPage() {
  const [questionIndex, setQuestionIndex] =
    useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] =
    useState(null);
  const [finished, setFinished] =
    useState(false);

  const question = questions[questionIndex];

  const resultMessage = useMemo(() => {
    if (score === questions.length) {
      return "You know our story perfectly ❤️";
    }

    if (score >= 2) {
      return "You remember our beautiful moments ❤️";
    }

    return "Every answer is another memory to create together ❤️";
  }, [score]);

  const chooseAnswer = (option) => {
    if (selected) return;

    setSelected(option);

    const correct = option === question.answer;

    if (correct) {
      setScore((current) => current + 1);
    }

    window.setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        setFinished(true);
        return;
      }

      setQuestionIndex((current) => current + 1);
      setSelected(null);
    }, 900);
  };

  const restart = () => {
    setQuestionIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };

  return (
    <section className="experience-page">
      <motion.div
        className="experience-card quiz-card"
        initial={{
          opacity: 0,
          y: 35,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
        }}
      >
        <p className="experience-page__eyebrow">
          A Little Challenge
        </p>

        <h1 className="experience-page__title">
          How Well Do You Know Us?
        </h1>

        {!finished ? (
          <>
            <div className="quiz-progress">
              <span>
                Question {questionIndex + 1} of{" "}
                {questions.length}
              </span>

              <span>{score} correct</span>
            </div>

            <div className="quiz-progress__track">
              <span
                style={{
                  width: `${
                    ((questionIndex + 1) /
                      questions.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <h2 className="quiz-question">
              {question.question}
            </h2>

            <div className="quiz-options">
              {question.options.map((option) => {
                const chosen = selected === option;
                const correct =
                  selected &&
                  option === question.answer;
                const wrong =
                  chosen &&
                  option !== question.answer;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(selected)}
                    onClick={() =>
                      chooseAnswer(option)
                    }
                    className={[
                      "quiz-option",
                      correct
                        ? "is-correct"
                        : "",
                      wrong ? "is-wrong" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="quiz-result">
            <span
              className="quiz-result__heart"
              aria-hidden="true"
            >
              ♥
            </span>

            <p>Your score</p>

            <strong>
              {score}/{questions.length}
            </strong>

            <h2>{resultMessage}</h2>

            <button
              type="button"
              onClick={restart}
              className="experience-button"
            >
              Play Again
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
