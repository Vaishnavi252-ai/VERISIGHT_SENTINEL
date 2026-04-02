import HeroSection from '../components/HeroSection';
import Navbar from '../components/Navbar';
import BlogSection from '../components/BlogSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';
import HowItWorksSection from '../components/HowItWorksSection';
import ContactSection from '../components/ContactSection';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-900 pt-28"> 
            <Navbar />

            {/* 1. INTRODUCTION: HERO (0ms) - Already at the top */}
            <section id="home">
              <div data-scroll-reveal style={{ transitionDelay: '0ms' }}>
                  <HeroSection />
              </div>
            </section>

            {/* 2. HOW IT WORKS */}
            <div data-scroll-reveal style={{ transitionDelay: '400ms' }}>
              <HowItWorksSection />
            </div>

            {/* 7. AUTHORITY: BLOG (600ms) - Position as industry leader */}
            <div data-scroll-reveal style={{ transitionDelay: '600ms' }}>
                <BlogSection />
            </div>


            {/* 9. ACTION: CTA (800ms) - Final conversion hook */}
            <div data-scroll-reveal style={{ transitionDelay: '800ms' }}>
                <CTASection />
            </div>

            {/* CONTACT / NEWSLETTER */}
            <div data-scroll-reveal style={{ transitionDelay: '850ms' }}>
              <ContactSection />
            </div>

            {/* 10. CLOSURE: FOOTER (900ms) */}
            <div data-scroll-reveal style={{ transitionDelay: '900ms' }}>
                <Footer />
            </div>
        </div>
    );
};

export default Landing;
