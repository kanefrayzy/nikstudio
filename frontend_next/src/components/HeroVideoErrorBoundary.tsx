"use client";
import React, { Component, ReactNode } from 'react';
import Image from 'next/image';

interface Props {
  children: ReactNode;
  fallbackImage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class HeroVideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('HeroVideoErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when video component fails
      return (
        <div className="relative w-full h-full overflow-hidden">
          <Image 
            src={this.props.fallbackImage || "/images/home/hero-image.png"}
            alt="Hero Image" 
            className="object-cover object-center w-full h-full"
            width={1787}
            height={1810}
            priority
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default HeroVideoErrorBoundary;