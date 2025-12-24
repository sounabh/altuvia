import { useCallback, useRef } from 'react';

export const useAutoSave = (currentEssay, onSave) => {
  const autoSaveTimerRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const autoSaveEssay = useCallback(async () => {
    if (!currentEssay || isSaving || !hasUnsavedChanges || isUpdatingRef.current) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const saved = await onSave();
      if (saved) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
      return saved;
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [currentEssay, isSaving, hasUnsavedChanges, onSave]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  }, []);

  return {
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    lastSaved,
    setLastSaved,
    autoSaveEssay,
    autoSaveTimerRef,
    isUpdatingRef,
    cleanup
  };
};