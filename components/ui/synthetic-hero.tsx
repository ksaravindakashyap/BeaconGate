"use client";

/**
 * SyntheticHero — content-only hero with GSAP entrance animation.
 * Background shader is provided by SiteBackdrop (global backdrop in layout).
 */
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

if (typeof gsap.registerPlugin === "function") {
  gsap.registerPlugin(useGSAP);
}

export interface HeroProps {
  title: string;
  description: string;
  badgeText?: string;
  badgeLabel?: string;
  ctaButtons?: Array<{ text: string; href?: string; primary?: boolean }>;
  microDetails?: Array<string>;
}

const SyntheticHero = ({
  title = "An experiment in light, motion, and the quiet chaos between.",
  description = "Experience a new dimension of interaction — fluid, tactile, and alive.",
  badgeText = "React Three Fiber",
  badgeLabel = "Experience",
  ctaButtons = [
    { text: "Explore the Canvas", href: "#explore", primary: true },
    { text: "Learn More", href: "#learn-more" },
  ],
  microDetails = [
    "Immersive shader landscapes",
    "Hand-tuned motion easing",
    "Responsive, tactile feedback",
  ],
}: HeroProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const badgeWrapperRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const microRef = useRef<HTMLUListElement | null>(null);

  useGSAP(
    () => {
      if (!headingRef.current) return;

      document.fonts.ready.then(() => {
        gsap.set(headingRef.current, {
          filter: "blur(16px)",
          yPercent: 24,
          autoAlpha: 0,
          scale: 1.04,
          transformOrigin: "50% 100%",
        });

        if (badgeWrapperRef.current) {
          gsap.set(badgeWrapperRef.current, { autoAlpha: 0, y: -8 });
        }
        if (paragraphRef.current) {
          gsap.set(paragraphRef.current, { autoAlpha: 0, y: 8 });
        }
        if (ctaRef.current) {
          gsap.set(ctaRef.current, { autoAlpha: 0, y: 8 });
        }

        const microItems = microRef.current
          ? Array.from(microRef.current.querySelectorAll("li"))
          : [];
        if (microItems.length > 0) {
          gsap.set(microItems, { autoAlpha: 0, y: 6 });
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (badgeWrapperRef.current) {
          tl.to(
            badgeWrapperRef.current,
            { autoAlpha: 1, y: 0, duration: 0.5 },
            0,
          );
        }

        tl.to(
          headingRef.current,
          {
            filter: "blur(0px)",
            yPercent: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
          },
          0.1,
        );

        if (paragraphRef.current) {
          tl.to(
            paragraphRef.current,
            { autoAlpha: 1, y: 0, duration: 0.5 },
            "-=0.55",
          );
        }

        if (ctaRef.current) {
          tl.to(
            ctaRef.current,
            { autoAlpha: 1, y: 0, duration: 0.5 },
            "-=0.35",
          );
        }

        if (microItems.length > 0) {
          tl.to(
            microItems,
            { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 },
            "-=0.25",
          );
        }
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div ref={badgeWrapperRef}>
          <Badge className="mb-6 flex items-center gap-2 border border-border-soft bg-surface/40 px-4 py-1.5 font-medium uppercase tracking-wider text-accent backdrop-blur-md hover:bg-surface-elevated/50">
            <span className="text-[10px] font-light tracking-[0.18em] text-text-muted">
              {badgeLabel}
            </span>
            <span className="h-1 w-1 rounded-full bg-accent/60" />
            <span className="text-xs font-light tracking-tight text-accent">
              {badgeText}
            </span>
          </Badge>
        </div>

        <h1
          ref={headingRef}
          className="mb-4 max-w-4xl text-5xl font-light tracking-tight text-text-primary md:text-7xl"
        >
          {title}
        </h1>

        <p
          ref={paragraphRef}
          className="mx-auto mb-10 max-w-2xl text-lg font-light text-text-muted"
        >
          {description}
        </p>

        <div
          ref={ctaRef}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {ctaButtons.map((button, index) => {
            const isPrimary = button.primary ?? index === 0;
            const classes = isPrimary
              ? "px-8 py-3 rounded-xl text-base font-medium backdrop-blur-lg bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg transition-all cursor-pointer"
              : "px-8 py-3 rounded-xl text-base font-medium border border-border-soft text-text-primary hover:bg-surface/50 backdrop-blur-lg transition-all cursor-pointer";

            if (button.href) {
              const isInternal = button.href.startsWith("/");
              return (
                <Button
                  key={index}
                  variant={isPrimary ? undefined : "outline"}
                  className={classes}
                  asChild
                >
                  {isInternal ? (
                    <Link href={button.href}>{button.text}</Link>
                  ) : (
                    <a href={button.href} target="_blank" rel="noopener noreferrer">
                      {button.text}
                    </a>
                  )}
                </Button>
              );
            }

            return (
              <Button
                key={index}
                variant={isPrimary ? undefined : "outline"}
                className={classes}
              >
                {button.text}
              </Button>
            );
          })}
        </div>

        {microDetails.length > 0 && (
          <ul
            ref={microRef}
            className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-light tracking-tight text-text-muted"
          >
            {microDetails.map((detail, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-accent/60" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default SyntheticHero;
