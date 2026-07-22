import ScrollReveal from "../animations/ScrollReveal";
import GiftBox from "../birthday/GiftBox";

function BirthdaySection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white">

      <ScrollReveal>
        <GiftBox />
      </ScrollReveal>

    </section>
  );
}

export default BirthdaySection;
