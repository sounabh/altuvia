import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertCircle, CheckCircle, Target, TrendingUp } from 'lucide-react';


export const SmartTipsPanel = ({ activeSection, isVisible }) => {
  if (!isVisible) return null;

  const getTipsForSection = (section) => {
    switch (section) {
      case 'personal':
        return {
          score: 85,
          tips: [
            { type: 'success', text: 'Professional email address detected' },
            { type: 'warning', text: 'Consider adding a portfolio website' },
            { type: 'info', text: 'Keep summary concise (2-3 sentences)' }
          ]
        };
      case 'education':
        return {
          score: 90,
          tips: [
            { type: 'success', text: 'GPA above 3.5 is highlighted well' },
            { type: 'info', text: 'Include relevant coursework' },
            { type: 'info', text: 'Add graduation date if close to completion' }
          ]
        };
      case 'experience':
        return {
          score: 75,
          tips: [
            { type: 'warning', text: 'Use more action verbs (led, developed, implemented)' },
            { type: 'warning', text: 'Quantify achievements with numbers' },
            { type: 'success', text: 'Good use of bullet points' }
          ]
        };
      default:
        return {
          score: 80,
          tips: [
            { type: 'info', text: 'Complete all sections for best results' },
            { type: 'info', text: 'Keep content relevant to target role' }
          ]
        };
    }
  };

  const { score, tips } = getTipsForSection(activeSection);
  
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-cvBorder p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* ATS Score */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg cv-heading">
              <TrendingUp className="w-5 h-5" />
              <span>ATS Score</span>
            </CardTitle>
            <CardDescription className="cv-body">
              How well your CV will perform with applicant tracking systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Tips */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg cv-heading">
              <Target className="w-5 h-5" />
              <span>Smart Tips</span>
            </CardTitle>
            <CardDescription className="cv-body">
              Personalized suggestions for the current section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-cvLightBg">
                  {getTypeIcon(tip.type)}
                  <p className="text-sm cv-body flex-1">{tip.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg cv-heading">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm cv-body">Sections Completed</span>
                <Badge variant="secondary" className="bg-cvLightBg text-cvHeading">5/7</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm cv-body">Word Count</span>
                <Badge variant="secondary" className="bg-cvLightBg text-cvHeading">247</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm cv-body">Keywords Match</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Good</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formatting Tips */}
        <Card className="border-cvBorder">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg cv-heading">Formatting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm cv-body">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Consistent font usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Proper spacing</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span>Consider reducing margins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};