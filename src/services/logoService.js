import { supabase } from "@/lib/supabase";

/**
 * LogoService - Handles store logo upload, validation, and management
 * Implements requirements 1.2, 5.1, 5.2, 5.3
 */
export class LogoService {
  constructor() {
    this.STORAGE_BUCKET = 'store-logos';
    this.MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB default
    this.ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
    this.MAX_WIDTH = 1200;
    this.MAX_HEIGHT = 800;
  }

  /**
   * Validates uploaded file according to requirements
   * @param {File} file - The file to validate
   * @returns {Object} - Validation result with success/error details
   */
  async validateFile(file) {
    const errors = [];

    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        errors: ['No file provided']
      };
    }

    // Validate file format
    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      errors.push(`Invalid file format. Allowed formats: ${this.ALLOWED_FORMATS.join(', ')}`);
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Validate image integrity by attempting to load it
    try {
      const imageValidation = await this._validateImageIntegrity(file);
      if (!imageValidation.isValid) {
        errors.push(...imageValidation.errors);
      }
    } catch (error) {
      errors.push('Failed to validate image integrity');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validates image integrity by loading it
   * @private
   */
  async _validateImageIntegrity(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const errors = [];
        
        // Check dimensions
        if (img.width > this.MAX_WIDTH || img.height > this.MAX_HEIGHT) {
          errors.push(`Image dimensions exceed maximum size of ${this.MAX_WIDTH}x${this.MAX_HEIGHT}px`);
        }

        // Check minimum dimensions
        if (img.width < 50 || img.height < 50) {
          errors.push('Image dimensions are too small (minimum 50x50px)');
        }

        resolve({
          isValid: errors.length === 0,
          errors: errors,
          dimensions: { width: img.width, height: img.height }
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          errors: ['Invalid or corrupted image file']
        });
      };

      img.src = url;
    });
  }

  /**
   * Optimizes image for web display
   * @param {File} file - Original image file
   * @returns {Promise<Blob>} - Optimized image blob
   */
  async optimizeImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate optimal dimensions while maintaining aspect ratio
        const { width: targetWidth, height: targetHeight } = this._calculateOptimalDimensions(
          img.width, 
          img.height
        );

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          0.85 // 85% quality for good balance of size/quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for optimization'));
      };

      img.src = url;
    });
  }

  /**
   * Calculates optimal dimensions for image optimization
   * @private
   */
  _calculateOptimalDimensions(originalWidth, originalHeight) {
    const maxWidth = 800;  // Optimal for web display
    const maxHeight = 600;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      return {
        width: Math.min(maxWidth, originalWidth),
        height: Math.min(maxWidth / aspectRatio, originalHeight)
      };
    } else {
      return {
        width: Math.min(maxHeight * aspectRatio, originalWidth),
        height: Math.min(maxHeight, originalHeight)
      };
    }
  }

  /**
   * Uploads logo to storage and updates database
   * @param {File} file - Logo file to upload
   * @param {string} storeId - Store identifier
   * @param {string} userId - User performing the upload
   * @returns {Promise<Object>} - Upload result
   */
  async uploadLogo(file, storeId, userId) {
    try {
      // Validate file first
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Optimize image
      const optimizedBlob = await this.optimizeImage(file);
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${storeId}/current/logo_${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filename, optimizedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filename);

      const logoUrl = urlData.publicUrl;

      // Update database
      const dbResult = await this._updateLogoInDatabase(storeId, logoUrl, file, userId);
      
      if (!dbResult.success) {
        // Cleanup uploaded file if database update fails
        await this._cleanupUploadedFile(filename);
        throw new Error(dbResult.error);
      }

      return {
        success: true,
        logoUrl: logoUrl,
        filename: filename
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Updates logo information in database
   * @private
   */
  async _updateLogoInDatabase(storeId, logoUrl, originalFile, userId) {
    try {
      // Deactivate existing logos
      await supabase
        .from('store_logos')
        .update({ is_active: false })
        .eq('store_id', storeId);

      // Insert new logo record
      const { data: logoData, error: logoError } = await supabase
        .from('store_logos')
        .insert([{
          store_id: storeId,
          logo_url: logoUrl,
          original_filename: originalFile.name,
          file_size: originalFile.size,
          mime_type: originalFile.type,
          uploaded_by: userId,
          is_active: true
        }])
        .select()
        .single();

      if (logoError) {
        throw new Error(`Database update failed: ${logoError.message}`);
      }

      // Update StoreSettings with new logo URL for real-time application updates
      await this._updateStoreSettingsLogo(logoUrl);

      // Preload the new logo for better performance
      await this.preloadLogo(logoUrl);

      // Trigger cache invalidation for real-time updates
      await this._invalidateSettingsCache();

      // Dispatch event with specific logo URL for targeted cache invalidation
      const event = new CustomEvent('logoUpdated', {
        detail: { 
          timestamp: Date.now(),
          logoUrl: logoUrl,
          action: 'upload'
        }
      });
      window.dispatchEvent(event);

      // Record change history
      await this._recordLogoChange(storeId, 'upload', null, logoUrl, userId);

      return { success: true, data: logoData };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Updates StoreSettings with new logo URL for real-time application updates
   * @private
   */
  async _updateStoreSettingsLogo(logoUrl) {
    try {
      // Import the API service to update StoreSettings
      const { api } = await import('@/api/supabaseService');
      
      // Get existing settings
      const existingSettings = await api.entities.StoreSettings.list();
      
      if (existingSettings.length > 0) {
        // Update existing settings
        await api.entities.StoreSettings.update(existingSettings[0].id, {
          logo_url: logoUrl
        });
      } else {
        // Create new settings with logo
        await api.entities.StoreSettings.create({
          logo_url: logoUrl,
          store_name: "Nexus Commerce"
        });
      }
    } catch (error) {
      console.warn('Failed to update StoreSettings logo:', error);
      // Don't fail the main operation for StoreSettings update issues
    }
  }

  /**
   * Removes logo URL from StoreSettings
   * @private
   */
  async _removeStoreSettingsLogo() {
    try {
      // Import the API service to update StoreSettings
      const { api } = await import('@/api/supabaseService');
      
      // Get existing settings
      const existingSettings = await api.entities.StoreSettings.list();
      
      if (existingSettings.length > 0) {
        // Update existing settings to remove logo
        await api.entities.StoreSettings.update(existingSettings[0].id, {
          logo_url: null
        });
      }
    } catch (error) {
      console.warn('Failed to remove StoreSettings logo:', error);
      // Don't fail the main operation for StoreSettings update issues
    }
  }

  /**
   * Records logo change in history table
   * @private
   */
  async _recordLogoChange(storeId, action, oldLogoUrl, newLogoUrl, userId) {
    try {
      await supabase
        .from('logo_change_history')
        .insert([{
          store_id: storeId,
          action: action,
          old_logo_url: oldLogoUrl,
          new_logo_url: newLogoUrl,
          changed_by: userId
        }]);
    } catch (error) {
      console.warn('Failed to record logo change history:', error);
      // Don't fail the main operation for history recording issues
    }
  }

  /**
   * Removes uploaded file from storage
   * @private
   */
  async _cleanupUploadedFile(filename) {
    try {
      await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filename]);
    } catch (error) {
      console.warn('Failed to cleanup uploaded file:', error);
    }
  }

  /**
   * Removes current logo for a store
   * @param {string} storeId - Store identifier
   * @param {string} userId - User performing the removal
   * @returns {Promise<Object>} - Removal result
   */
  async removeLogo(storeId, userId) {
    try {
      // Get current active logo
      const { data: currentLogo, error: fetchError } = await supabase
        .from('store_logos')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch current logo: ${fetchError.message}`);
      }

      const oldLogoUrl = currentLogo?.logo_url || null;

      // Deactivate all logos for the store
      await supabase
        .from('store_logos')
        .update({ is_active: false })
        .eq('store_id', storeId);

      // Remove logo from StoreSettings for real-time application updates
      await this._removeStoreSettingsLogo();

      // Trigger cache invalidation for real-time updates
      await this._invalidateSettingsCache();

      // Dispatch event for logo removal
      const event = new CustomEvent('logoUpdated', {
        detail: { 
          timestamp: Date.now(),
          logoUrl: oldLogoUrl,
          action: 'remove'
        }
      });
      window.dispatchEvent(event);

      // Record change history
      await this._recordLogoChange(storeId, 'remove', oldLogoUrl, null, userId);

      return {
        success: true,
        message: 'Logo removed successfully'
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Gets current active logo for a store
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} - Current logo data
   */
  async getCurrentLogo(storeId) {
    try {
      const { data, error } = await supabase
        .from('store_logos')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch logo: ${error.message}`);
      }

      return {
        success: true,
        logo: data || null
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Triggers cache invalidation for real-time updates throughout the application
   * @private
   */
  async _invalidateSettingsCache() {
    try {
      // Dispatch a custom event to notify components about logo changes
      const event = new CustomEvent('logoUpdated', {
        detail: { 
          timestamp: Date.now(),
          logoUrl: null // Will be set by calling function
        }
      });
      window.dispatchEvent(event);

      // Also invalidate browser cache for logo images
      await this._invalidateBrowserCache();
    } catch (error) {
      console.warn('Failed to dispatch logo update event:', error);
    }
  }

  /**
   * Invalidate browser cache for logo images
   * @private
   */
  async _invalidateBrowserCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const logoCacheNames = cacheNames.filter(name => 
          name.includes('logo') || name.includes('image')
        );
        
        await Promise.all(
          logoCacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      console.warn('Failed to invalidate browser cache:', error);
    }
  }

  /**
   * Preload logo for better performance
   * @param {string} logoUrl - Logo URL to preload
   * @returns {Promise<boolean>} - Success status
   */
  async preloadLogo(logoUrl) {
    if (!logoUrl) return false;

    try {
      // Use link preload for better performance
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = logoUrl;
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);

      // Also preload using fetch for cache warming
      const response = await fetch(logoUrl, {
        method: 'GET',
        cache: 'force-cache',
        priority: 'low'
      });

      if (response.ok) {
        // Store in cache if Cache API is available
        if ('caches' in window) {
          const cache = await caches.open('logo-cache-v1');
          await cache.put(logoUrl, response.clone());
        }
      }

      return response.ok;
    } catch (error) {
      console.warn('Failed to preload logo:', error);
      return false;
    }
  }

  /**
   * Get optimized logo URL with caching parameters
   * @param {string} baseUrl - Base logo URL
   * @param {Object} options - Optimization options
   * @returns {string} - Optimized URL with cache parameters
   */
  getOptimizedLogoUrl(baseUrl, options = {}) {
    if (!baseUrl) return null;

    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      cacheBuster = false
    } = options;

    try {
      const url = new URL(baseUrl);
      
      // Add optimization parameters if supported by storage provider
      if (width) url.searchParams.set('width', width.toString());
      if (height) url.searchParams.set('height', height.toString());
      if (quality !== 85) url.searchParams.set('quality', quality.toString());
      if (format !== 'auto') url.searchParams.set('format', format);
      
      // Add cache control
      url.searchParams.set('cache', 'max-age=3600');
      
      // Add cache buster if requested (for testing)
      if (cacheBuster) {
        url.searchParams.set('t', Date.now().toString());
      }

      return url.toString();
    } catch (error) {
      console.warn('Failed to optimize logo URL:', error);
      return baseUrl;
    }
  }

  /**
   * Gets logo change history for a store
   * @param {string} storeId - Store identifier
   * @returns {Promise<Object>} - Logo change history
   */
  async getLogoHistory(storeId) {
    try {
      const { data, error } = await supabase
        .from('logo_change_history')
        .select('*')
        .eq('store_id', storeId)
        .order('changed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch logo history: ${error.message}`);
      }

      return {
        success: true,
        history: data || []
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
}

// Export singleton instance
export const logoService = new LogoService();