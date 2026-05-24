/**
 * Zero-runtime replacement for decorative `framer-motion` usage (Phase 7).
 * Strips motion-only props and renders the underlying DOM element.
 * Prefer CSS transitions on real components for new work.
 */
import React, { forwardRef } from "react";

type MotionProps = Record<string, unknown>;

function stripMotionProps(props: MotionProps): MotionProps {
  const {
    initial: _i,
    animate: _a,
    exit: _e,
    transition: _t,
    variants: _v,
    whileHover: _wh,
    whileTap: _wt,
    whileInView: _wi,
    viewport: _vp,
    layout: _l,
    layoutId: _lid,
    layoutRoot: _lr,
    drag: _d,
    dragConstraints: _dc,
    dragElastic: _de,
    dragMomentum: _dm,
    onDragEnd: _ode,
    onAnimationStart: _oas,
    onAnimationComplete: _oac,
    custom: _c,
    ...rest
  } = props;
  return rest;
}

function motionTag(tag: keyof React.JSX.IntrinsicElements) {
  return forwardRef<HTMLElement, MotionProps & { children?: React.ReactNode }>(function MotionStub(props, ref) {
    const next = stripMotionProps({ ...props }) as MotionProps & { children?: React.ReactNode };
    return React.createElement(tag, { ...next, ref });
  });
}

export const motion = {
  div: motionTag("div"),
  span: motionTag("span"),
  /** Table-friendly stubs (marketing / projetos dashboards). */
  table: motionTag("table"),
  thead: motionTag("thead"),
  tbody: motionTag("tbody"),
  tr: motionTag("tr"),
  td: motionTag("td"),
  th: motionTag("th"),
  section: motionTag("section"),
  article: motionTag("article"),
  main: motionTag("main"),
  header: motionTag("header"),
  footer: motionTag("footer"),
  nav: motionTag("nav"),
  ul: motionTag("ul"),
  li: motionTag("li"),
  button: motionTag("button"),
  p: motionTag("p"),
  h1: motionTag("h1"),
  h2: motionTag("h2"),
  h3: motionTag("h3"),
  path: motionTag("path"),
  svg: motionTag("svg"),
  g: motionTag("g"),
  circle: motionTag("circle"),
} as const;

export function AnimatePresence({ children, ..._rest }: { children?: React.ReactNode } & Record<string, unknown>) {
  return <>{children}</>;
}

/** No-op controls — decorative sequences removed. */
export function useAnimationControls() {
  return {
    start: (_def?: unknown) => Promise.resolve(),
    set: () => {},
    stop: () => {},
  };
}

export function useMotionValue(init: number) {
  const ref = React.useRef(init);
  return {
    get: () => ref.current,
    set: (v: number) => {
      ref.current = v;
    },
    on: () => {},
  };
}

export function useTransform<T>(_v: unknown, _in: unknown, out: T | readonly T[]) {
  return Array.isArray(out) ? out[0] : out;
}

export function useSpring(v: { get: () => number }, _opts?: unknown) {
  return v;
}

export function useMotionValueEvent(
  v: { get: () => number },
  _event: string,
  fn: (latest: number) => void
) {
  React.useEffect(() => {
    fn(v.get());
  }, [v, fn]);
}
