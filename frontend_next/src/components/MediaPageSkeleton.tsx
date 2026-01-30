export default function MediaPageSkeleton() {
  return (
    <div className="bg-[#0E1011] min-h-screen">
      {/* Hero Section Skeleton */}
      <section className="pt-[0px] sm:pt-40 md:pt-[150px] pb-[35px] md:pb-[17px] px-5 sm:px-12 lg:px-24">
        <div className="animate-pulse">
          <div className="h-[72px] sm:h-[150px] lg:h-[200px] 2xl:h-[280px] bg-gray-700 rounded mb-6 md:mb-2"></div>
          <div className="h-[32px] md:h-[80px] bg-gray-700 rounded max-w-[1400px]"></div>
        </div>
      </section>

      {/* Services Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div key={index} className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="h-[400px] md:h-[600px] bg-gray-700"></div>
              <div className="bg-[#181A1B] p-5 sm:p-12 lg:p-24 space-y-6">
                <div className="h-8 bg-gray-600 rounded w-3/4"></div>
                <div className="h-6 bg-gray-600 rounded w-full"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-600 rounded w-full"></div>
                  <div className="h-4 bg-gray-600 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-600 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials Skeleton */}
      <section className="py-16 md:py-24">
        <div className="animate-pulse px-5 sm:px-22">
          <div className="h-[100px] sm:h-[150px] lg:h-[200px] bg-gray-700 rounded mb-6"></div>
          <div className="h-[32px] md:h-[72px] bg-gray-700 rounded max-w-[1400px]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-24">
          <div className="h-[248px] md:h-[1080px] bg-gray-700"></div>
          <div className="bg-[#181A1B] p-5 sm:p-12 md:p-24 space-y-8">
            <div className="h-12 bg-gray-600 rounded w-16"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-600 rounded w-1/2"></div>
              <div className="h-8 bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Skeleton */}
      <section className="py-16 md:py-24">
        <div className="animate-pulse px-5 sm:px-22">
          <div className="h-[100px] sm:h-[200px] bg-gray-700 rounded mb-6"></div>
          <div className="h-[32px] md:h-[80px] bg-gray-700 rounded max-w-[1400px]"></div>
        </div>
        <div className="space-y-0 mt-24">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="h-[360px] md:h-[1080px] bg-gray-700"></div>
              <div className="bg-[#181A1B] p-5 md:p-12 lg:p-24 space-y-12">
                <div className="h-16 md:h-32 bg-gray-600 rounded w-24"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-600 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-600 rounded w-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-600 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}