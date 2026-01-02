/**
 * Property-based tests for Logo Service Error Handling
 * **Feature: store-logo-upload, Property 3: Error handling clarity**
 * **Validates: Requirements 1.4**
 */

import fc from 'fast-check';
import { LogoService } from '../src/services/logoService';

// Mock Supabase for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn()
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
      update: jest.fn(() => ({ eq: jest.fn() })),
      select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) }))
    }))
  }
}));

// Mock canvas and image for testing
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
}));

global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  const mockBlob = new Blob(['mock-image-data'], { type: 'image/jpeg' });
  callback(mockBlob);
});

// Mock Image constructor with error scenarios
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.width = 0;
    this.height = 0;
  }
  
  set src(value) {
    setTimeout(() => {
      if (value.includes('corrupted') || value.includes('invalid')) {
        if (this.onerror) this.onerror();
      } else if (value.includes('oversized')) {
        this.width = 2000;  // Exceeds MAX_WIDTH
        this.height = 1500; // Exceeds MAX_HEIGHT
        if (this.onload) this.onload();
      } else if (value.includes('tiny')) {
        this.width = 30;   // Below minimum
        this.height = 20;  // Below minimum
        if (this.onload) this.onload();
      } else {
        this.width = 800;
        this.height = 600;
        if (this.onload) this.onload();
      }
    }, 10);
  }
};

global.URL.createObjectURL = jest.fn((file) => {
  if (file.name.includes('corrupted')) return 'blob:corrupted-url';
  if (file.name.includes('oversized')) return 'blob:oversized-url';
  if (file.name.includes('tiny')) return 'blob:tiny-url';
  return `blob:mock-url-${file.name}`;
});

global.URL.revokeObjectURL = jest.fn();

