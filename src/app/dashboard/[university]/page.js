import React from 'react';

import Header from './components/Header';



import UniversityOverview from './components/UniversityOverview';
import CollegeShowcase from './components/CollegeShowcase';
import ApplicationTabs from './components/ApplicationTabs';


const Index = () => {
  return (
    <div className="min-h-screen ">
      <Header />
      <div className=" ">
        <div className="">
          <div className="">
              <CollegeShowcase />
            <UniversityOverview />
            
            <ApplicationTabs />
          
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default Index;
