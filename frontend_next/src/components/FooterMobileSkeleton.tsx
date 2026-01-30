export default function FooterMobileSkeleton() {
  return (
    <footer className="bg-white w-full block sm:hidden pb-[60px]">
      <div className="flex flex-col justify-between gap-20 lg:gap-40 px-21 lg:px-24 pt-12 lg:pt-24 pb-8 lg:pb-16 w-full">
        {/* Logo skeleton */}
        <div className="flex flex-col items-center justify-stretch gap-16 lg:gap-32 w-full">
          <div className="relative">
            <div className="mt-10 lg:mt-[79px]">
              <div className="w-full max-w-[125.75px] h-[51.69px] bg-gray-200 animate-pulse rounded" />
            </div>
          </div>

          {/* Accordion skeleton */}
          <div className="flex flex-col gap-12 lg:gap-24 w-full -mt-8 sm:mt-24 lg:mt-[203px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 xl:gap-24 2xl:gap-26 w-full">
              <div className="w-full space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="border-b border-gray-200 pb-4">
                    <div className="h-[30px] w-full bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section skeleton */}
        <div className="flex flex-col sm:flex-row justify-between w-full -mt-15 sm:-mt-8 lg:-mt-[67px] gap-8 sm:gap-0">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mx-auto" />
        </div>
      </div>
    </footer>
  );
}
