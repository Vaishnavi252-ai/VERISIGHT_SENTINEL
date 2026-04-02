import React, { useState, useEffect } from 'react';
import BlogCard from './BlogCard';
import BlogModal from './BlogModal';

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const demoBlogs = [
    {
      title: 'Multimodal Deepfake Detection Breakthrough',
      excerpt: 'Combining CV, audio and temporal models achieves 98% accuracy across all media types.',
      date: 'Mar 25, 2025',
      readTime: 8,
      category: 'AI Research',
      image: '/images/blog1.webp',
      blog: { url: 'https://verisight.ai/blog1', content: 'Local blog1 content...' }
    },
    {
      title: 'GAN Artifacts Detection Algorithm',
      excerpt: 'Frequency domain analysis reveals synthetic images with 99% precision.',
      date: 'Mar 23, 2025',
      readTime: 6,
      category: 'Technical',
      image: '/images/blog2.jpeg',
      blog: { url: 'https://verisight.ai/blog2', content: 'Local blog2 content...' }
    },
    {
      title: 'Real-Time Video Deepfake Detection',
      excerpt: 'Edge deployment with <100ms latency and >95% accuracy.',
      date: 'Mar 21, 2025',
      readTime: 10,
      category: 'Performance',
      image: '/images/blog3.jpeg',
      blog: { url: 'https://verisight.ai/blog3', content: 'Local blog3 content...' }
    },
    {
      title: 'Audio Deepfake Voice Cloning Detection',
      excerpt: 'Phase analysis and watermarking for audio authenticity.',
      date: 'Mar 19, 2025',
      readTime: 7,
      category: 'Audio Security',
      image: '/images/blog4.webp',
      blog: { url: 'https://verisight.ai/blog4', content: 'Local blog4 content...' }
    },
    {
      title: 'Deepfake Impact on Cybersecurity',
      excerpt: 'Phishing evolution and enterprise defense strategies.',
      date: 'Mar 17, 2025',
      readTime: 9,
      category: 'Cybersecurity',
      image: '/images/blog5.jpeg',
      blog: { url: 'https://verisight.ai/blog5', content: 'Local blog5 content...' }
    },
    {
      title: 'Custom Deepfake Detector Training Guide',
      excerpt: 'Step-by-step ResNet fine-tuning for specialized use cases.',
      date: 'Mar 15, 2025',
      readTime: 12,
      category: 'Tutorial',
      image: '/images/blog6.jpeg',
      blog: { url: 'https://verisight.ai/blog6', content: 'Local blog6 content...' }
    },
    {
      title: 'Blink Detection in Deepfake Videos',
      excerpt: 'Eye movement analysis as reliable forensic marker.',
      date: 'Mar 13, 2025',
      readTime: 5,
      category: 'Forensics',
      image: '/images/blog7.jpeg',
      blog: { url: 'https://verisight.ai/blog7', content: 'Local blog7 content...' }
    },
    {
      title: 'Text-to-Image Deepfake Watermarking',
      excerpt: 'Invisible markers for provenance tracking.',
      date: 'Mar 11, 2025',
      readTime: 7,
      category: 'Watermarking',
      image: '/images/blog8.jpeg',
      blog: { url: 'https://verisight.ai/blog8', content: 'Local blog8 content...' }
    },
    {
      title: 'Enterprise Deepfake Defense Strategy',
      excerpt: 'Multi-layered approach for organizational protection.',
      date: 'Mar 9, 2025',
      readTime: 11,
      category: 'Enterprise',
      image: '/images/blog9.jpg',
      blog: { url: 'https://verisight.ai/blog9', content: 'Local blog9 content...' }
    }
  ];

const getRandomBlogs = () => {
    const shuffled = [...demoBlogs].sort(() => Math.random() - 0.5).slice(0, 3);
    return shuffled;
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const blogs = getRandomBlogs();
      setBlogs(blogs);
      setLoading(false);
    }, 500);
  }, [refreshCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 15000); // smoother, less frequent  uptae

    return () => clearInterval(interval);
  }, []);

  const handleReadMore = (blog) => {
    setSelectedBlog(blog);
    setShowModal(true);
  };

  const SkeletonCard = () => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden animate-pulse h-80">
      <div className="h-48 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse" />
        <div className="h-5 bg-slate-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
        <div className="h-10 bg-slate-700 rounded-full w-24 animate-pulse" />
      </div>
    </div>
  );

  return (
    <section id="blog" className="py-16 lg:py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 animate-in slide-in-from-bottom-6 duration-700">
            Stay Inspired with Our{' '}
            <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              Latest Insights
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto animate-in slide-in-from-bottom-6 duration-700 delay-200">
            Deepfake detection trends, technical analysis, and cybersecurity strategies.
          </p>
        </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading
    ? Array(3).fill().map((_, index) => (
        <div key={`skeleton-${index}`} className="transition-all duration-500 ease-in-out">
          <SkeletonCard />
        </div>
      ))
    : blogs.map((blog, index) => (
        <div
          key={`${blog.title}-${index}`}
          className="transition-all duration-500 ease-in-out transform hover:-translate-y-2"
        >
          <BlogCard {...blog} blog={blog.blog} onReadMore={handleReadMore} />
        </div>
      ))}
        </div>

        <div className="text-center animate-in slide-in-from-bottom-6 duration-700 delay-600">
          <div className="text-sm text-gray-500 mb-4">Refreshed {refreshCount} times (15s intervals)</div>
        </div>
      </div>

      {showModal && (
        <BlogModal 
          isOpen={showModal} 
          blog={selectedBlog} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </section>
  );
};

export default BlogSection;

