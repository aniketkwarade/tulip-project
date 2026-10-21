import './desktop-experience.css';
import { initializeDesktopSearch } from './desktop-search.js';
import { initializeDesktopOnboarding } from './desktop-onboarding.js';

export function initializeDesktopExperience(api) {
  const search = initializeDesktopSearch(api);
  const onboarding = initializeDesktopOnboarding({ ...api, openSearch: search.open });
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('glassReview') === '1') {
    import('./desktop-glass-review.js').then(module => module.openGlassReview()).catch(error => console.warn('Glass study unavailable', error));
  }
  return { search, onboarding };
}
