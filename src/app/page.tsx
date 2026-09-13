import ChapterNav from "@/components/ChapterNav";
import SiteAudioPlayer from "@/components/SiteAudioPlayer";
import CosmicBackdrop from "@/components/cosmic/CosmicBackdrop";
import ChapterPortal from "@/components/chapters/ChapterPortal";
import ChapterMiracle from "@/components/chapters/ChapterMiracle";
import ChapterTimeline from "@/components/chapters/ChapterTimeline";
import ChapterJourney from "@/components/chapters/ChapterJourney";
import MemoryGallery from "@/components/MemoryGallery";
import LoveLetter from "@/components/LoveLetter";
import CandleInteraction from "@/components/CandleInteraction";
import ChapterFinale from "@/components/chapters/ChapterFinale";

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
        <ChapterTimeline />
        <ChapterJourney />
        <MemoryGallery />
        <LoveLetter />
        <CandleInteraction />
        <ChapterFinale />
      </main>
    </>
  );
}
