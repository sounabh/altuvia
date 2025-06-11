import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, CheckCircle2, FileText, TrendingUp, Brain } from 'lucide-react';



export const AIInsights = ({ essays, activeEssayId }) => {
  const activeEssay = essays.find(e => e.id === activeEssayId);

  const generateInsights = () => {
    if (!activeEssay || !activeEssay.content) {
      return {
        suggestions: [
          "Start with a compelling hook that showcases your unique perspective",
          "Include specific, quantifiable achievements from your background",
          "Connect your experiences directly to your post-MBA goals"
        ],
        warnings: [],
        strengths: [],
        score: null
      };
    }

    const insights = {
      suggestions: [
        "Consider adding more specific metrics to quantify your impact",
        "Strengthen your conclusion by tying back to the school's values",
        "Add transitional phrases to improve narrative flow between paragraphs"
      ],
      warnings: [
        "The word 'leadership' appears 6 times - consider varying your vocabulary",
        "Your second paragraph could be more concise and impactful"
      ],
      strengths: [
        "Excellent opening that immediately captures attention",
        "Strong use of specific examples that demonstrate growth",
        "Clear alignment between your goals and the program's offerings"
      ],
      score: 85
    };

    return insights;
  };

  const insights = generateInsights();

  return (
    <Card className="glass-card animate-slide-up">
      {/* Premium Header */}
      <div className="p-6 border-b border-essay-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg accent-gradient flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-essay-navy">AI Insights</h3>
            {activeEssay && (
              <p className="text-sm text-essay-gray-600">{activeEssay.schoolName}</p>
            )}
          </div>
        </div>
        
        {insights.score && (
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex-1 bg-essay-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-essay-blue to-essay-blue-light"
                style={{ width: `${insights.score}%` }}
              />
            </div>
            <span className="font-bold text-lg text-essay-blue">{insights.score}%</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Suggestions */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-4 w-4 text-essay-blue" />
            <span className="font-semibold text-essay-navy">Smart Suggestions</span>
            <Badge variant="secondary" className="bg-essay-blue/10 text-essay-blue border-essay-blue/20">
              {insights.suggestions.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {insights.suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 bg-essay-blue/5 border border-essay-blue/10 rounded-lg">
                <p className="text-sm text-essay-gray-800 leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {insights.warnings.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-4 w-4 text-essay-warning" />
              <span className="font-semibold text-essay-navy">Areas for Improvement</span>
              <Badge variant="outline" className="border-essay-warning/30 text-essay-warning bg-essay-warning/5">
                {insights.warnings.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {insights.warnings.map((warning, index) => (
                <div key={index} className="p-4 bg-essay-warning/5 border border-essay-warning/20 rounded-lg">
                  <p className="text-sm text-essay-gray-800 leading-relaxed">{warning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle2 className="h-4 w-4 text-essay-success" />
              <span className="font-semibold text-essay-navy">Strong Points</span>
              <Badge variant="outline" className="border-essay-success/30 text-essay-success bg-essay-success/5">
                {insights.strengths.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {insights.strengths.map((strength, index) => (
                <div key={index} className="p-4 bg-essay-success/5 border border-essay-success/20 rounded-lg">
                  <p className="text-sm text-essay-gray-800 leading-relaxed">{strength}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Action Button */}
        <Button className="w-full premium-gradient text-white font-semibold shadow-premium hover:shadow-premium-lg smooth-transition">
          <TrendingUp className="h-4 w-4 mr-2" />
          Get Advanced Analysis
        </Button>
      </div>
    </Card>
  );
};
