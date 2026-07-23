import {
  Reveal,
  Scene,
} from "../layout/Scene";

import Timeline from "../timeline/Timeline";

function StorySection() {
  return (
    <Scene
      id="story"
      chapter="02"
      eyebrow="Act II · Our chronology"
      title="Moments that "
      accent="became us."
      intro="The important days were never just dates. They were small turns in the story that quietly brought us here."
    >
      <Reveal className="story-note">
        <p>Every memory carries its own light.</p>

        <span>
          From the first hello to everything still ahead.
        </span>
      </Reveal>

      <Timeline />
    </Scene>
  );
}

export default StorySection;
