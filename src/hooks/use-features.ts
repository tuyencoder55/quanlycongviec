import { useState } from 'react';
import {
  type FeatureConfig,
  DEFAULT_FEATURES,
  getInitialFeatures,
  saveFeatures,
} from '../config/features';

export function useFeatures() {
  const [features, setFeatures] = useState<FeatureConfig>(getInitialFeatures);

  const toggleFeature = (key: keyof FeatureConfig) => {
    setFeatures((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveFeatures(next);
      return next;
    });
  };

  const resetFeatures = () => {
    setFeatures(DEFAULT_FEATURES);
    saveFeatures(DEFAULT_FEATURES);
  };

  return {
    features,
    toggleFeature,
    resetFeatures,
  };
}
