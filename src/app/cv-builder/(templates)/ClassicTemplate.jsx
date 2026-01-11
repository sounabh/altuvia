import React from 'react';

export const ClassicTemplate = () => {
  return (
    <div className="p-10 h-full bg-white font-serif text-gray-900">
      {/* Header */}
      <header className="text-center mb-8 pb-6 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold tracking-wide mb-2">JOHN DOE</h1>
        <p className="text-base text-gray-700 mb-4">Software Engineering Student</p>
        <div className="text-sm text-gray-600 space-y-0.5">
          <p>john.doe@email.com  •  +1 (555) 123-4567</p>
          <p>New York, NY  •  linkedin.com/in/johndoe</p>
        </div>
      </header>

      {/* Professional Summary */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-2 mb-4">
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed text-justify text-gray-700">
          Dedicated Computer Science student with demonstrated experience in software development and 
          strong analytical skills. Proficient in multiple programming languages and frameworks with 
          a passion for creating efficient, scalable solutions. Seeking to leverage technical expertise 
          and academic knowledge in a challenging internship role.
        </p>
      </section>

      {/* Education */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-2 mb-4">
          Education
        </h2>
        <div>
          <div className="flex justify-between items-start mb-1">
            <strong className="text-sm">Bachelor of Science, Computer Science</strong>
            <span className="text-sm text-gray-600">2021 – 2025</span>
          </div>
          <p className="text-sm italic text-gray-600 mb-2">Harvard University, Cambridge, MA</p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">GPA:</span> 3.8/4.0
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Relevant Coursework:</span> Data Structures and Algorithms, Software Engineering, 
            Database Systems, Computer Networks, Machine Learning, Operating Systems
          </p>
        </div>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-2 mb-4">
          Professional Experience
        </h2>
        <div>
          <div className="flex justify-between items-start mb-1">
            <strong className="text-sm">Software Engineering Intern</strong>
            <span className="text-sm text-gray-600">June 2024 – August 2024</span>
          </div>
          <p className="text-sm italic text-gray-600 mb-3">Google Inc., Mountain View, CA</p>
          <ul className="text-sm text-gray-700 space-y-1.5 ml-4">
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Developed responsive web applications using React.js and Node.js
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Collaborated with senior engineers on feature development and code reviews
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Optimized application performance resulting in 25% improvement in load times
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Participated in daily standups and sprint planning meetings
            </li>
          </ul>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-2 mb-4">
          Technical Projects
        </h2>
        <div>
          <div className="flex justify-between items-start mb-1">
            <strong className="text-sm">E-commerce Platform</strong>
            <span className="text-sm text-gray-600">2024</span>
          </div>
          <p className="text-sm italic text-gray-600 mb-3">
            Technologies: React, Node.js, MongoDB, Express.js, Stripe API
          </p>
          <ul className="text-sm text-gray-700 space-y-1.5 ml-4">
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Designed and implemented full-stack web application with user authentication
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Integrated secure payment processing using Stripe API
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
              Deployed application using Docker containers on AWS EC2 instances
            </li>
          </ul>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-2 mb-4">
          Technical Skills
        </h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p><span className="font-semibold">Programming Languages:</span> JavaScript, Python, Java, C++, TypeScript, SQL</p>
          <p><span className="font-semibold">Frameworks & Libraries:</span> React, Node.js, Express.js, Django, Spring Boot, Bootstrap</p>
          <p><span className="font-semibold">Tools & Technologies:</span> Git, Docker, AWS, MongoDB, PostgreSQL, REST APIs</p>
          <p><span className="font-semibold">Development Tools:</span> VS Code, IntelliJ IDEA, Postman, Chrome DevTools</p>
        </div>
      </section>
    </div>
  );
};