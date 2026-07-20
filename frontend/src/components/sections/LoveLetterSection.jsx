import ScrollReveal from "../animations/ScrollReveal";

function LoveLetterSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black text-white">

      <ScrollReveal>

        <div className="max-w-3xl text-center">

          <h2 className="text-6xl font-bold">
            A Letter For You 💌
          </h2>

          <p className="mt-8 text-xl text-gray-400">
            In the next lesson, this will become a cinematic typewriter love letter.
          </p>

        </div>

      </ScrollReveal>

    </section>
  );
}

export default LoveLetterSection;
