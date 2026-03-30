import { useState, useEffect } from 'react';

// Simple Analytics Dashboard Component
export default function SimpleAnalytics() {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    recentEvents: []
  });

  // Mock data for demonstration - replace with real analytics API calls
  useEffect(() => {
    // Simulate loading analytics data
    const mockData = {
      pageViews: 1247,
      uniqueVisitors: 892,
      bounceRate: 34.2,
      avgSessionDuration: 4.5,
      topPages: [
        { page: '/', views: 456 },
        { page: '/login', views: 234 },
        { page: '/signup', views: 189 },
        { page: '/app', views: 156 },
        { page: '/patient/123', views: 98 }
      ],
      recentEvents: [
        { event: 'login', timestamp: new Date().toISOString(), user: 'user@example.com' },
        { event: 'signup', timestamp: new Date(Date.now() - 300000).toISOString(), user: 'new@example.com' },
        { event: 'create_patient', timestamp: new Date(Date.now() - 600000).toISOString(), user: 'doctor@example.com' },
        { event: 'start_consultation', timestamp: new Date(Date.now() - 900000).toISOString(), user: 'chw@example.com' }
      ]
    };
    
    setAnalytics(mockData);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analytics.pageViews.toLocaleString()}</div>
          <div className="text-sm text-blue-600">Page Views</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analytics.uniqueVisitors.toLocaleString()}</div>
          <div className="text-sm text-green-600">Unique Visitors</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{analytics.bounceRate}%</div>
          <div className="text-sm text-yellow-600">Bounce Rate</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analytics.avgSessionDuration}m</div>
          <div className="text-sm text-purple-600">Avg Session</div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Top Pages</h3>
        <div className="space-y-2">
          {analytics.topPages.map((page, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{page.page}</span>
              <span className="text-sm font-medium text-gray-900">{page.views} views</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Events</h3>
        <div className="space-y-2">
          {analytics.recentEvents.map((event, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">{event.event}</span>
                <div className="text-xs text-gray-500">{event.user}</div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This is a demo dashboard. Connect to Google Analytics or your analytics service 
          to see real data. Set up your GA4 tracking ID in environment variables.
        </p>
      </div>
    </div>
  );
}
