import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ThumbsUp, MessageSquare, TrendingUp, Star, Search, AlertCircle, Loader, Youtube, BarChart2, Heart, MessageCircle } from 'lucide-react';

// Main Component
const YouTubeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
  };

  // Fetch comments from the YouTube API
  const fetchComments = async (videoId) => {
    setIsLoading(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        console.error('VITE_YOUTUBE_API_KEY is not defined. Add it to your .env file (see .env.example).');
        setError('YouTube API key is not configured. Set VITE_YOUTUBE_API_KEY in your .env file.');
        setIsLoading(false);
        return;
      }
      const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments from YouTube API');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        setError('No comments found for this video.');
        setIsLoading(false);
        return;
      }
      
      const comments = data.items.map(item => {
        const commentSnippet = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          authorName: commentSnippet.authorDisplayName,
          text: commentSnippet.textDisplay,
          likes: commentSnippet.likeCount,
          date: commentSnippet.publishedAt,
          replyCount: item.snippet.totalReplyCount || 0,
          sentiment: simpleSentimentAnalysis(commentSnippet.textDisplay)
        };
      });
      
      setComments(comments);
      analyzeComments(comments);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to fetch comments. ' + err.message);
      setIsLoading(false);
    }
  };
  
  // Simple sentiment analysis function
  function simpleSentimentAnalysis(text) {
    const positiveWords = ['love', 'great', 'awesome', 'excellent', 'helpful', 'amazing', 'good'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'poor', 'boring', 'worst'];
    
    text = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      fetchComments(id);
    } else {
      setError('Invalid YouTube URL. Please enter a valid URL.');
    }
  };

  // Analyze comments and update dashboard data
  const analyzeComments = (commentsData) => {
    if (!commentsData.length) return;
    
    const totalComments = commentsData.length;
    const totalLikes = commentsData.reduce((sum, comment) => sum + comment.likes, 0);
    const totalReplies = commentsData.reduce((sum, comment) => sum + comment.replyCount, 0);
    
    const sentimentCounts = commentsData.reduce((counts, comment) => {
      counts[comment.sentiment] = (counts[comment.sentiment] || 0) + 1;
      return counts;
    }, {positive: 0, neutral: 0, negative: 0});
    
    const sentimentData = [
      { name: 'Positive', value: sentimentCounts.positive || 0 },
      { name: 'Neutral', value: sentimentCounts.neutral || 0 },
      { name: 'Negative', value: sentimentCounts.negative || 0 }
    ];
    
    const topicData = extractTopics(commentsData);
    const contentIdeas = generateContentIdeas(commentsData);
    
    setDashboardData({
      basicStats: {
        totalComments,
        totalLikes,
        totalReplies,
        engagementRate: totalComments ? (totalLikes / totalComments).toFixed(1) : 0
      },
      sentimentData,
      topicData,
      contentIdeas,
      recentComments: [...commentsData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      topComments: [...commentsData].sort((a, b) => b.likes - a.likes).slice(0, 5)
    });
  };

  function extractTopics(comments) {
    const topics = {
      'tutorial': 0,
      'review': 0,
      'question': 0,
      'suggestion': 0,
      'technical': 0
    };
    
    const topicKeywords = {
      'tutorial': ['how to', 'tutorial', 'guide', 'learn', 'step by step', 'techniques'],
      'review': ['review', 'opinion', 'thoughts on', 'what I think', 'assessment'],
      'question': ['question', 'wondering', 'can you', 'how do you', '?'],
      'suggestion': ['suggestion', 'recommend', 'should make', 'would like to see', 'please make'],
      'technical': ['technical', 'software', 'hardware', 'settings', 'configuration', 'setup']
    };
    
    comments.forEach(comment => {
      const text = comment.text.toLowerCase();
      
      Object.keys(topicKeywords).forEach(topic => {
        const keywords = topicKeywords[topic];
        const hasKeyword = keywords.some(keyword => text.includes(keyword));
        
        if (hasKeyword) {
          topics[topic]++;
        }
      });
    });
    
    return Object.keys(topics).map(key => ({ name: key, value: topics[key] }));
  }

  function generateContentIdeas(comments) {
    const requestPatterns = [
      'can you make',
      'would like to see',
      'please make',
      'should do',
      'next video',
      'tutorial on',
      'comparison',
      'review of'
    ];
    
    const contentIdeas = [];
    
    comments.forEach(comment => {
      const text = comment.text.toLowerCase();
      
      requestPatterns.forEach(pattern => {
        if (text.includes(pattern)) {
          const index = text.indexOf(pattern) + pattern.length;
          const suggestion = text.substring(index).trim().replace(/[.!?].*$/g, '').trim();
          
          if (suggestion.length > 3) {
            contentIdeas.push({
              idea: suggestion.charAt(0).toUpperCase() + suggestion.slice(1),
              likes: comment.likes,
              source: comment.id
            });
          }
        }
      });
    });
    
    return contentIdeas
      .sort((a, b) => b.likes - a.likes)
      .filter((idea, index, self) => 
        index === self.findIndex((t) => t.idea.toLowerCase() === idea.idea.toLowerCase())
      )
      .slice(0, 10);
  }

  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="text-indigo-600 animate-spin mb-6" size={48} />
          <p className="text-xl font-medium text-gray-700">Analyzing YouTube comments...</p>
          <p className="text-gray-500 mt-2">This may take a moment</p>
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-indigo-50 p-6 rounded-full mb-6">
            <Youtube className="text-indigo-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">Welcome to YouTube Analytics</h2>
          <p className="text-gray-600 max-w-md leading-relaxed">
            Enter a YouTube video URL above to analyze comments and get valuable insights about your content.
          </p>
        </div>
      );
    }

    if (activeTab === 'overview') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Sentiment Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.sentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#4ade80" />
                  <Cell fill="#a3a3a3" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Topic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.topicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#818cf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow lg:col-span-2">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Top Content Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.contentIdeas.slice(0, 3).map((idea, index) => (
                <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                  <div className="flex items-center mb-3">
                    <Star className="text-amber-500 mr-2" size={24} />
                    <span className="font-semibold text-indigo-900">Trending Idea #{index + 1}</span>
                  </div>
                  <p className="text-lg font-medium text-gray-800 mb-3 line-clamp-2">{idea.idea}</p>
                  <div className="flex items-center text-sm text-indigo-600 bg-white px-3 py-2 rounded-lg">
                    <ThumbsUp size={16} className="mr-2" />
                    <span>{idea.likes} engagement points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'sentiment') {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Sentiment Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center">
                <Heart className="text-green-500 mr-3" size={24} />
                <h3 className="text-lg font-bold text-green-800">Positive</h3>
              </div>
              <p className="text-4xl font-bold mt-4 text-green-900">
                {dashboardData.sentimentData[0].value}
                <span className="text-sm font-medium text-green-700 ml-2">
                  ({dashboardData.basicStats.totalComments ? 
                    ((dashboardData.sentimentData[0].value / dashboardData.basicStats.totalComments) * 100).toFixed(0) : 0}%)
                </span>
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center">
                <BarChart2 className="text-gray-500 mr-3" size={24} />
                <h3 className="text-lg font-bold text-gray-800">Neutral</h3>
              </div>
              <p className="text-4xl font-bold mt-4 text-gray-900">
                {dashboardData.sentimentData[1].value}
                <span className="text-sm font-medium text-gray-700 ml-2">
                  ({dashboardData.basicStats.totalComments ? 
                    ((dashboardData.sentimentData[1].value / dashboardData.basicStats.totalComments) * 100).toFixed(0) : 0}%)
                </span>
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-3" size={24} />
                <h3 className="text-lg font-bold text-red-800">Negative</h3>
              </div>
              <p className="text-4xl font-bold mt-4 text-red-900">
                {dashboardData.sentimentData[2].value}
                <span className="text-sm font-medium text-red-700 ml-2">
                  ({dashboardData.basicStats.totalComments ? 
                    ((dashboardData.sentimentData[2].value / dashboardData.basicStats.totalComments) * 100).toFixed(0) : 0}%)
                </span>
              </p>
            </div>
          </div>
          
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4 text-gray-800">Sentiment Distribution</h4>
            <div className="bg-white rounded-xl border p-4">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={dashboardData.sentimentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#4ade80" />
                    <Cell fill="#a3a3a3" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h4 className="text-xl font-bold mb-4 text-gray-800">Top Comments by Sentiment</h4>
            <div className="space-y-4">
              {comments.filter(c => c.sentiment === 'positive').slice(0, 3).map(comment => (
                <div key={comment.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-green-900">{comment.authorName}</div>
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">Positive</span>
                  </div>
                  <p className="text-gray-800 mb-3">{comment.text}</p>
                  <div className="flex items-center text-sm text-green-700">
                    <ThumbsUp size={16} className="mr-2" />
                    <span>{comment.likes} likes</span>
                  </div>
                </div>
              ))}

              {comments.filter(c => c.sentiment === 'negative').slice(0, 2).map(comment => (
                <div key={comment.id} className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border border-red-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-red-900">{comment.authorName}</div>
                    <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">Negative</span>
                  </div>
                  <p className="text-gray-800 mb-3">{comment.text}</p>
                  <div className="flex items-center text-sm text-red-700">
                    <ThumbsUp size={16} className="mr-2" />
                    <span>{comment.likes} likes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'topics') {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Topic Analysis</h3>
          
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4 text-gray-800">Topic Distribution</h4>
            <div className="bg-white rounded-xl border p-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.topicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#818cf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h4 className="text-xl font-bold mb-4 text-gray-800">Content Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.contentIdeas.slice(0, 6).map((idea, index) => (
                <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                  <div className="flex items-center mb-3">
                    <Star className="text-amber-500 mr-2" size={24} />
                    <span className="font-semibold text-indigo-900">Content Idea #{index + 1}</span>
                  </div>
                  <p className="text-lg font-medium text-gray-800 mb-3">{idea.idea}</p>
                  <div className="flex items-center text-sm text-indigo-600 bg-white px-3 py-2 rounded-lg">
                    <ThumbsUp size={16} className="mr-2" />
                    <span>{idea.likes} engagement points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'comments') {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Most Engaging Comments</h3>
          <div className="space-y-4">
            {dashboardData.topComments.map(comment => (
              <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-gray-900">{comment.authorName}</div>
                  <div className="text-sm text-gray-500">{new Date(comment.date).toLocaleDateString()}</div>
                </div>
                <p className="text-gray-800 mb-3">{comment.text}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-indigo-600 bg-white px-3 py-2 rounded-lg">
                    <ThumbsUp size={16} className="mr-2" />
                    <span>{comment.likes} likes</span>
                  </div>
                  {comment.replyCount > 0 && (
                    <div className="flex items-center text-sm text-purple-600 bg-white px-3 py-2 rounded-lg">
                      <MessageCircle size={16} className="mr-2" />
                      <span>{comment.replyCount} replies</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Youtube size={32} />
            <h1 className="text-3xl font-bold">YouTube Analytics Dashboard</h1>
          </div>
          <p className="text-indigo-100 text-lg">Analyze your video's performance and get actionable insights</p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[160px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <BarChart2 className="mr-2" size={20} />
                  <span>Analyze Video</span>
                </>
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {videoId && !error && !isLoading && dashboardData && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center mb-2">
                  <MessageSquare className="text-blue-600 mr-3" size={24} />
                  <h3 className="font-bold text-blue-900">Total Comments</h3>
                </div>
                <p className="text-3xl font-bold text-blue-900">{dashboardData.basicStats.totalComments}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <div className="flex items-center mb-2">
                  <ThumbsUp className="text-green-600 mr-3" size={24} />
                  <h3 className="font-bold text-green-900">Total Likes</h3>
                </div>
                <p className="text-3xl font-bold text-green-900">{dashboardData.basicStats.totalLikes}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center mb-2">
                  <TrendingUp className="text-purple-600 mr-3" size={24} />
                  <h3 className="font-bold text-purple-900">Engagement Rate</h3>
                </div>
                <p className="text-3xl font-bold text-purple-900">{dashboardData.basicStats.engagementRate}</p>
              </div>
            </div>
          )}
        </div>
        
        {(videoId || isLoading) && (
          <div className="flex mb-6 border-b overflow-x-auto">
            <button 
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'overview' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'sentiment' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('sentiment')}
            >
              Sentiment Analysis
            </button>
            <button 
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'topics' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('topics')}
            >
              Topic Analysis
            </button>
            <button 
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'comments' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
          </div>
        )}
        
        {renderDashboardContent()}
      </div>
      
      <footer className="mt-12 bg-gray-900 text-gray-300 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Youtube size={24} />
            <h2 className="text-xl font-semibold">YouTube Analytics Dashboard</h2>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            This dashboard provides comprehensive analytics for YouTube videos, helping content creators understand their audience better and make data-driven decisions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default YouTubeDashboard;