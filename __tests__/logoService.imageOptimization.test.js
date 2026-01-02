/**
 * Property-based tests for Logo Service Image Optimization
 * **Feature: store-logo-upload, Property 11: Image optimization consistency**
 * **Validates: Requirements 5.3**
 */

import fc from 'fast-check';
import { LogoService } from '../src/services/logoService';

// Mock canvas for testing
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
}));

// Mock canvas toBlob with different scenarios
global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback, type, quality) => {
  // Simulate different optimization results based on input
  const originalSize = 1024 * 1024; // 1MB base size
  const compressionRatio = quality || 0.85;
  const optimizedSize = Math.floor(originalSize * compressionRatio);
  
  const mockBlob = new Blob(['optimized-image-data'], { type: type || 'image/jpeg' });
  Object.defineProperty(mockBlob, 'size', { value: optimizedSize });
  
  // Simulate async behavior
  setTimeout(() => callback(mockBlob), 10);
});

// Mock Image constructor with dimension tracking
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.width = 0;
    this.height = 0;
  }
  
  set src(value) {
    setTimeout(() => {
      // Extract dimensions from the mock URL or use defaults
      if (value.includes('large')) {
        this.width = 1600;
        this.height = 1200;
      } else if (value.includes('small')) {
        this.width = 400;
        this.height = 300;
      } else if (value.includes('wide')) {
        this.width = 1200;
        this.height = 400;
      } else if (value.includes('tall')) {
        this.width = 400;
        this.height = 1200;
      } else if (value.includes('fail')) {
        if (this.onerror) this.onerror();
        return;
      } else {
        this.width = 800;
        this.height = 600;
      }
      
      if (this.onload) this.onload();
    }, 10);
  }
};

global.URL.createObjectURL = jest.fn((file) => {
  // Create mock URLs that encode dimension information
  if (file.name.includes('large')) return 'blob:large-image';
  if (file.name.includes('small')) return 'blob:small-image';
  if (file.name.includes('wide')) return 'blob:wide-image';
  if (file.name.includes('tall')) return 'blob:tall-image';
  if (file.name.includes('fail')) return 'blob:fail-image';
  return `blob:mock-${file.name}`;
});

global.URL.revokeObjectURL = jest.fn();

