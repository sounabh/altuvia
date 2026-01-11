import React from 'react';

export const MinimalTemplate = () => {
  return (
    <div className="p-12 h-full bg-white font-light">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-5xl font-extralight tracking-tight text-gray-900 mb-2">John Doe</h1>
        <p className="text-xl text-gray-400 font-light mb-6">Software Engineer</p>
        
        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <span>john.doe@email.com</span>
          <span className="text-gray-300">|</span>
          <span>+1 (555) 123-4567</span>
          <span className="text-gray-300">|</span>
          <span>New York, NY</span>
          <span className="text-gray-300">|</span>
          <span>linkedin.com/in/johndoe</span>
        </div>
      </header>

      {/* Thin Divider */}
      <div className="w-16 h-px bg-gray-300 mb-10"></div>

      {/* Summary */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Summary</h2>
        <p className="text-sm text-gray-600 leading-loose max-w-2xl">
          Computer Science student with experience in full-stack development. 
          Passionate about creating clean, efficient code and learning new technologies.
        </p>
      </section>

      {/* Education */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Education</h2>
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="text-base font-normal text-gray-900">Computer Science, BS</h3>
            <span className="text-sm text-gray-400">2021 — 2025</span>
          </div>
          <p className="text-sm text-gray-500">Harvard University</p>
          <p className="text-sm text-gray-400 mt-1">GPA: 3.8/4.0</p>
        </div>
      </section>

      {/* Experience */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Experience</h2>
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="text-base font-normal text-gray-900">Software Engineering Intern</h3>
            <span className="text-sm text-gray-400">Jun — Aug 2024</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Google Inc.</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>Developed web applications using React and Node.js</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>Collaborated with engineering teams on feature development</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>Improved application performance by 25%</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Projects</h2>
        <div>
          <h3 className="text-base font-normal text-gray-900 mb-1">E-commerce Platform</h3>
          <p className="text-sm text-gray-400 mb-4">React, Node.js, MongoDB</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>Full-stack web application with payment processing</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>User authentication and RESTful API design</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-gray-300 mt-0.5">—</span>
              <span>Deployed on AWS with Docker containers</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Skills</h2>
        <div className="space-y-3 text-sm">
          <div className="flex">
            <span className="w-28 text-gray-400 flex-shrink-0">Languages</span>
            <span className="text-gray-600">JavaScript, Python, Java, TypeScript</span>
          </div>
          <div className="flex">
            <span className="w-28 text-gray-400 flex-shrink-0">Frameworks</span>
            <span className="text-gray-600">React, Node.js, Express, Django</span>
          </div>
          <div className="flex">
            <span className="w-28 text-gray-400 flex-shrink-0">Tools</span>
            <span className="text-gray-600">Git, Docker, AWS, MongoDB, PostgreSQL</span>
          </div>
        </div>
      </section>
    </div>
  );
};