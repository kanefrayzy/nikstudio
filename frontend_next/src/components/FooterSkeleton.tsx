export default function FooterSkeleton() {
  return (
    <footer className="bg-white w-full hidden sm:block">
      <div className="flex flex-col justify-between gap-20 lg:gap-40 px-6 sm:px-12 lg:px-24 pt-12 lg:pt-24 pb-8 lg:pb-16 w-full">
        {/* Logo skeleton */}
        <div className="flex flex-col justify-stretch gap-16 lg:gap-32 w-full">
          <div className="relative">
            <div className="mt-10 lg:mt-[79px]">
              <div className="w-full max-w-[393.59px] h-[139.15px] bg-gray-200 animate-pulse rounded" />
            </div>
          </div>

          {/* Navigation skeleton */}
          <div className="flex flex-col gap-12 lg:gap-24 w-full mt-12 sm:mt-24 lg:mt-[203px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 xl:gap-24 2xl:gap-26 w-full">
              {/* 4 columns */}
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="flex flex-col gap-4 lg:gap-8 self-stretch">
                  <div className="h-[30px] w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="flex flex-col gap-2 lg:gap-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-[34px] w-full bg-gray-200 animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section skeleton */}
        <div className="flex flex-col sm:flex-row justify-between w-full sm:-mt-8 lg:-mt-[67px] gap-8 sm:gap-0">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </footer>
  );
}
