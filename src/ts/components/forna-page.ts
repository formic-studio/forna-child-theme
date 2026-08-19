import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { prefersReducedMotion } from '../core/motion-preference';

type Cleanup = () => void;
type ScheduleFrame = (callback: () => void) => void;
type SliderDirection = 'next' | 'previous';

gsap.registerPlugin(ScrollTrigger);

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, value);
}

function createAttributeTracker(): {
  remember: (element: HTMLElement, name: string) => void;
  restore: Cleanup;
} {
  const snapshots = new Map<HTMLElement, Map<string, string | null>>();

  const remember = (element: HTMLElement, name: string): void => {
    let attributes = snapshots.get(element);

    if (!attributes) {
      attributes = new Map<string, string | null>();
      snapshots.set(element, attributes);
    }

    if (!attributes.has(name)) {
      attributes.set(name, element.getAttribute(name));
    }
  };

  const restore = (): void => {
    for (const [element, attributes] of snapshots) {
      for (const [name, value] of attributes) {
        restoreAttribute(element, name, value);
      }
    }

    snapshots.clear();
  };

  return { remember, restore };
}

function initializeHero(root: HTMLElement, media: gsap.MatchMedia): void {
  const heroImage = root.querySelector<HTMLElement>('.hero-img');
  const logo = root.querySelector<HTMLElement>('.logo-svg');
  const navigation =
    root.querySelector<HTMLElement>('.nav') ?? document.querySelector<HTMLElement>('.nav');
  const heading = root.querySelector<HTMLElement>(
    '[data-animation="text-heading"], [data-animation="taxt-heading"]',
  );

  if (!heroImage || !logo || !navigation || !heading) {
    return;
  }

  const originalHeroStyle = heroImage.getAttribute('style');
  const computedHeroStyle = getComputedStyle(heroImage);
  const finalHeight = computedHeroStyle.height;
  const finalBorderRadius = computedHeroStyle.borderRadius;

  media.add(
    {
      isDesktop: '(min-width: 479px)',
      isMobile: '(max-width: 478px)',
    },
    (context) => {
      const isMobile = context.conditions?.isMobile === true;
      const timeline = gsap.timeline();

      // Bricks centers the logo with translateX(-50%). Keep that percentage in
      // GSAP's transform so it remains responsive after the entrance animation.
      gsap.set(logo, { opacity: 0, xPercent: -50, y: 100 });
      gsap.set(navigation, { opacity: 0, top: -100 });
      gsap.set(heading, { filter: 'blur(20px)', opacity: 0 });
      gsap.set(heroImage, {
        borderRadius: 0,
        height: isMobile ? '140dvh' : '100vh',
        left: '50%',
        margin: 0,
        objectFit: 'cover',
        padding: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        zIndex: 0,
      });

      timeline.to({}, { duration: 0.4 });

      if (isMobile) {
        timeline
          .to(heroImage, {
            borderRadius: 16,
            duration: 1.2,
            ease: 'power2.inOut',
            height: 420,
            width: '80vw',
          })
          .add(() => {
            restoreAttribute(heroImage, 'style', originalHeroStyle);
          })
          .to(logo, { duration: 0.7, ease: 'power1.out', opacity: 1, xPercent: -50, y: 0 }, '+=0.1')
          .to(navigation, { duration: 0.7, ease: 'power1.out', opacity: 1, top: 0 }, '-=0.4')
          .to(
            heading,
            { duration: 0.7, ease: 'power3.out', filter: 'blur(0px)', opacity: 1 },
            '+=0.08',
          );
      } else {
        timeline
          .to(heroImage, {
            borderRadius: finalBorderRadius,
            duration: 1,
            ease: 'power2.inOut',
            height: '96vh',
            width: '96vw',
          })
          .to({}, { duration: 0.1 })
          .to(heroImage, {
            borderRadius: 16,
            duration: 1.8,
            ease: 'power3.inOut',
            height: finalHeight === 'auto' ? 'auto' : finalHeight,
            width: '60vw',
          })
          .add(() => {
            restoreAttribute(heroImage, 'style', originalHeroStyle);
          })
          .to(logo, { duration: 1.4, ease: 'power1.out', opacity: 1, xPercent: -50, y: 0 }, '-=0.4')
          .to(navigation, { duration: 1.4, ease: 'power1.out', opacity: 1, top: 0 }, '-=1.2')
          .to(
            heading,
            { duration: 1.2, ease: 'power4.out', filter: 'blur(0px)', opacity: 1 },
            '-=0.2',
          );
      }

      return (): void => {
        timeline.kill();
        restoreAttribute(heroImage, 'style', originalHeroStyle);
      };
    },
  );
}

