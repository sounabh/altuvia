import React from 'react';

export const ClassicTemplate = () => {
  return (
    <div className="p-8 h-full font-serif">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">JOHN DOE</h1>
        <p className="text-lg mb-3">Software Engineering Student</p>
        <div className="text-sm space-y-1">
          <p>john.doe@email.com • +1 (555) 123-4567</p>
          <p>New York, NY • linkedin.com/in/johndoe</p>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed text-justify">
          Dedicated Computer Science student with demonstrated experience in software development and 
          strong analytical skills. Proficient in multiple programming languages and frameworks with 
          a passion for creating efficient, scalable solutions. Seeking to leverage technical expertise 
          and academic knowledge in a challenging internship role.
        </p>
      </div>

      {/* Education */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
          Education
        </h2>
        <div>
          <div className="flex justify-between mb-1">
            <strong>Bachelor of Science, Computer Science</strong>
            <span>2021 - 2025</span>
          </div>
          <div className="mb-2">
            <em>Harvard University, Cambridge, MA</em>
          </div>
          <div className="text-sm mb-2">
            <strong>GPA:</strong> 3.8/4.0
          </div>
          <div className="text-sm">
            <strong>Relevant Coursework:</strong> Data Structures and Algorithms, Software Engineering, 
            Database Systems, Computer Networks, Machine Learning, Operating Systems
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
          Professional Experience
        </h2>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <strong>Software Engineering Intern</strong>
            <span>June 2024 - August 2024</span>
          </div>
          <div className="mb-2">
            <em>Google Inc., Mountain View, CA</em>
          </div>
          <ul className="text-sm space-y-1 list-disc ml-5">
            <li>Developed responsive web applications using React.js and Node.js</li>
            <li>Collaborated with senior engineers on feature development and code reviews</li>
            <li>Optimized application performance resulting in 25% improvement in load times</li>
            <li>Participated in daily standups and sprint planning meetings</li>
          </ul>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
          Technical Projects
        </h2>
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <strong>E-commerce Platform</strong>
            <span className="text-sm">2024</span>
          </div>
          <div className="text-sm mb-1">
            <em>Technologies: React, Node.js, MongoDB, Express.js, Stripe API</em>
          </div>
          <ul className="text-sm space-y-1 list-disc ml-5">
            <li>Designed and implemented full-stack web application with user authentication</li>
            <li>Integrated secure payment processing using Stripe API</li>
            <li>Deployed application using Docker containers on AWS EC2 instances</li>
          </ul>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
          Technical Skills
        </h2>
        <div className="text-sm">
          <div className="mb-2">
            <strong>Programming Languages:</strong> JavaScript, Python, Java, C++, TypeScript, SQL
          </div>
          <div className="mb-2">
            <strong>Frameworks & Libraries:</strong> React, Node.js, Express.js, Django, Spring Boot, Bootstrap
          </div>
          <div className="mb-2">
            <strong>Tools & Technologies:</strong> Git, Docker, AWS, MongoDB, PostgreSQL, REST APIs
          </div>
          <div>
            <strong>Development Tools:</strong> VS Code, IntelliJ IDEA, Postman, Chrome DevTools
          </div>
        </div>
      </div>
    </div>
  );
};
