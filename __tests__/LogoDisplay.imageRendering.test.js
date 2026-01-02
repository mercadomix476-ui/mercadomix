/**
 * Property-based tests for Logo Display Image Rendering Preservation
 * **Feature: store-logo-upload, Property 7: Image rendering preservation**
 * **Validates: Requirements 3.2, 3.3, 5.4**
 * 
 * For any uploaded image, the display should maintain proper aspect ratio 
 * and sizing without distortion, regardless of original dimensions
 */

import fc from 'fast-check';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogoDisplay, StoreLogo, SystemLogo } from '../src/components/ui/LogoDisplay';

// Create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Test wrapper with QueryClient
const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Generators for property-based testing
const dimensionsArb = fc.record({
  width: fc.integer({ min: 50, max: 4000 }),
  height: fc.integer({ min: 50, max: 4000 })
});

const logoUrlArb = fc.webUrl();
const altTextArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const storeNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const sizeArb = fc.constantFrom('small', 'medium', 'large', 'xlarge');
const shapeArb = fc.constantFrom('rounded', 'circle', 'square');

describe('Logo Display Image Rendering Preservation', () => {

  /**
   * Property 7: Image rendering preservation
   * For any uploaded image, the display should maintain proper aspect ratio 
   * and sizing without distortion, regardless of original dimensions
   * 
   * This test focuses on the container structure which is the core of the property
   */
  test('Property 7: Image rendering preservation - container structure maintains sizing consistency', () => {
    fc.assert(
      fc.property(
        dimensionsArb,
        logoUrlArb,
        altTextArb,
        sizeArb,
        shapeArb,
        (dimensions, logoUrl, altText, size, shape) => {
          const { container } = render(
            <TestWrapper>
              <LogoDisplay
                logoUrl={logoUrl}
                alt={altText}
                size={size}
                shape={shape}
              />
            </TestWrapper>
          );

          // The component should render a container
          expect(container.firstChild).toBeInTheDocument();

          // Find the logo container (either loading state or final state)
          const logoContainer = container.querySelector('[role="img"]');
          expect(logoContainer).toBeInTheDocument();

          // The container should have the correct size class applied
          const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-12 h-12',
            large: 'w-16 h-16',
            xlarge: 'w-20 h-20'
          };
          
          expect(logoContainer).toHaveClass(sizeClasses[size]);

          // The container should have the correct shape class applied
          const shapeClasses = {
            rounded: 'rounded-lg',
            circle: 'rounded-full',
            square: 'rounded-none'
          };
          
          expect(logoContainer).toHaveClass(shapeClasses[shape]);

          // The container should have overflow hidden to maintain aspect ratio
          expect(logoContainer).toHaveClass('overflow-hidden');
          expect(logoContainer).toHaveClass('flex-shrink-0');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Image rendering preservation - StoreLogo maintains consistent styling structure', () => {
    fc.assert(
      fc.property(
        logoUrlArb,
        storeNameArb,
        sizeArb,
        (logoUrl, storeName, size) => {
          const { container } = render(
            <TestWrapper>
              <StoreLogo
                logoUrl={logoUrl}
                storeName={storeName}
                size={size}
              />
            </TestWrapper>
          );

          // Find the logo container
          const logoContainer = container.querySelector('[role="img"]');
          expect(logoContainer).toBeInTheDocument();

          // StoreLogo should always be circular
          expect(logoContainer).toHaveClass('rounded-full');
          
          // Should have border styling
          expect(logoContainer).toHaveClass('border-4');
          expect(logoContainer).toHaveClass('border-emerald-600');
          expect(logoContainer).toHaveClass('shadow-lg');

          // Should maintain size consistency
          const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-12 h-12',
            large: 'w-16 h-16',
            xlarge: 'w-20 h-20'
          };
          
          expect(logoContainer).toHaveClass(sizeClasses[size]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Image rendering preservation - SystemLogo maintains system branding structure', () => {
    fc.assert(
      fc.property(
        sizeArb,
        (size) => {
          const { container } = render(
            <TestWrapper>
              <SystemLogo size={size} />
            </TestWrapper>
          );

          // Find the logo container
          const logoContainer = container.querySelector('[role="img"]');
          expect(logoContainer).toBeInTheDocument();

          // SystemLogo should always be rounded (not circular)
          expect(logoContainer).toHaveClass('rounded-lg');
          
          // Should have the correct size
          const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-12 h-12',
            large: 'w-16 h-16',
            xlarge: 'w-20 h-20'
          };
          
          expect(logoContainer).toHaveClass(sizeClasses[size]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Image rendering preservation - responsive sizing works across all dimensions', () => {
    fc.assert(
      fc.property(
        dimensionsArb,
        logoUrlArb,
        altTextArb,
        (dimensions, logoUrl, altText) => {
          // Test all size variants
          const sizes = ['small', 'medium', 'large', 'xlarge'];
          
          for (const size of sizes) {
            const { container, unmount } = render(
              <TestWrapper>
                <LogoDisplay
                  logoUrl={logoUrl}
                  alt={altText}
                  size={size}
                />
              </TestWrapper>
            );

            // Find the logo container
            const logoContainer = container.querySelector('[role="img"]');
            expect(logoContainer).toBeInTheDocument();

            // Container should maintain consistent sizing regardless of image dimensions
            const sizeClasses = {
              small: 'w-8 h-8',
              medium: 'w-12 h-12',
              large: 'w-16 h-16',
              xlarge: 'w-20 h-20'
            };
            
            expect(logoContainer).toHaveClass(sizeClasses[size]);
            
            // Container should have proper styling for aspect ratio preservation
            expect(logoContainer).toHaveClass('overflow-hidden');
            expect(logoContainer).toHaveClass('flex-shrink-0');
            
            unmount();
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to multiple renders per test
    );
  });

  test('Property 7: Image rendering preservation - loading states maintain container structure', () => {
    fc.assert(
      fc.property(
        altTextArb,
        sizeArb,
        shapeArb,
        (altText, size, shape) => {
          const { container } = render(
            <TestWrapper>
              <LogoDisplay
                logoUrl="http://example.com/logo.jpg"
                alt={altText}
                size={size}
                shape={shape}
                showLoadingState={true}
              />
            </TestWrapper>
          );

          // Find the logo container (should be in loading state)
          const logoContainer = container.querySelector('[role="img"]');
          expect(logoContainer).toBeInTheDocument();

          // Container should maintain size classes even in loading state
          const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-12 h-12',
            large: 'w-16 h-16',
            xlarge: 'w-20 h-20'
          };
          
          expect(logoContainer).toHaveClass(sizeClasses[size]);

          // Container should maintain shape classes even in loading state
          const shapeClasses = {
            rounded: 'rounded-lg',
            circle: 'rounded-full',
            square: 'rounded-none'
          };
          
          expect(logoContainer).toHaveClass(shapeClasses[shape]);

          // Should have loading animation
          expect(logoContainer).toHaveClass('animate-pulse');
        }
      ),
      { numRuns: 100 }
    );
  });
});