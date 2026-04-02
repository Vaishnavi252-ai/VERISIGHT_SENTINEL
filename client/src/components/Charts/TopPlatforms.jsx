import React from 'react';
import { FaInstagram, FaFacebook, FaXTwitter, FaWhatsapp, FaTiktok, FaSnapchat, FaYoutube, FaTelegram } from 'react-icons/fa6';
import { Globe } from 'lucide-react';

const platformIcons = {
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  Twitter: FaXTwitter,
  WhatsApp: FaWhatsapp,
  TikTok: FaTiktok,
  Snapchat: FaSnapchat,
  YouTube: FaYoutube,
  Telegram: FaTelegram,
};

const platformColors = {
  Instagram: '#E4405F',
  Facebook: '#1877F2',
  Twitter: '#000000',
  WhatsApp: '#25D366',
  TikTok: '#000000',
  Snapchat: '#FFFC00',
  YouTube: '#FF0000',
  Telegram: '#0088CC',
};

function TopPlatforms({ data }) {
  // data should be array of { platform: string, count: number, percentage: number }
  const total = (data || []).reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-purple-300 font-semibold mb-4">Top Platforms</div>
      {(!data || data.length === 0) && (
        <div className="text-sm text-gray-400 text-center py-8">No platform data yet</div>
      )}
      <div className="space-y-3">
        {(data || []).map((item, index) => {
          const IconComponent = platformIcons[item.platform] || Globe;
          const color = platformColors[item.platform] || '#9ca3af';
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color: color }}
                  />
                  <span className="text-sm text-gray-200">{item.platform}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{item.count}</span>
                  <span className="text-sm font-semibold text-white">{percentage}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TopPlatforms;
