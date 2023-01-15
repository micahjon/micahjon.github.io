---
title: A Configurable Hamburger Icon to Close (X) Icon Transition
date: 2023-01-11 11:08:00 -08:00
description: Change line thickness & spacing w/out skew
tags: post
---

Over the past few weeks I've been gradually swapping out Emotion CSS-in-JS with CSS modules. While I do love Emotion's developer experience, I just ran into too many issues in production with jank during animations. And given that CSS modules can be SASS or SCSS, the transition was pretty easy. 

In this process, I stumbled across a nifty hamburger icon to close (X) icon animation (that I spent waaay to much time perfecting last year) written in Emotion. While I will be converting it to CSS modules so I can finally lay this dependency to rest, I figured it'd be worth sharing.

<video src="/assets/videos/hamburger-animation.mp4" controls autoplay mute style="width: 100%; heigth: auto" ></video>

_Note: the blue outline is just a focus style, not part of the icon_

There are MANY examples of this type of animation, but I have yet to find one that allows you to customize line thickness and spacing without skewing the animation. This implementation also ensures the resulting icon animation fits perfectly in a square.

## Emotion CSS in JS

```ts
// Emotion styles
import styled from '@emotion/styled';
import { css } from '@emotion/react';

const boxSize = 18;
const xSide = boxSize / Math.SQRT2;
const spaceBetween = Math.round(boxSize / 5);
const lineHeight = 3;
const spaceAbove = (boxSize - 3 * lineHeight - 2 * spaceBetween) / 2;
const durationAndEasing = '.25s ease';

const HamburgerLineStyles = css`
  display: block;
  position: absolute;
  height: ${lineHeight}px;
  width: 100%;
  background: currentColor;
  border-radius: ${lineHeight}px;
  opacity: 1;
  left: 0;
  transform-origin: left center;
`;

export const HamburgerLine1 = styled('span')`
  ${HamburgerLineStyles}
  top: ${spaceAbove}px;
  transform: rotate(0deg);
  transition: transform ${durationAndEasing};
`;

export const HamburgerLine2 = styled('span')`
  ${HamburgerLineStyles}
  top: ${spaceAbove + lineHeight + spaceBetween}px;
  transition: width ${durationAndEasing}, opacity ${durationAndEasing};
`;

export const HamburgerLine3 = styled('span')`
  ${HamburgerLineStyles}
  top: ${spaceAbove + (lineHeight + spaceBetween) * 2}px;
  transform: rotate(0deg);
  transition: transform ${durationAndEasing};
`;

type ToggleProps = {
  isOpen: boolean;
};

export const Hamburger = styled('span')<ToggleProps>`
  position: relative;
  width: ${boxSize}px;
  height: ${boxSize}px;
  flex-shrink: 0;
  ${HamburgerLine1} {
    ${(props) =>
      props.isOpen
        ? `transform: 
          translateY(${-1 * (xSide / 2 - lineHeight - spaceBetween)}px) 
          translateX(${(boxSize - xSide) / 2}px) 
          rotate(45deg);`
        : ''};
  }
  ${HamburgerLine2} {
    ${(props) => (props.isOpen ? `width: 0%; opacity: 0;` : '')};
  }
  ${HamburgerLine3} {
    ${(props) =>
      props.isOpen
        ? `transform: 
          translateY(${xSide / 2 - lineHeight - spaceBetween}px) 
          translateX(${(boxSize - xSide) / 2}px) 
          rotate(-45deg);`
        : ''};
  }
`;
```

```tsx
// Usage in React component
<button>
  <Hamburger isOpen={isOpen}>
    <HamburgerLine1 />
    <HamburgerLine2 />
    <HamburgerLine3 />
  </Hamburger>
</button>
```

---

Here's the version of the code migrated to CSS modules (compiled from SCSS). This should work independent of React or any other framework.

## Pure SCSS

```scss
// style.scss

.hamburger {
  // Variables
  --box-size: 18px;
  --x-side: calc(var(--box-size) / 1.4142135623730951);
  --space-between: 4px;
  --line-thickness: 3px;
  --space-above: calc(
    (var(--box-size) - 3 * var(--line-thickness) - 2 * var(--space-between)) / 2
  );

  position: relative;
  width: var(--box-size);
  height: var(--box-size);
  flex-shrink: 0;

  // All 3 lines
  > * {
    display: block;
    position: absolute;
    height: var(--line-thickness);
    width: 100%;
    background: currentColor;
    border-radius: var(--line-thickness);
    opacity: 1;
    left: 0;
    transform-origin: left center;
    transition-duration: 0.25s;
    transition-timing-function: ease;
  }

  // Top line
  > :nth-child(1) {
    top: var(--space-above);
    transform: rotate(0deg);
    transition-property: transform;
  }
  &.hamburgerToX {
    > :nth-child(1) {
      transform: translateY(
          calc(-1 * (var(--x-side) / 2 - var(--line-thickness) - var(--space-between)))
        )
        translateX(calc((var(--box-size) - var(--x-side)) / 2)) rotate(45deg);
    }
  }

  // Middle line
  > :nth-child(2) {
    top: calc(var(--space-above) + var(--line-thickness) + var(--space-between));
    transition-property: width, opacity;
  }
  &.hamburgerToX {
    > :nth-child(2) {
      width: 0%;
      opacity: 0;
    }
  }

  // Bottom line
  > :nth-child(3) {
    top: calc(var(--space-above) + 2 * (var(--line-thickness) + var(--space-between)));
    transform: rotate(0deg);
    transition-property: transform;
  }
  &.hamburgerToX {
    > :nth-child(3) {
      transform: translateY(
          calc(var(--x-side) / 2 - var(--line-thickness) - var(--space-between))
        )
        translateX(calc((var(--box-size) - var(--x-side)) / 2)) rotate(-45deg);
    }
  }
}
```

```tsx
// React or any other framework...
<span class={classNames(style.hamburger, isOpen ? style.hamburgerToX : '')}>
  <span></span>
  <span></span>
  <span></span>
</span>
```

Enjoy!