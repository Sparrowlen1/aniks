import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";

const StoryDetail = ({ story }) => {
  return (
    <article className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <Link
            to="/stories"
            className="inline-block rounded border border-ink px-7 py-2.5 font-body text-sm text-ink transition-colors duration-200 hover:bg-ink hover:text-cream"
          >
            Back to stories
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="font-display text-3xl sm:text-5xl mt-8 mb-8 text-ink leading-tight">
            {story.title}
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <div className="aspect-[16/9] overflow-hidden rounded-lg bg-ink/10 mb-10">
            <img
              src={story.image}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="font-body text-base text-ink/80 leading-relaxed space-y-6">
            {story.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </article>
  );
};

export default StoryDetail;