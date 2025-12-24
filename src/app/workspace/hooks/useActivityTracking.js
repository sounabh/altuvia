import { useState, useEffect, useRef } from 'react';

export const useActivityTracking = () => {
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);
  const activityTimeoutRef = useRef(null);

  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      setLastUserActivity(now);
      setIsUserActive(true);

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 2 * 60 * 1000); // 2 minutes
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    handleUserActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  return { lastUserActivity, isUserActive };
};