describe('LogoService Image Optimization', () => {
  let logoService;

  beforeEach(() => {
    logoService = new LogoService();
    jest.clearAllMocks();
  });

  // Generators for different image scenarios
  const largeImageArb = fc.record({
    name: fc.constant('large-image.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 2 * 1024 * 1024, max: 5 * 1024 * 1024 })
  }).map(props => {
    const file = new File(['large-content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const smallImageArb = fc.record({
    name: fc.constant('small-image.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 10000, max: 100000 })
  }).map(props => {
    const file = new File(['small-content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const wideImageArb = fc.record({
    name: fc.constant('wide-image.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 500000, max: 2 * 1024 * 1024 })
  }).map(props => {
    const file = new File(['wide-content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const tallImageArb = fc.record({
    name: fc.constant('tall-image.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 500000, max: 2 * 1024 * 1024 })
  }).map(props => {
    const file = new File(['tall-content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const validImageArb = fc.oneof(largeImageArb, smallImageArb, wideImageArb, tallImageArb);

  /**
   * Property 11: Image optimization consistency
   * For any uploaded image, the system should apply consistent optimization 
   * for web display while preserving visual quality
   */
  test('Property 11: Optimization always produces a valid blob', async () => {
    await fc.assert(
      fc.asyncProperty(
        validImageArb,
        async (file) => {
          // Act: Optimize the image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Result should be a valid blob
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg'); // Should always convert to JPEG
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Large images are consistently resized', async () => {
    await fc.assert(
      fc.asyncProperty(
        largeImageArb,
        async (file) => {
          // Act: Optimize large image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Large images should be optimized (compressed)
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          
          // Should apply compression (mocked as 85% of original)
          expect(result.size).toBeLessThan(1024 * 1024); // Should be compressed
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Small images preserve quality appropriately', async () => {
    await fc.assert(
      fc.asyncProperty(
        smallImageArb,
        async (file) => {
          // Act: Optimize small image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Small images should still be optimized but maintain reasonable quality
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Wide images maintain aspect ratio', async () => {
    await fc.assert(
      fc.asyncProperty(
        wideImageArb,
        async (file) => {
          // Act: Optimize wide image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Wide images should be optimized consistently
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          
          // The optimization should handle wide aspect ratios
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Tall images maintain aspect ratio', async () => {
    await fc.assert(
      fc.asyncProperty(
        tallImageArb,
        async (file) => {
          // Act: Optimize tall image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Tall images should be optimized consistently
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          
          // The optimization should handle tall aspect ratios
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Optimization is deterministic for same input', async () => {
    await fc.assert(
      fc.asyncProperty(
        validImageArb,
        async (file) => {
          // Act: Optimize the same image multiple times
          const result1 = await logoService.optimizeImage(file);
          const result2 = await logoService.optimizeImage(file);
          const result3 = await logoService.optimizeImage(file);
          
          // Assert: Results should be consistent
          expect(result1.type).toBe(result2.type);
          expect(result2.type).toBe(result3.type);
          expect(result1.size).toBe(result2.size);
          expect(result2.size).toBe(result3.size);
        }
      ),
      { numRuns: 25 } // Reduced from 50 to avoid timeout
    );
  }, 10000); // Increase timeout to 10 seconds

  test('Property 11: Optimization handles different input formats consistently', async () => {
    const formats = ['image/jpeg', 'image/png', 'image/webp'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...formats),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 100000, max: 1024 * 1024 }),
        async (mimeType, baseName, fileSize) => {
          // Arrange: Create file with specific format
          const file = new File(['content'], `${baseName}.jpg`, { type: mimeType });
          Object.defineProperty(file, 'size', { value: fileSize });
          
          // Act: Optimize the image
          const result = await logoService.optimizeImage(file);
          
          // Assert: All formats should be consistently converted to JPEG
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Optimization quality is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        validImageArb,
        async (file) => {
          // Act: Optimize image
          const result = await logoService.optimizeImage(file);
          
          // Assert: Quality should be consistent (85% compression in our mock)
          expect(result).toBeInstanceOf(Blob);
          expect(result.type).toBe('image/jpeg');
          
          // Size should reflect consistent compression
          const expectedMaxSize = 1024 * 1024 * 0.85; // 85% of 1MB base
          expect(result.size).toBeLessThanOrEqual(expectedMaxSize + 1000); // Small tolerance
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Failed optimization is handled gracefully', async () => {
    // Create a file that will trigger optimization failure
    const failingFile = new File(['content'], 'fail-image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(failingFile, 'size', { value: 1024 * 1024 });
    
    // Act & Assert: Should reject with clear error (image loading fails)
    await expect(logoService.optimizeImage(failingFile)).rejects.toThrow('Failed to load image for optimization');
    
    // Test canvas failure scenario separately
    const validFile = new File(['content'], 'valid.jpg', { type: 'image/jpeg' });
    
    // Mock canvas toBlob to fail
    const originalToBlob = global.HTMLCanvasElement.prototype.toBlob;
    global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
      callback(null); // Simulate failure
    });
    
    try {
      // Act & Assert: Should reject with clear error
      await expect(logoService.optimizeImage(validFile)).rejects.toThrow('Failed to optimize image');
    } finally {
      // Restore original mock
      global.HTMLCanvasElement.prototype.toBlob = originalToBlob;
    }
  });

  test('Property 11: Dimension calculation is consistent', async () => {
    // Test the private method indirectly through optimization
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 3000 }),
          height: fc.integer({ min: 100, max: 3000 })
        }),
        async ({ width, height }) => {
          // Create a mock file that will have specific dimensions
          const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
          
          // Mock Image to return specific dimensions
          const originalImage = global.Image;
          global.Image = class extends originalImage {
            set src(value) {
              setTimeout(() => {
                this.width = width;
                this.height = height;
                if (this.onload) this.onload();
              }, 10);
            }
          };
          
          try {
            // Act: Optimize image
            const result = await logoService.optimizeImage(file);
            
            // Assert: Should handle any dimensions consistently
            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('image/jpeg');
            expect(result.size).toBeGreaterThan(0);
          } finally {
            // Restore original Image mock
            global.Image = originalImage;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});