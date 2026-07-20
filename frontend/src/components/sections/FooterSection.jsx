import ScrollReveal from "../animations/ScrollReveal";

function FooterSection() {
  return (
    <footer className="min-h-screen flex items-center justify-center bg-black text-white">

      <ScrollReveal>

        <div className="text-center">

          <h2 className="text-5xl font-bold">
            Forever Starts Here ❤️
          </h2>

          <p className="mt-6 text-gray-500">
            Made with love by Tarun.
          </p>

        </div>

      </ScrollReveal>

    </footer>
  );
}

export default FooterSection;
