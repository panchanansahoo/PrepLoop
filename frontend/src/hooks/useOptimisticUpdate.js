import { useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('optimistic-updates');

export const useOptimisticUpdate = (initialData, updateFn) => {
  const [data, setData] = useState(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (optimisticValue, actualUpdateFn) => {
    const previousData = data;
    
    // Apply optimistic update immediately
    setData(optimisticValue);
    setIsOptimistic(true);
    setError(null);

    try {
      // Perform actual update
      const result = await (actualUpdateFn || updateFn)();
      
      // Update with real data
      setData(result);
      setIsOptimistic(false);
      
      return result;
    } catch (err) {
      // Rollback on error
      logger.error('Optimistic update failed, rolling back', {
        error: err.message
      });
      
      setData(previousData);
      setIsOptimistic(false);
      setError(err);
      
      throw err;
    }
  }, [data, updateFn]);

  const reset = useCallback(() => {
    setData(initialData);
    setIsOptimistic(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isOptimistic,
    error,
    update,
    reset
  };
};

export const useOptimisticList = (initialList = []) => {
  const [list, setList] = useState(initialList);
  const [pendingOperations, setPendingOperations] = useState(new Set());

  const addItem = useCallback(async (item, saveFn) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId, _optimistic: true };

    setList(prev => [optimisticItem, ...prev]);
    setPendingOperations(prev => new Set(prev).add(tempId));

    try {
      const savedItem = await saveFn(item);
      
      setList(prev => prev.map(i => i.id === tempId ? savedItem : i));
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });

      return savedItem;
    } catch (err) {
      setList(prev => prev.filter(i => i.id !== tempId));
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (itemId, deleteFn) => {
    const item = list.find(i => i.id === itemId);
    
    setList(prev => prev.filter(i => i.id !== itemId));
    setPendingOperations(prev => new Set(prev).add(itemId));

    try {
      await deleteFn(itemId);
      
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err) {
      if (item) {
        setList(prev => [item, ...prev]);
      }
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      throw err;
    }
  }, [list]);

  const updateItem = useCallback(async (itemId, updates, updateFn) => {
    const previousItem = list.find(i => i.id === itemId);
    
    setList(prev => prev.map(i => 
      i.id === itemId ? { ...i, ...updates, _optimistic: true } : i
    ));
    setPendingOperations(prev => new Set(prev).add(itemId));

    try {
      const updatedItem = await updateFn(itemId, updates);
      
      setList(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });

      return updatedItem;
    } catch (err) {
      if (previousItem) {
        setList(prev => prev.map(i => i.id === itemId ? previousItem : i));
      }
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      throw err;
    }
  }, [list]);

  return {
    list,
    addItem,
    removeItem,
    updateItem,
    hasPendingOperations: pendingOperations.size > 0,
    pendingOperations
  };
};
