import React from 'react';

// Import components
import Header from './components/Header';
import UniversityOverview from './components/UniversityOverview';
import CollegeShowcase from './components/CollegeShowcase';
import ApplicationTabs from './components/ApplicationTabs';

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <Header />

      {/* Main Content Area */}
      <div>
        <div>
          <div>
            {/* College Carousel Showcase */}
            <CollegeShowcase />

            {/* University Stats + Highlights */}
            <UniversityOverview />

            {/* Application Tabs Section */}
            <ApplicationTabs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
