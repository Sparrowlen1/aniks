import StoryCard from "./StoryCard.jsx";
import Reveal from "./Reveal.jsx";

const StoryGrid = ({ stories, activePillar }) => {
  const filtered =
    activePillar === "all"
      ? stories
      : stories.filter((story) => story.pillar === activePillar);

  if (filtered.length === 0) {
    return (
      <Reveal>
        <p className="text-center font-body text-ink/55 py-8">
          No stories yet for this pillar. Check back soon.
        </p>
      </Reveal>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filtered.map((story, index) => (
          <Reveal key={story.id} delay={index * 100}>
            <StoryCard story={story} />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default StoryGrid;