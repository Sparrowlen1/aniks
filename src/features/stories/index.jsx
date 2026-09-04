import { useEffect, useState } from "react";
import StoriesHero from "./components/StoriesHero.jsx";
import PillarFilter from "./components/PillarFilter.jsx";
import StoryGrid from "./components/StoryGrid.jsx";
import { useSearchParams } from "react-router-dom";
import { storiesStore } from "../../data/storiesStore";

export default function Stories() {
  const [searchParams] = useSearchParams();
  const pillarParam = searchParams.get("pillar");

  const [activePillar, setActivePillar] = useState(pillarParam ?? "all");
  const [publishedStories, setPublishedStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const stories = await storiesStore.getPublished();
      setPublishedStories(stories);
    } catch (error) {
      console.error("Failed to load stories:", error);
      setPublishedStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
    const unsubscribe = storiesStore.subscribe(loadStories);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (pillarParam) {
      setActivePillar(pillarParam);
    }
  }, [pillarParam]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <StoriesHero />
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <PillarFilter active={activePillar} onChange={setActivePillar} />
          <StoryGrid stories={publishedStories} activePillar={activePillar} />
        </div>
      </section>
    </>
  );
}
