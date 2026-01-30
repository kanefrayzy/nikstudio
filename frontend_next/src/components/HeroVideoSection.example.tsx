// Example usage of HeroVideoSection component
// This shows how to integrate it into the existing home page structure

import HeroVideoSection from './HeroVideoSection';

// Example 1: Basic usage with video URL
const ExampleWithVideo = () => {
  return (
    <div className="w-full lg:w-1/2 bg-white relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px]">
      <HeroVideoSection 
        videoUrl="https://example.com/hero-video.mp4"
        fallbackImage="/images/home/hero-image.png"
      />
    </div>
  );
};

// Example 2: Fallback only (no video)
const ExampleWithFallback = () => {
  return (
    <div className="w-full lg:w-1/2 bg-white relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px]">
      <HeroVideoSection 
        fallbackImage="/images/home/hero-image.png"
      />
    </div>
  );
};

// Example 3: Integration with API data
const ExampleWithAPIData = ({ homeContent }: { homeContent?: any }) => {
  return (
    <div className="w-full lg:w-1/2 bg-white relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px]">
      <HeroVideoSection 
        videoUrl={homeContent?.hero_video_url}
        fallbackImage={homeContent?.hero_fallback_image_url || "/images/home/hero-image.png"}
      />
    </div>
  );
};

export { ExampleWithVideo, ExampleWithFallback, ExampleWithAPIData };