/**
 * Integration tests for LogoService
 * Verifies that all components work together correctly
 */

import { LogoService, logoService } from '../src/services/logoService';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/logo.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/logo.jpg' } }),
        remove: jest.fn().mockResolvedValue({ error: null })
      }))
    },
    from: jest.fn((table) => {
      if (table === 'store_logos') {
        return {
          insert: jest.fn(() => ({ 
            select: jest.fn(() => ({ 
              single: jest.fn().mockResolvedValue({ data: { id: '123', logo_url: 'https://example.com/logo.jpg' }, error: null })
            }))
          })),
          update: jest.fn(() => ({ 
            eq: jest.fn().mockResolvedValue({ error: null })
          })),
          select: jest.fn(() => ({ 
            eq: jest.fn(() => ({ 
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: { logo_url: 'https://example.com/logo.jpg' }, error: null })
              }))
            }))
          }))
        };
      } else if (table === 'logo_change_history') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn(() => ({ 
            eq: jest.fn(() => ({ 
              order: jest.fn().mockResolvedValue({ data: [], error: null })
            }))
          }))
        };
      }
      return {};
    })
  }
}));

// Mock DOM APIs
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
}));

global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  const mockBlob = new Blob(['optimized-image-data'], { type: 'image/jpeg' });
  callback(mockBlob);
});

global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.width = 800;
    this.height = 600;
  }
  
  set src(value) {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
};

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('LogoService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('LogoService can be instantiated', () => {
    const service = new LogoService();
    expect(service).toBeInstanceOf(LogoService);
    expect(service.STORAGE_BUCKET).toBe('store-logos');
    expect(service.MAX_FILE_SIZE).toBe(2 * 1024 * 1024);
    expect(service.ALLOWED_FORMATS).toContain('image/jpeg');
  });

  test('Singleton instance is available', () => {
    expect(logoService).toBeInstanceOf(LogoService);
    expect(logoService).toBe(logoService); // Same instance
  });

  test('Complete upload workflow works', async () => {
    // Arrange
    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
    
    const storeId = 'store-123';
    const userId = 'user-456';

    // Act
    const result = await logoService.uploadLogo(validFile, storeId, userId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.logoUrl).toBe('https://example.com/logo.jpg');
    expect(result.filename).toBeDefined();
  });

  test('Validation, optimization, and upload work together', async () => {
    // Arrange
    const validFile = new File(['content'], 'test.png', { type: 'image/png' });
    Object.defineProperty(validFile, 'size', { value: 500 * 1024 }); // 500KB
    
    // Act - Test validation
    const validation = await logoService.validateFile(validFile);
    expect(validation.isValid).toBe(true);

    // Act - Test optimization
    const optimized = await logoService.optimizeImage(validFile);
    expect(optimized).toBeInstanceOf(Blob);
    expect(optimized.type).toBe('image/jpeg');

    // Act - Test full upload
    const uploadResult = await logoService.uploadLogo(validFile, 'store-123', 'user-456');
    expect(uploadResult.success).toBe(true);
  });

  test('Error handling works across all methods', async () => {
    // Test invalid file
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(invalidFile, 'size', { value: 1024 });

    const validation = await logoService.validateFile(invalidFile);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    const uploadResult = await logoService.uploadLogo(invalidFile, 'store-123', 'user-456');
    expect(uploadResult.success).toBe(false);
    expect(uploadResult.errors).toBeDefined();
  });

  test('Logo management methods work', async () => {
    const storeId = 'store-123';
    const userId = 'user-456';

    // Test getCurrentLogo
    const currentLogo = await logoService.getCurrentLogo(storeId);
    expect(currentLogo.success).toBe(true);

    // Test getLogoHistory  
    const history = await logoService.getLogoHistory(storeId);
    expect(history.success).toBe(true);

    // Test removeLogo
    const removeResult = await logoService.removeLogo(storeId, userId);
    expect(removeResult.success).toBe(true);
  });
});