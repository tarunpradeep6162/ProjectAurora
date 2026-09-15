import ChapterNav from "@/components/ChapterNav";
import SiteAudioPlayer from "@/components/SiteAudioPlayer";
import CosmicBackdrop from "@/components/cosmic/CosmicBackdrop";
import ChapterPortal from "@/components/chapters/ChapterPortal";
import ChapterMiracle from "@/components/chapters/ChapterMiracle";
import ChapterStory from "@/components/chapters/ChapterStory";
import LoveLetter from "@/components/LoveLetter";
import CandleInteraction from "@/components/CandleInteraction";
import ChapterFinale from "@/components/chapters/ChapterFinale";
import HiddenMessages from "@/components/HiddenMessages";

export default function Home() {
  return (
    <>
      {/* Mounted once here rather than inside any single chapter — a
          persistent, fixed-position cosmic layer behind the whole site
          (see CosmicBackdrop.tsx) so space reads as the site's continuous
          identity rather than only the portal's opening flourish. */}
      <CosmicBackdrop />
      <ChapterNav />
      <SiteAudioPlayer />
      <main id="main-content">
        <ChapterPortal />
        <ChapterMiracle />
        {/* Chapters 03-05 (story/journey/memories) merged into one chapter
            — see content.ts and ChapterStory.tsx. The three DOM components
            it replaced (ChapterTimeline.tsx, ChapterJourney.tsx,
            MemoryGallery.tsx) and CosmicPath.tsx, which only they used,
            have been deleted rather than kept unmounted — unlike
            AuroraRelic.tsx, none of them had a plausible future use once
            their content had a real successor. */}
        <ChapterStory />
        <LoveLetter />
        <CandleInteraction />
        <ChapterFinale />
      </main>
      <HiddenMessages />
    </>
  );
}
