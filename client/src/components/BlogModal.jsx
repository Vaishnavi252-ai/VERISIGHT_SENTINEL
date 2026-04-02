import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Clock, Eye } from 'lucide-react';

const BlogModal = ({ isOpen, onClose, blog }) => {
  const [expanded, setExpanded] = useState(false);

  if (!isOpen || !blog) return null;

  const fullContent = `
    ${blog.content || blog.description || blog.excerpt.substring(0, 1000) + '...'}

    ## Key Takeaways
    ${blog.title.includes('AI') ? '- Latest AI advancements in detection tech' : ''}
    ${blog.title.includes('Deepfake') ? '- New forensic methods revealed' : ''}
    ${blog.title.includes('Cybersecurity') ? '- Emerging threats and mitigation' : ''}

    *This summary powered by VeriSight Sentinel. Source: ${blog.url || '#'}*
  `;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-3xl max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl shadow-purple-900/50 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white line-clamp-1">{blog.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{blog.date || 'Recent'}</span>
                  </div>
                  <span>•</span>
                  <span>5 min read</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-xl transition-all group hover:scale-110"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Image */}
        {blog.urlToImage && (
          <div className="h-48 md:h-64 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
            <img
              src={blog.urlToImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-8 lg:p-10 max-h-[60vh] overflow-y-auto prose prose-invert max-w-none">
          <div className={expanded ? 'max-h-none' : 'line-clamp-6'}>
            <p className="text-lg leading-relaxed text-gray-200 mb-6">{blog.description}</p>
            {expanded && (
              <div className="prose prose-sm">
                <div dangerouslySetInnerHTML={{ __html: fullContent }} />
              </div>
            )}
          </div>

          {blog.description && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-2 mt-4 mb-8"
            >
              <span>Read full article</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm flex flex-col sm:flex-row gap-4 justify-end items-center">
          {blog.url && (
            <a
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transform hover:-translate-y-1 whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Read Original</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="px-8 py-3 border border-slate-700 hover:border-slate-600 text-gray-300 hover:text-white rounded-xl transition-all font-medium hover:bg-slate-800/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogModal;

