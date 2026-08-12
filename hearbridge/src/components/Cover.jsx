import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    id: 'trade-in',
    image: '/img/phonakhearingaids.jpg',
    eyebrow: 'Trade-in offer',
    title: 'Trade-in hearing aids now to get',
    highlight: 'up to 50% off on all hearing aids!',
    text: 'Terms and conditions apply.',
    cta: { label: 'Trade Now', to: '/trade-in' },
  },
  {
    id: 'new-arrivals',
    image: '',
    eyebrow: 'New arrivals',
    title: 'Discover our newest lineup of',
    highlight: 'smarter, smaller hearing aids',
    text: "Advanced sound clarity in a design you'll barely notice.",
    cta: { label: 'Book Now', to: '/listings' },
  },
  {
    id: 'articles',
    image: '',
    eyebrow: 'HearBridge journal',
    title: 'Get expert advice on',
    highlight: 'living well with hearing loss',
    text: 'Read the latest articles from our audiology team.',
    cta: { label: 'Read Articles', href: '#' },
  },
  {
    id: 'booking',
    image: '',
    eyebrow: 'Free consultation',
    title: 'Not sure what fits you? Book a',
    highlight: 'free hearing consultation today',
    text: 'Our specialists will help you find the right device.',
    cta: { label: 'Book Now', to: '/booking' },
  },
];

const AUTOPLAY_MS = 6000;

function Cover() {
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i) => {
    setIndex((i + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="cover">
      <div className="cover-track">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`cover-slide${i === index ? ' active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden={i === index ? undefined : true}
          >
            <h4>{slide.eyebrow}</h4>
            <h2>{slide.title}</h2>
            <h1>{slide.highlight}</h1>
            <p>{slide.text}</p>
            {slide.cta.to ? (
              <Link to={slide.cta.to}><button className="cover">{slide.cta.label}</button></Link>
            ) : (
              <a href={slide.cta.href}><button className="cover">{slide.cta.label}</button></a>
            )}
          </div>
        ))}
      </div>

      <button className="cover-arrow cover-arrow-left" onClick={() => goTo(index - 1)} aria-label="Previous slide">
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button className="cover-arrow cover-arrow-right" onClick={() => goTo(index + 1)} aria-label="Next slide">
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <div className="cover-dots">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            className={`cover-dot${i === index ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default Cover;
