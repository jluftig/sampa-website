import { useEffect } from 'react';
import { clientSiteOrigin } from '../lib/siteUrl';

export function usePageMeta({ title, path, description, robots }) {
  useEffect(() => {
    if (!title && !path && !robots) return undefined;
    const previousTitle = document.title;
    if (title) document.title = title;

    let descriptionEl = document.querySelector('meta[name="description"]');
    const createdDescription = !descriptionEl;
    let previousDescription = null;
    if (description) {
      if (!descriptionEl) {
        descriptionEl = document.createElement('meta');
        descriptionEl.setAttribute('name', 'description');
        document.head.appendChild(descriptionEl);
      }
      previousDescription = descriptionEl.getAttribute('content');
      descriptionEl.setAttribute('content', description);
    }

    let robotsEl = document.querySelector('meta[name="robots"]');
    const createdRobots = !robotsEl;
    let previousRobots = null;
    if (robots) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta');
        robotsEl.setAttribute('name', 'robots');
        document.head.appendChild(robotsEl);
      }
      previousRobots = robotsEl.getAttribute('content');
      robotsEl.setAttribute('content', robots);
    }

    let link = document.querySelector('link[rel="canonical"]');
    const createdLink = !link;
    let previousHref = null;
    if (path) {
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      previousHref = link.getAttribute('href');
      const origin = clientSiteOrigin();
      link.setAttribute('href', `${origin}${path}`);
    }

    return () => {
      document.title = previousTitle;
      if (description) {
        if (createdDescription) descriptionEl.remove();
        else if (previousDescription == null) descriptionEl.removeAttribute('content');
        else descriptionEl.setAttribute('content', previousDescription);
      }
      if (path) {
        if (createdLink) link.remove();
        else if (previousHref == null) link.removeAttribute('href');
        else link.setAttribute('href', previousHref);
      }
      if (robots) {
        if (createdRobots) robotsEl.remove();
        else if (previousRobots == null) robotsEl.removeAttribute('content');
        else robotsEl.setAttribute('content', previousRobots);
      }
    };
  }, [title, path, description, robots]);
}
