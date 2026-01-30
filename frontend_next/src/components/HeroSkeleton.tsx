export default function HeroSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row justify-center w-full relative">
      {/* Left Side - Hero Image Skeleton */}
      <div 
        className="w-full lg:w-1/2 bg-gray-800 relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px] animate-pulse"
        style={{ aspectRatio: '1787/1810', minHeight: '246px' }}
      />

      {/* Right Side - Content Skeleton */}
      <div className="w-full lg:w-1/2 flex flex-col justify-end">
        <div className="flex flex-col p-5 sm:p-12 lg:p-24 gap-12 lg:pt-[204px] lg:pb-[64px] h-full">
          <div className="flex flex-col items-center sm:items-start gap-12 lg:gap-[73px]">
            {/* Logo Skeleton */}
            <div 
              className="hidden sm:block bg-gray-800 rounded animate-pulse"
              style={{ width: '321.99px', height: '119.99px', minWidth: '321.99px', minHeight: '119.99px' }}
            />

            <div className="flex flex-col gap-8 lg:gap-10 lg:mt-[38px] w-full">
              {/* Description Skeleton */}
              <div 
                className="bg-gray-800 rounded animate-pulse w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px]"
                style={{ height: '90px' }}
              />
              
              {/* Title Skeleton */}
              <div 
                className="bg-gray-800 rounded animate-pulse w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px]"
                style={{ height: '124px' }}
              />
              
              {/* Services List Skeleton */}
              <div 
                className="bg-gray-800 rounded animate-pulse"
                style={{ height: '240px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