function initializeBackgroundColors(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-color]').forEach((section) => {
    const updateColor = (): void => {
      const color = section.dataset.color;

      if (!color) {
        return;
      }

      gsap.to([document.documentElement, document.body], {
        backgroundColor: color,
        duration: 0.5,
        overwrite: 'auto',
      });
    };

    ScrollTrigger.create({
      end: 'bottom 50%',
      onEnter: updateColor,
      onEnterBack: updateColor,
      start: 'top 50%',
      trigger: section,
    });
  });
}

function initializeProductControls(
  root: HTMLElement,
  refreshScroll: () => void,
  scheduleFrame: ScheduleFrame,
): Cleanup {
  const tracker = createAttributeTracker();
  const transitionListeners = new Map<HTMLElement, EventListener>();

  const refreshAfterTransition = (panel: HTMLElement): void => {
    const previousListener = transitionListeners.get(panel);

    if (previousListener) {
      panel.removeEventListener('transitionend', previousListener);
    }

    const listener: EventListener = () => {
      transitionListeners.delete(panel);
      refreshScroll();
    };

    transitionListeners.set(panel, listener);
    panel.addEventListener('transitionend', listener, { once: true });
    refreshScroll();
  };

  const updateSize = (activeButton: HTMLElement): void => {
    const index = activeButton.dataset.index;

    root.querySelectorAll<HTMLElement>('.button-size').forEach((button) => {
      tracker.remember(button, 'class');
      tracker.remember(button, 'aria-pressed');
      button.classList.toggle('button-active', button === activeButton);
      button.setAttribute('aria-pressed', String(button === activeButton));
    });

    root.querySelectorAll<HTMLElement>('.text-action[data-index="l"]').forEach((action) => {
      tracker.remember(action, 'style');
      action.style.display = index === 'l' ? 'none' : '';
    });

    root.querySelectorAll<HTMLElement>('.animation-size').forEach((content) => {
      const isActive = content.dataset.index === index;
      tracker.remember(content, 'class');
      tracker.remember(content, 'aria-hidden');
      content.classList.toggle('animation-active', isActive);
      content.setAttribute('aria-hidden', String(!isActive));

      const sizeBlock = content.parentElement;

      if (!isActive || !sizeBlock?.classList.contains('size-block')) {
        return;
      }

      scheduleFrame(() => {
        tracker.remember(sizeBlock, 'style');
        sizeBlock.style.height = `${String(content.offsetHeight)}px`;
        refreshScroll();
      });
    });
  };

  const clickListener = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const openButton = target.closest<HTMLElement>('.button-open');

    if (openButton && root.contains(openButton)) {
      const panel = openButton.nextElementSibling;

      if (panel instanceof HTMLElement && panel.classList.contains('collapsible')) {
        tracker.remember(panel, 'class');
        tracker.remember(panel, 'aria-hidden');
        tracker.remember(panel, 'inert');
        tracker.remember(openButton, 'style');
        tracker.remember(openButton, 'aria-expanded');
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        panel.removeAttribute('inert');
        openButton.style.opacity = '0';
        openButton.setAttribute('aria-expanded', 'true');
        refreshAfterTransition(panel);
      }
    }

    const closeButton = target.closest<HTMLElement>('.button-close');

    if (closeButton && root.contains(closeButton)) {
      const panel = closeButton.closest<HTMLElement>('.collapsible');

      if (panel) {
        tracker.remember(panel, 'class');
        tracker.remember(panel, 'aria-hidden');
        tracker.remember(panel, 'inert');
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('inert', '');
        refreshAfterTransition(panel);

        const opener = panel.previousElementSibling;

        if (opener instanceof HTMLElement && opener.classList.contains('button-open')) {
          tracker.remember(opener, 'style');
          tracker.remember(opener, 'aria-expanded');
          opener.style.opacity = '1';
          opener.setAttribute('aria-expanded', 'false');
        }
      }
    }

    const sizeButton = target.closest<HTMLElement>('.button-size');

    if (sizeButton && root.contains(sizeButton)) {
      updateSize(sizeButton);
    }
  };

  const resizeListener = (): void => {
    const activeContent = root.querySelector<HTMLElement>('.animation-size.animation-active');
    const sizeBlock = activeContent?.parentElement;

    if (!activeContent || !sizeBlock?.classList.contains('size-block')) {
      return;
    }

    scheduleFrame(() => {
      tracker.remember(sizeBlock, 'style');
      sizeBlock.style.height = `${String(activeContent.offsetHeight)}px`;
      refreshScroll();
    });
  };

  root.addEventListener('click', clickListener);
  window.addEventListener('resize', resizeListener, { passive: true });

  root.querySelectorAll<HTMLElement>('.collapsible').forEach((panel) => {
    const isOpen = panel.classList.contains('is-open');
    tracker.remember(panel, 'aria-hidden');
    tracker.remember(panel, 'inert');
    panel.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      panel.removeAttribute('inert');
    } else {
      panel.setAttribute('inert', '');
    }

    const opener = panel.previousElementSibling;

    if (opener instanceof HTMLElement && opener.classList.contains('button-open')) {
      tracker.remember(opener, 'aria-expanded');
      opener.setAttribute('aria-expanded', String(isOpen));
    }
  });

  const activeButton = root.querySelector<HTMLElement>('.button-size.button-active');

  if (activeButton) {
    updateSize(activeButton);
  }

  return (): void => {
    root.removeEventListener('click', clickListener);
    window.removeEventListener('resize', resizeListener);

    for (const [panel, listener] of transitionListeners) {
      panel.removeEventListener('transitionend', listener);
    }

    transitionListeners.clear();
    tracker.restore();
  };
}

