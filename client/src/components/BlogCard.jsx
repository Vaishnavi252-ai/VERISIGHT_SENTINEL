import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

const BlogCard = ({ title, excerpt, date, readTime = 5, image, category, blog, onReadMore }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden 
      hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mt-auto">
          <Calendar className="h-4 w-4" />
          <span>{date}</span>
          <span>•</span>
          <span>{readTime} min</span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
          {excerpt}
        </p>

        <button 
          onClick={() => onReadMore?.(blog)}
          className="mt-auto text-purple-400 flex items-center gap-2 hover:gap-3 transition-all duration-300"
        >
          Read More <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default BlogCard;