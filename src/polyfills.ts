// Polyfill for use-sync-external-store compatibility with React 19
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.useSyncExternalStoreWithSelector = window.useSyncExternalStoreWithSelector || function() {
    console.warn('useSyncExternalStoreWithSelector not available, using fallback');
    return null;
  };
}

export {};