describe('LogoService Error Handling', () => {
  let logoService;

  beforeEach(() => {
    logoService = new LogoService();
    jest.clearAllMocks();
  });

  // Generators for different error scenarios
  const invalidFormatFileArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '.txt'),
    type: fc.constantFrom('text/plain', 'application/pdf', 'video/mp4', 'audio/mp3'),
    size: fc.integer({ min: 1000, max: 1024 * 1024 })
  }).map(props => {
    const file = new File(['content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const oversizedFileArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 3 * 1024 * 1024, max: 10 * 1024 * 1024 }) // 3MB to 10MB
  }).map(props => {
    const file = new File(['content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const corruptedFileArb = fc.record({
    name: fc.constant('corrupted.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 1000, max: 1024 * 1024 })
  }).map(props => {
    const file = new File(['corrupted'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const oversizedDimensionsFileArb = fc.record({
    name: fc.constant('oversized.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 1000, max: 1024 * 1024 })
  }).map(props => {
    const file = new File(['content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  const tinyDimensionsFileArb = fc.record({
    name: fc.constant('tiny.jpg'),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 100, max: 1000 })
  }).map(props => {
    const file = new File(['content'], props.name, { type: props.type });
    Object.defineProperty(file, 'size', { value: props.size });
    return file;
  });

  /**
   * Property 3: Error handling clarity
   * For any invalid file upload attempt, the system should provide 
   * clear, specific error messages explaining the validation failure
   */
  test('Property 3: Invalid format errors are clear and specific', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidFormatFileArb,
        async (file) => {
          // Act: Validate invalid format file
          const result = await logoService.validateFile(file);
          
          // Assert: Error message should be clear and specific
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain specific format error
          const formatError = result.errors.find(error => 
            error.includes('Invalid file format') && 
            error.includes('Allowed formats:')
          );
          expect(formatError).toBeDefined();
          
          // Should mention allowed formats
          expect(formatError).toMatch(/image\/jpeg|image\/png|image\/webp/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: File size errors include specific limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        oversizedFileArb,
        async (file) => {
          // Act: Validate oversized file
          const result = await logoService.validateFile(file);
          
          // Assert: Error message should include specific size limit
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain specific size error with limit
          const sizeError = result.errors.find(error => 
            error.includes('File size exceeds maximum limit') &&
            error.includes('MB')
          );
          expect(sizeError).toBeDefined();
          
          // Should include the actual limit value
          expect(sizeError).toMatch(/\d+MB/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Image corruption errors are descriptive', async () => {
    await fc.assert(
      fc.asyncProperty(
        corruptedFileArb,
        async (file) => {
          // Act: Validate corrupted file
          const result = await logoService.validateFile(file);
          
          // Assert: Error message should describe the corruption issue
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain corruption-specific error
          const corruptionError = result.errors.find(error => 
            error.includes('Invalid or corrupted image file') ||
            error.includes('Failed to validate image integrity')
          );
          expect(corruptionError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Dimension errors specify limits and current values', async () => {
    await fc.assert(
      fc.asyncProperty(
        oversizedDimensionsFileArb,
        async (file) => {
          // Act: Validate file with oversized dimensions
          const result = await logoService.validateFile(file);
          
          // Assert: Error should specify dimension limits
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain dimension-specific error
          const dimensionError = result.errors.find(error => 
            error.includes('Image dimensions exceed maximum size') &&
            error.includes('px')
          );
          expect(dimensionError).toBeDefined();
          
          // Should include specific pixel dimensions
          expect(dimensionError).toMatch(/\d+x\d+px/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Minimum dimension errors are informative', async () => {
    await fc.assert(
      fc.asyncProperty(
        tinyDimensionsFileArb,
        async (file) => {
          // Act: Validate file with tiny dimensions
          const result = await logoService.validateFile(file);
          
          // Assert: Error should specify minimum requirements
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain minimum dimension error
          const minDimensionError = result.errors.find(error => 
            error.includes('Image dimensions are too small') &&
            error.includes('minimum')
          );
          expect(minDimensionError).toBeDefined();
          
          // Should specify minimum dimensions
          expect(minDimensionError).toMatch(/\d+x\d+px/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Missing file errors are clear', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(null, undefined),
        async (file) => {
          // Act: Validate missing file
          const result = await logoService.validateFile(file);
          
          // Assert: Error should clearly indicate missing file
          expect(result.isValid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain clear missing file error
          const missingFileError = result.errors.find(error => 
            error.includes('No file provided')
          );
          expect(missingFileError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Multiple errors are all reported clearly', async () => {
    // Create a file that violates multiple rules
    const multiErrorFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(multiErrorFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB

    // Act: Validate file with multiple issues
    const result = await logoService.validateFile(multiErrorFile);
    
    // Assert: All errors should be reported
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(1);
    
    // Should contain format error
    const hasFormatError = result.errors.some(error => 
      error.includes('Invalid file format')
    );
    expect(hasFormatError).toBe(true);
    
    // Should contain size error
    const hasSizeError = result.errors.some(error => 
      error.includes('File size exceeds maximum limit')
    );
    expect(hasSizeError).toBe(true);
  });

  test('Property 3: Error messages are consistent for same error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(invalidFormatFileArb, { minLength: 2, maxLength: 5 }),
        async (files) => {
          // Act: Validate multiple files with same error type
          const results = await Promise.all(
            files.map(file => logoService.validateFile(file))
          );
          
          // Assert: Error messages should be consistent
          const formatErrors = results.map(result => 
            result.errors.find(error => error.includes('Invalid file format'))
          ).filter(Boolean);
          
          expect(formatErrors.length).toBeGreaterThan(1);
          
          // All format errors should have the same structure
          const firstError = formatErrors[0];
          formatErrors.forEach(error => {
            expect(error).toMatch(/Invalid file format\. Allowed formats:/);
            expect(error.includes('image/jpeg')).toBe(firstError.includes('image/jpeg'));
            expect(error.includes('image/png')).toBe(firstError.includes('image/png'));
            expect(error.includes('image/webp')).toBe(firstError.includes('image/webp'));
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});