import React from 'react';

export const MinimalTemplate = () => {
  return (
    <div className="p-8 h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-light mb-1">John Doe</h1>
        <p className="text-xl text-gray-600 mb-4">Software Engineer</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>john.doe@email.com</p>
          <p>+1 (555) 123-4567</p>
          <p>New York, NY</p>
          <p>linkedin.com/in/johndoe</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-light mb-3 text-gray-800">Summary</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Computer Science student with experience in full-stack development. 
          Passionate about creating clean, efficient code and learning new technologies.
        </p>
      </div>

      {/* Education */}
      <div className="mb-8">
        <h2 className="text-lg font-light mb-3 text-gray-800">Education</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-baseline">
              <h3 className="font-medium">Computer Science, BS</h3>
              <span className="text-sm text-gray-500">2021 — 2025</span>
            </div>
            <p className="text-sm text-gray-600">Harvard University</p>
            <p className="text-sm text-gray-500">GPA: 3.8/4.0</p>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="mb-8">
        <h2 className="text-lg font-light mb-3 text-gray-800">Experience</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-medium">Software Engineering Intern</h3>
              <span className="text-sm text-gray-500">Jun — Aug 2024</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Google Inc.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Developed web applications using React and Node.js</li>
              <li>• Collaborated with engineering teams on feature development</li>
              <li>• Improved application performance by 25%</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-8">
        <h2 className="text-lg font-light mb-3 text-gray-800">Projects</h2>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">E-commerce Platform</h3>
            <p className="text-sm text-gray-600 mb-1">React, Node.js, MongoDB</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Full-stack web application with payment processing</li>
              <li>• User authentication and RESTful API design</li>
              <li>• Deployed on AWS with Docker containers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-lg font-light mb-3 text-gray-800">Skills</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Languages: </span>
            <span className="text-gray-600">JavaScript, Python, Java, TypeScript</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Frameworks: </span>
            <span className="text-gray-600">React, Node.js, Express, Django</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tools: </span>
            <span className="text-gray-600">Git, Docker, AWS, MongoDB, PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
