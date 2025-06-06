import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, ThumbsUp, ThumbsDown } from 'lucide-react';

export const UniversityCard = ({
  university,
  isInDashboard,
  onAddToDashboard,
  onRemoveFromDashboard,
}) => {
  return (
    <Card className="group overflow-hidden rounded-xl border border-slate-200 bg- shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] w-full max-w-sm text-sm"  >
      <div className="relative">
   
        {/* Top Colored Banner - Removed blur effect */}
        <div
          className=" md:h-56 -mt-10 relative flex items-center justify-center rounded-t-xl"
         
        >
          <img
            src={university.image}
            alt={university.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Rank Badge */}
      <Badge className="absolute top-2 left-2 bg-[#002147] text-white border border-[#002147] font-semibold px-2 py-0.5 text-xs rounded-full shadow">
          #{university.rank}
        </Badge>

        {/* Add/Remove Button */}
        <Button
          onClick={isInDashboard ? onRemoveFromDashboard : onAddToDashboard}
          size="sm"
          variant="outline"
          className={`absolute top-2 right-2 h-6 px-3 text-xs font-medium rounded-full transition-all duration-200 ${
            isInDashboard
              ? "bg-[#3598FE] text-white border-none"
              : "bg-white/90 text-slate-700 hover:bg-white border border-slate-300"
          }`}
        >
          {isInDashboard ? "Added" : "Add"}
        </Button>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Title & Location */}
        <div>
          <h3 className="font-semibold text-base text-slate-900 truncate">
            {university.name}
          </h3>
          <div className="flex items-center text-slate-600 text-xs mt-1 truncate">
            <MapPin className="h-4 w-4 mr-1" />
            {university.location}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{university.gmatAvg}</div>
            <div className="text-xs text-slate-600 font-medium">GMAT Avg</div>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg text-center">
            <div className="text-lg font-bold text-emerald-600">{university.acceptanceRate}%</div>
            <div className="text-xs text-slate-600 font-medium">Accept Rate</div>
          </div>
        </div>

        {/* Deadline & Fees */}
        <div className="flex justify-between text-slate-600 text-xs">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {university.deadline || 'N/A'}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            {university.tuitionFees || 'N/A'}
          </div>
        </div>

        {/* Pros */}
        <div className="flex items-start gap-2 text-slate-700">
          <ThumbsUp className="h-4 w-4 text-emerald-500 mt-[3px]" />
          <ul className="list-disc ml-3 space-y-1">
            {university.pros?.slice(0, 2).map((item, i) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="flex items-start gap-2 text-slate-700">
          <ThumbsDown className="h-4 w-4 text-rose-500 mt-[3px]" />
          <ul className="list-disc ml-3 space-y-1">
            {university.cons?.slice(0, 2).map((item, i) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
          
      </CardContent>
      
    </Card>
  );
};