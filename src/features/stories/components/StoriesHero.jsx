import { storiesContent as content } from "../data/storiesContent.js";
import Reveal from "./Reveal.jsx";

const StoriesHero = () => {
  const { headingLead, headingAccent, subheading } = content;

  return (
    <Reveal>
      <section className="relative overflow-hidden bg-charcoal py-16 text-cream">
        <img
          src="/public/anika-blue-blob.png"
          alt=""
          aria-hidden="true"
          className='absolute -top-10 right-0 w-64 h-64 md:w-80 md:h-80 object-contain pointer-events-none select-none'
        />
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-display text-5xl uppercase md:text-6xl">
            {headingLead} {headingAccent}
          </h1>

          <p className="mt-4 max-w-md font-editorial text-lg italic text-gold">
            {subheading}
          </p>
        </div>
      </section>
    </Reveal>
  );
};

export default StoriesHero;