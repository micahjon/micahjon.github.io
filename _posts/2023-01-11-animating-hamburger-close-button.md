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
