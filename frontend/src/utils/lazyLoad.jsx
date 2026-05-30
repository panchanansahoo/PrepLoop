import { lazy, Suspense } from 'react';

export const lazyLoad = (importFunc, fallback = <div>Loading...</div>) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export const preloadComponent = (importFunc) => {
  const component = lazy(importFunc);
  importFunc();
  return component;
};
