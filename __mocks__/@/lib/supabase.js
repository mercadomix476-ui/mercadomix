// Mock for supabase lib to avoid import.meta issues in tests
export const supabase = {
  auth: {
    getUser: jest.fn(() => ({ data: { user: null } })),
    signInWithPassword: jest.fn(() => ({ data: { user: null }, error: null })),
    signOut: jest.fn(() => ({ error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: null, error: null })),
        limit: jest.fn(() => ({ data: [], error: null })),
      })),
      order: jest.fn(() => ({ data: [], error: null })),
      data: [],
      error: null,
    })),
    insert: jest.fn(() => ({ data: null, error: null })),
    update: jest.fn(() => ({ data: null, error: null })),
    delete: jest.fn(() => ({ data: null, error: null })),
  })),
};