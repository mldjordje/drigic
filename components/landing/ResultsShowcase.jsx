"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./results.module.css";

/**
 * Poređenje pre/posle u istom okviru.
 *
 * Fotografije su kolaži (obe faze u jednoj slici 1080x1080), pa se leva i
 * desna polovina izdvajaju CSS-om i slažu jedna preko druge. Poređenje se
 * dešava na istom mestu na ekranu — oko ne mora da skače između dve slike.
 *
 * Vrednost `wipe` je u procentima: 100 = vidi se samo "pre", 0 = samo "posle".
 */

const AUTO_REVEAL_DELAY = 260;

function ComparisonFrame({ item, index }) {
  const frameRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const revealedRef = useRef(false);
  const [wipe, setWipe] = useState(100);
  const [dragging, setDragging] = useState(false);

  // Prvo otkrivanje pri ulasku u vidno polje. Dešava se jednom po slučaju —
  // posle toga kontrolu ima korisnik.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || revealedRef.current) continue;
          revealedRef.current = true;
          window.setTimeout(() => setWipe(0), AUTO_REVEAL_DELAY + index * 140);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [index]);

  const wipeFromPointer = useCallback((clientX) => {
    const node = frameRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setWipe(Math.min(100, Math.max(0, Math.round(ratio * 100))));
  }, []);

  function handlePointerDown(event) {
    revealedRef.current = true;
    draggingRef.current = true;
    movedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    wipeFromPointer(event.clientX);
  }

  function handlePointerMove(event) {
    if (!draggingRef.current) return;
    movedRef.current = true;
    wipeFromPointer(event.clientX);
  }

  function handlePointerUp(event) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    // Kratak dodir bez prevlačenja = prebacivanje pre/posle.
    if (!movedRef.current) {
      setWipe((current) => (current > 50 ? 0 : 100));
    }
  }

  function handleKeyDown(event) {
    const step = event.shiftKey ? 20 : 8;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      revealedRef.current = true;
      setWipe((c) => Math.max(0, c - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      revealedRef.current = true;
      setWipe((c) => Math.min(100, c + step));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      revealedRef.current = true;
      setWipe((c) => (c > 50 ? 0 : 100));
    }
  }

  return (
    <figure className={styles.case}>
      <div
        ref={frameRef}
        className={`${styles.frame} ${dragging ? styles.dragging : ""}`}
        style={{ "--wipe": `${wipe}%` }}
        role="slider"
        tabIndex={0}
        aria-label={`${item.treatmentType} — poređenje pre i posle`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={100 - wipe}
        aria-valuetext={wipe > 50 ? "Prikazano stanje pre tretmana" : "Prikazano stanje posle tretmana"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={`${styles.layer} ${styles.before}`}>
          <img
            src={item.collageImageUrl}
            alt={item.imageAlt || `${item.treatmentType} — stanje pre tretmana`}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            width={1080}
            height={1080}
            draggable="false"
          />
        </div>
        <div className={`${styles.layer} ${styles.after}`}>
          <img
            src={item.collageImageUrl}
            alt=""
            aria-hidden="true"
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            width={1080}
            height={1080}
            draggable="false"
          />
        </div>
        <span className={`${styles.tag} ${styles.tagBefore}`}>Pre</span>
        <span className={`${styles.tag} ${styles.tagAfter}`}>Posle</span>
        <span className={styles.handle} aria-hidden="true" />
      </div>
      <figcaption className={styles.caseMeta}>
        <span className={styles.caseTitle}>{item.treatmentType}</span>
        {item.summary ? <span className={styles.caseText}>{item.summary}</span> : null}
      </figcaption>
    </figure>
  );
}

export default function ResultsShowcase({ cases = [], disclaimer }) {
  if (!cases.length) return null;

  return (
    <div>
      <div className={styles.rail}>
        {cases.map((item, index) => (
          <ComparisonFrame key={item.id} item={item} index={index} />
        ))}
      </div>
      <p className={styles.hint}>
        <span className={styles.hintDot} aria-hidden="true" />
        Prevucite preko fotografije da uporedite. Dodir prebacuje pre / posle.
      </p>
      {disclaimer ? <p className={styles.disclaimer}>{disclaimer}</p> : null}
    </div>
  );
}
