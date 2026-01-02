/**
 * Unit tests for enhanced ProductSearch component
 * Feature: offline-product-search
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductSearch from '../src/components/pdv/ProductSearch.jsx';
import offlinePDVService from '../src/services/offlinePDVService.js';

// Mock the offline service
jest.mock('../src/services/offlinePDVService.js', () => ({
  init: jest.fn().mockResolvedValue({}),
  getCacheProductCount: jest.fn().mockResolvedValue(5),
  getCacheMetadata: jest.fn().mockResolvedValue({
    last_full_sync: new Date().toISOString(),
    total_products: 5
  }),
  validateCacheIntegrity: jest.fn().mockResolvedValue({
    isValid: true,
    issues: [],
    totalProducts: 5
  }),
  searchProductsOffline: jest.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Product 1',
      sku: 'SKU1',
      barcode: '123456789',
      sale_price: 10.00,
      stock_quantity: 5,
      unit_type: 'un',
      _searchScore: 100
    }
  ])
}));

// Mock the API service
jest.mock('../src/api/supabaseService.js', () => ({
  api: {
    entities: {
      Product: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: '2',
              name: 'Online Product 1',
              sku: 'SKU2',
              barcode: '987654321',
              sale_price: 15.00,
              stock_quantity: 10,
              unit_type: 'un'
            }
          ]
        })
      }
    }
  }
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('Enhanced ProductSearch Component', () => {
  let queryClient;
  let mockOnAddProduct;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockOnAddProduct = jest.fn();
    
    // Reset mocks and set default values
    jest.clearAllMocks();
    
    // Ensure navigator.onLine is true by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    // Set up default mock returns
    offlinePDVService.getCacheProductCount.mockResolvedValue(5);
    offlinePDVService.validateCacheIntegrity.mockResolvedValue({
      isValid: true,
      issues: [],
      totalProducts: 5
    });
    offlinePDVService.getCacheMetadata.mockResolvedValue({
      last_full_sync: new Date().toISOString(),
      total_products: 5
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductSearch
          onAddProduct={mockOnAddProduct}
          searchQuery=""
          setSearchQuery={jest.fn()}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  test('should render search input with status indicator', async () => {
    renderComponent();

    // Check that search input is rendered
    expect(screen.getByPlaceholderText(/Buscar produto por nome/)).toBeInTheDocument();
    
    // Wait for initialization
    await waitFor(() => {
      expect(offlinePDVService.init).toHaveBeenCalled();
    });

    // Check that status indicator is present - should show "Online" or similar online status
    await waitFor(() => {
      // The component shows "Online" when online and cache is available
      expect(screen.getByText(/Online - Sync/)).toBeInTheDocument();
    });
  });

  test('should show offline status when navigator.onLine is false', async () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    renderComponent();

    await waitFor(() => {
      // When offline with cache available, should show "Offline - Usando cache"
      expect(screen.getByText(/Offline.*Usando cache/)).toBeInTheDocument();
    });
  });

  test('should show empty cache warning when offline and cache is empty', async () => {
    // Mock empty cache
    offlinePDVService.getCacheProductCount.mockResolvedValue(0);
    
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const mockSetSearchQuery = jest.fn();
    renderComponent({ searchQuery: 'test', setSearchQuery: mockSetSearchQuery });

    await waitFor(() => {
      // Should show the offline empty cache warning message
      // The actual text shown is "Cache de produtos vazio" based on the test output
      expect(screen.getByText(/Cache de produtos vazio/)).toBeInTheDocument();
    });
  });

  test('should perform offline search when offline', async () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const mockSetSearchQuery = jest.fn();
    renderComponent({ searchQuery: 'test', setSearchQuery: mockSetSearchQuery });

    await waitFor(() => {
      expect(offlinePDVService.searchProductsOffline).toHaveBeenCalledWith('test', { limit: 10 });
    });

    // Should show offline search results
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('1 resultado(s) do cache local')).toBeInTheDocument();
    });
  });

  test('should show cache indicator on individual results when offline', async () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const mockSetSearchQuery = jest.fn();
    renderComponent({ searchQuery: 'test', setSearchQuery: mockSetSearchQuery });

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Should show cache badge on individual results
    await waitFor(() => {
      expect(screen.getByText('Cache')).toBeInTheDocument();
    });
  });

  test('should handle online/offline transitions', async () => {
    // Ensure we start online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    const mockSetSearchQuery = jest.fn();
    renderComponent({ searchQuery: 'test', setSearchQuery: mockSetSearchQuery });

    // Initially online - wait for component to initialize and show online status
    await waitFor(() => {
      // The component should show "Online" in the status indicator
      expect(screen.getByText(/Online - Sync/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simulate going offline - ensure cache has products
    offlinePDVService.getCacheProductCount.mockResolvedValue(5);
    
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    // Trigger offline event
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      // Should show offline status
      expect(screen.getByText(/Offline/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simulate going back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Trigger online event
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.getByText(/Online - Sync/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('should call onAddProduct when product is selected', async () => {
    // Set offline to use mock offline results
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const mockSetSearchQuery = jest.fn();
    renderComponent({ searchQuery: 'test', setSearchQuery: mockSetSearchQuery });

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Click on the product
    fireEvent.click(screen.getByText('Test Product 1'));

    expect(mockOnAddProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'Test Product 1'
      }),
      1
    );
  });
});