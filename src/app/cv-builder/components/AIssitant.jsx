import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Bot, Send, Lightbulb, Wand2, FileText, Target } from 'lucide-react';



export const AIAssistant= ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const aiSuggestions = [
    {
      icon: Wand2,
      title: 'Enhance Language',
      description: 'Improve tone and professionalism',
      action: 'Make my work experience descriptions sound more professional and impactful'
    },
    {
      icon: Target,
      title: 'Tailor for Role',
      description: 'Customize for specific position',
      action: 'Help me tailor this CV for a software engineering internship at Google'
    },
    {
      icon: FileText,
      title: 'Generate Content',
      description: 'Create bullet points',
      action: 'Suggest bullet points for my internship experience based on software development tasks'
    },
    {
      icon: Lightbulb,
      title: 'Optimize Length',
      description: 'Summarize for brevity',
      action: 'Help me shorten my project descriptions while keeping the key achievements'
    }
  ];

  const handleSuggestionClick = (action) => {
    setMessage(action);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsLoading(false);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-cvBorder">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-cvAccent" />
            <h2 className="text-xl font-bold cv-heading">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold cv-heading">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSuggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow border-cvBorder hover:border-cvAccent"
                    onClick={() => handleSuggestionClick(suggestion.action)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Icon className="w-5 h-5 text-cvAccent mt-1" />
                        <div>
                          <h4 className="font-medium cv-heading text-sm">{suggestion.title}</h4>
                          <p className="text-xs cv-body">{suggestion.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold cv-heading">AI Chat</h3>
            <Card className="border-cvBorder">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="bg-cvLightBg rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Bot className="w-4 h-4 text-cvAccent mt-1" />
                      <div className="text-sm cv-body">
                        <p>Hi! I'm here to help you improve your CV. I can:</p>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Enhance your language and tone</li>
                          <li>Suggest content for different sections</li>
                          <li>Tailor your CV for specific roles</li>
                          <li>Help with formatting and structure</li>
                        </ul>
                        <p className="mt-2">What would you like help with?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="p-4 border-t border-cvBorder">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about improving your CV..."
              className="flex-1 min-h-[60px] border-cvBorder focus:border-cvAccent resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="bg-cvAccent hover:bg-cvAccentHover text-white px-6"
            >
              {isLoading ? (
                <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
