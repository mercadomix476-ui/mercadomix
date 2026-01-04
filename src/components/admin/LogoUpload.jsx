import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { logoService } from '@/services/logoService';
import { cn } from '@/lib/utils';

/**
 * LogoUpload Component
 * Implements requirements 1.1, 1.4 - File upload interface with drag-and-drop support,
 * image preview, upload progress indication, and validation feedback
 */
export function LogoUpload({ 
  storeId, 
  userId, 
  onUploadSuccess, 
  onUploadError,
  className 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Only set drag inactive if we're leaving the drop zone itself
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDragActive(false);
      }
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file selection from input or drop
  const handleFileSelection = useCallback(async (file) => {
    setSelectedFile(file);
    setValidationErrors([]);
    setUploadErrors([]);
    
    // Create preview URL
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Validate file
      try {
        const validation = await logoService.validateFile(file);
        if (!validation.isValid) {
          setValidationErrors(validation.errors);
        }
      } catch (error) {
        setValidationErrors(['Failed to validate file']);
      }
    } else {
      setPreviewUrl(null);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  }, [handleFileSelection]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !storeId || !userId) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadErrors([]);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await logoService.uploadLogo(selectedFile, storeId, userId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        // Success callback
        onUploadSuccess?.(result);
        
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setValidationErrors([]);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadErrors(result.errors || ['Upload failed']);
        onUploadError?.(result.errors);
      }
    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      setUploadErrors([errorMessage]);
      onUploadError?.([errorMessage]);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [selectedFile, storeId, userId, onUploadSuccess, onUploadError]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationErrors([]);
    setUploadErrors([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasErrors = validationErrors.length > 0 || uploadErrors.length > 0;
  const canUpload = selectedFile && !hasErrors && !uploading && storeId && userId;

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle>Upload Store Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragActive 
              ? "border-emerald-500 bg-emerald-50" 
              : hasErrors 
                ? "border-red-300 bg-red-50"
                : "border-slate-300 hover:border-slate-400"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
            aria-label="Select logo file"
          />
          
          {!selectedFile ? (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 text-slate-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Drop your logo here, or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WebP up to 2MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="max-w-48 max-h-32 object-contain rounded border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md hover:bg-slate-50"
                    disabled={uploading}
                    aria-label="Remove selected file"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              {/* File Info */}
              <div className="text-sm text-slate-600">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <ProgressBar 
              value={uploadProgress} 
              showLabel 
              label="Uploading logo..."
              variant="default"
            />
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  File validation failed
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Upload failed
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          {selectedFile && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={uploading}
            >
              Clear
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            variant="primary"
          >
            {uploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}