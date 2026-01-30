// TypeScript interfaces for media page data from API
export interface MediaPageData {
  hero: {
    title: string;
    description: string;
  };
  services: MediaService[];
  testimonials: {
    title: string;
    subtitle: string;
    items: Testimonial[];
  };
  process: {
    title: string;
    subtitle: string;
    steps: ProcessStep[];
  };
}

export interface MediaService {
  id: number;
  title: string;
  description: string;
  order: number;
  features: ServiceFeature[];
  slides: ServiceSlide[];
  darkBackground?: boolean;
}

export interface ServiceFeature {
  id: number;
  title: string;
  description: string[];
  order: number;
}

export interface ServiceSlide {
  mainImage: string;
  secondaryImage: string;
}

export interface Testimonial {
  id: number;
  company: string;
  quote: string;
  text: string;
  image: string;
  order: number;
}

export interface ProcessStep {
  id: number;
  stepNumber: string;
  title: string;
  subtitle: string;
  image: string;
  description: {
    left: string;
    right: string;
  };
  order: number;
}

// Legacy interfaces for compatibility with existing components
export interface Slide {
  mainImage: string;
  mainPoster?: string | null;
  mainType?: string;
  secondaryImage: string;
  secondaryPoster?: string | null;
  secondaryType?: string;
}

export interface Feature {
  title: string;
  description: string[];
}

export interface Service {
  id: number;
  title: string;
  description: string;
  slides: Slide[];
  features: Feature[];
  darkBackground?: boolean;
}

export interface Step {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  description: {
    left: string;
    right: string;
  };
}

export interface TestimonialLegacy {
  company: string;
  quote: string;
  text: string;
  image: string;
}