function initializeAbout(root: HTMLElement, media: gsap.MatchMedia): void {
  media.add('(min-width: 768px)', () => {
    const aboutSection = root.querySelector<HTMLElement>('.section-about');
    const logoBlock = root.querySelector<HTMLElement>('.block-logo');
    const blocks = [...root.querySelectorAll<HTMLElement>('.about-block')];

    if (aboutSection && logoBlock) {
      gsap.set(logoBlock, { opacity: 0 });
      ScrollTrigger.create({
        onEnter: () => gsap.to(logoBlock, { duration: 0.6, opacity: 1 }),
        onLeaveBack: () => gsap.to(logoBlock, { duration: 0.6, opacity: 0 }),
        start: () => `top+=${String(window.innerHeight * -0.2)}px top`,
        trigger: aboutSection,
      });
    }

    gsap.set(blocks, { willChange: 'transform, opacity' });

    blocks.forEach((block, index) => {
      const info = block.querySelector<HTMLElement>('.info-text-block');
      const isFirst = index === 0;
      const nextBlock = blocks[index + 1];

      gsap.set(block, { opacity: isFirst ? 1 : 0, yPercent: 0 });

      if (nextBlock) {
        gsap
          .timeline({
            scrollTrigger: {
              end: 'top top',
              invalidateOnRefresh: true,
              scrub: true,
              start: 'top bottom',
              trigger: nextBlock,
            },
          })
          .fromTo(
            block,
            { opacity: 1, yPercent: 0 },
            {
              duration: 1,
              ease: 'none',
              force3D: true,
              immediateRender: false,
              opacity: 0,
              yPercent: -100,
            },
            0,
          )
          .fromTo(
            nextBlock,
            { opacity: 0 },
            { duration: 1, ease: 'none', immediateRender: false, opacity: 1 },
            0,
          );
      }

      if (info) {
        ScrollTrigger.create({
          end: '+=100%',
          onToggle: (self) => {
            gsap.to(info, { duration: 0.6, opacity: self.isActive ? 1 : 0 });
          },
          start: 'top-=5% top',
          trigger: block,
        });
      }
    });
  });
}

