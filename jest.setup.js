require('@testing-library/jest-dom');

globalThis.importMetaEnv = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'example-anon-key',
};

import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup IndexedDB mock
require('./__mocks__/indexedDBMock.js');