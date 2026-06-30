import { useState, useCallback, useEffect, useRef } from 'react';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import TreeRule from './components/TreeRule';
import ProblemSection from './components/ProblemSection';
import ArchitectureSection from './components/ArchitectureSection';
import DefenseSection from './components/DefenseSection';
import FeaturesSection from './components/FeaturesSection';
import LiveAppSection from './components/LiveAppSection';
import FooterSection from './components/FooterSection';

/**
 * App — Single-page scrolling landing page.
 *
 * The landing page makes the AST-grounding pipeline and hallucination-defense
 * strategy visible and demonstrable for a recruiter/senior engineer.
 *
 * Existing app components (CodeEditor, ExplanationPanel, AnnotatedCode,
 * DiffView, HistorySidebar) are preserved untouched in /components/.
 */
export default function App() {
  const [activeSection, setActiveSection] = useState('');

  // Section refs for scroll-to and Intersection Observer
  const sectionRefs = {
    architecture: useRef(null),
    'defense-strategy': useRef(null),
    features: useRef(null),
    'the-problem': useRef(null),
    'try-live-demo': useRef(null),
  };

  // Scroll to section
  const handleNavigate = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // nav height + padding
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  // Intersection Observer for active section tracking + scroll reveals
  useEffect(() => {
    const sections = document.querySelectorAll('[id]');
    const sectionIds = ['hero', 'the-problem', 'architecture', 'defense-strategy', 'features', 'try-live-demo'];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && sectionIds.includes(entry.target.id)) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      if (sectionIds.includes(section.id)) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const reveals = document.querySelectorAll('.reveal');
    if (prefersReducedMotion) {
      // Show everything immediately
      reveals.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <NavBar activeSection={activeSection} onNavigate={handleNavigate} />

      <HeroSection onNavigate={handleNavigate} />

      <TreeRule variant="default" />

      <div className="reveal">
        <ProblemSection sectionRef={sectionRefs['the-problem']} />
      </div>

      <TreeRule variant="branch" />

      <div className="reveal">
        <ArchitectureSection sectionRef={sectionRefs.architecture} />
      </div>

      <TreeRule variant="default" />

      <div className="reveal">
        <DefenseSection sectionRef={sectionRefs['defense-strategy']} />
      </div>

      <TreeRule variant="end" />

      <div className="reveal">
        <FeaturesSection sectionRef={sectionRefs.features} />
      </div>

      <TreeRule variant="default" />

      <div className="reveal">
        <LiveAppSection sectionRef={sectionRefs['try-live-demo']} />
      </div>

      <FooterSection />
    </div>
  );
}