function initializeInfoBlocks(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.info-block').forEach((section) => {
    const divider = section.querySelector<HTMLElement>('[data-animation="divider"] .line');
    const text = section.querySelector<HTMLElement>('[data-animation="text"]');
    const image = section.querySelector<HTMLElement>('.info-img');
    const listItems = [...section.querySelectorAll<HTMLElement>('[data-animation="list"] li')];

    if (!divider && !text && !image && listItems.length === 0) {
      return;
    }

    if (divider) {
      gsap.set(divider, {
        scaleX: 0,
        transformOrigin: 'left center',
        willChange: 'transform',
      });
    }

    if (text) {
      gsap.set(text, { autoAlpha: 0, willChange: 'transform, opacity', y: 12 });
    }

    if (image) {
      gsap.set(image, {
        autoAlpha: 0,
        force3D: true,
        scale: 1.02,
        willChange: 'transform, opacity',
        y: 24,
      });
    }

    if (listItems.length > 0) {
      gsap.set(listItems, {
        '--border-anim-width': '0%',
        autoAlpha: 0,
        willChange: 'transform, opacity',
        y: 10,
      });
    }

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        once: true,
        start: 'top 85%',
        toggleActions: 'play none none none',
        trigger: section,
      },
    });

    if (image) {
      timeline.to(
        image,
        { autoAlpha: 1, clearProps: 'willChange', duration: 0.9, scale: 1, y: 0 },
        0,
      );
    }

    if (divider) {
      timeline.to(divider, { clearProps: 'willChange', duration: 1.1, scaleX: 1 }, 0.1);
    }

    if (text) {
      timeline.to(text, { autoAlpha: 1, clearProps: 'willChange', duration: 0.55, y: 0 }, 0.25);
    }

    if (listItems.length > 0) {
      timeline.to(
        listItems,
        {
          '--border-anim-width': '100%',
          autoAlpha: 1,
          clearProps: 'willChange',
          duration: 0.4,
          stagger: 0.12,
          y: 0,
        },
        0.45,
      );
    }
  });
}

function initializeTextReveals(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-animation="text-sentence"]').forEach((element) => {
    gsap.fromTo(
      element,
      { filter: 'blur(10px)', opacity: 0, y: '1em' },
      {
        duration: 0.8,
        ease: 'power2.out',
        filter: 'blur(0px)',
        opacity: 1,
        scrollTrigger: {
          start: 'top 85%',
          toggleActions: 'play reverse play reverse',
          trigger: element,
        },
        y: 0,
      },
    );
  });
}

function initializeMobileSlider(root: HTMLElement, reducedMotion: boolean): Cleanup {
  const slider = root.querySelector<HTMLElement>('[data-slider="mobile"], #slider_mobile');
  const nextButton = root.querySelector<HTMLElement>('[data-arrow="next"]');
  const previousButton = root.querySelector<HTMLElement>(
    '[data-arrow="previous"], [data-arrow="preview"]',
  );

  if (!slider || !nextButton || !previousButton) {
    return (): void => undefined;
  }

  const tracker = createAttributeTracker();
  let scrollFrame: number | null = null;

  tracker.remember(slider, 'tabindex');

  if (!slider.matches('a, button, input, select, textarea, [tabindex]')) {
    slider.tabIndex = 0;
  }

  const setArrowState = (button: HTMLElement, disabled: boolean): void => {
    tracker.remember(button, 'style');
    tracker.remember(button, 'aria-disabled');
    button.style.opacity = disabled ? '0.4' : '1';
    button.style.pointerEvents = disabled ? 'none' : 'auto';
    button.setAttribute('aria-disabled', String(disabled));

    if (button instanceof HTMLButtonElement) {
      tracker.remember(button, 'disabled');
      button.disabled = disabled;
    }
  };

  const updateArrows = (): void => {
    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
    setArrowState(previousButton, slider.scrollLeft <= 5);
    setArrowState(nextButton, slider.scrollLeft >= maxScroll - 5);
  };

  const scrollSlider = (direction: SliderDirection): void => {
    const slide = slider.querySelector<HTMLElement>('.about-block');

    if (!slide) {
      return;
    }

    slider.scrollBy({
      behavior: reducedMotion ? 'auto' : 'smooth',
      left: direction === 'next' ? slide.offsetWidth : -slide.offsetWidth,
    });
  };

  const nextListener = (event: MouseEvent): void => {
    event.preventDefault();
    scrollSlider('next');
  };
  const previousListener = (event: MouseEvent): void => {
    event.preventDefault();
    scrollSlider('previous');
  };
  const scrollListener = (): void => {
    if (scrollFrame !== null) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateArrows();
    });
  };
  const keydownListener = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();
    scrollSlider(event.key === 'ArrowRight' ? 'next' : 'previous');
  };

  nextButton.addEventListener('click', nextListener);
  previousButton.addEventListener('click', previousListener);
  slider.addEventListener('keydown', keydownListener);
  slider.addEventListener('scroll', scrollListener, { passive: true });

  const resizeObserver = new ResizeObserver(updateArrows);
  resizeObserver.observe(slider);
  updateArrows();

  return (): void => {
    nextButton.removeEventListener('click', nextListener);
    previousButton.removeEventListener('click', previousListener);
    slider.removeEventListener('keydown', keydownListener);
    slider.removeEventListener('scroll', scrollListener);
    resizeObserver.disconnect();

    if (scrollFrame !== null) {
      window.cancelAnimationFrame(scrollFrame);
    }

    tracker.restore();
  };
}

/**
 * Initialize all custom interactions used by the current Forna landing page.
 */
export default function initializeFornaPage(root: HTMLElement): Cleanup {
  const pageRoot = root.closest<HTMLElement>('main') ?? root;
  const reducedMotion = prefersReducedMotion();
  const frameIds = new Set<number>();
  const cleanups: Cleanup[] = [];
  let active = true;

  const scheduleFrame: ScheduleFrame = (callback) => {
    const frameId = window.requestAnimationFrame(() => {
      frameIds.delete(frameId);

      if (active) {
        callback();
      }
    });

    frameIds.add(frameId);
  };

  const refreshScroll = (): void => {
    scheduleFrame(() => {
      ScrollTrigger.refresh(true);
    });
  };

  cleanups.push(initializeProductControls(pageRoot, refreshScroll, scheduleFrame));
  cleanups.push(initializeMobileSlider(pageRoot, reducedMotion));

  let media: gsap.MatchMedia | null = null;
  let animationContext: gsap.Context | null = null;

  if (!reducedMotion) {
    const animationMedia = gsap.matchMedia(pageRoot);
    media = animationMedia;
    animationContext = gsap.context(() => {
      initializeHero(pageRoot, animationMedia);
      initializeBackgroundColors(pageRoot);
      initializeAbout(pageRoot, animationMedia);
      initializeInfoBlocks(pageRoot);
      initializeTextReveals(pageRoot);
    }, pageRoot);
  }

  const loadListener = (): void => {
    refreshScroll();
  };

  if (document.readyState === 'complete') {
    refreshScroll();
  } else {
    window.addEventListener('load', loadListener, { once: true });
  }

  void document.fonts.ready.then(() => {
    if (active) {
      refreshScroll();
    }
  });

  return (): void => {
    active = false;
    window.removeEventListener('load', loadListener);
    media?.revert();
    animationContext?.revert();

    for (const cleanup of cleanups.reverse()) {
      cleanup();
    }

    for (const frameId of frameIds) {
      window.cancelAnimationFrame(frameId);
    }

    frameIds.clear();
  };
}
