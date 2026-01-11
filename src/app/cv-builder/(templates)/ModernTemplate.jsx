import React from 'react';
import { Mail, Phone, MapPin, Linkedin } from 'lucide-react';

export const ModernTemplate = () => {
  return (
    <div className="p-10 h-full bg-white font-sans">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">John Doe</h1>
        <p className="text-lg text-teal-600 font-medium mb-4">Software Engineering Student</p>
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-teal-600" />
            </div>
            <span>john.doe@email.com</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-teal-600" />
            </div>
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <span>New York, NY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
              <Linkedin className="w-4 h-4 text-teal-600" />
            </div>
            <span>linkedin.com/in/johndoe</span>
          </div>
        </div>
      </header>

      {/* Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 rounded-full mb-6"></div>

      {/* Professional Summary */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Professional Summary
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-100">
          Passionate Computer Science student with strong foundation in software development, data structures, 
          and algorithms. Experienced in full-stack web development with React and Node.js. Seeking internship 
          opportunities to apply technical skills and contribute to innovative projects.
        </p>
      </section>

      {/* Education */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Education
        </h2>
        <div className="pl-4 border-l-2 border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-slate-900">Bachelor of Science in Computer Science</h3>
            <span className="text-xs text-teal-600 bg-teal-50 px-3 py-1 rounded-full font-medium">2021 - 2025</span>
          </div>
          <p className="text-sm text-slate-600 mb-1">Harvard University • Cambridge, MA</p>
          <p className="text-sm text-slate-500 mb-2">GPA: 3.8/4.0</p>
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Coursework:</span> Data Structures, Algorithms, Software Engineering, Database Systems, Machine Learning
          </p>
        </div>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Experience
        </h2>
        <div className="pl-4 border-l-2 border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-slate-900">Software Engineering Intern</h3>
            <span className="text-xs text-teal-600 bg-teal-50 px-3 py-1 rounded-full font-medium">Jun - Aug 2024</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">Google Inc. • Mountain View, CA</p>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Developed and maintained web applications using React and Node.js</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Collaborated with cross-functional teams to deliver features on time</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Improved application performance by 25% through code optimization</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Projects
        </h2>
        <div className="pl-4 border-l-2 border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-1">E-commerce Web Application</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['React', 'Node.js', 'MongoDB', 'Express'].map((tech) => (
              <span key={tech} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {tech}
              </span>
            ))}
          </div>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Built full-stack e-commerce platform with user authentication and payment processing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Implemented RESTful APIs and integrated with Stripe payment gateway</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Deployed using Docker containers on AWS with auto-scaling capabilities</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Technical Skills
        </h2>
        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Programming Languages</h4>
            <p className="text-slate-600 text-xs">JavaScript, Python, Java, C++, TypeScript</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Frameworks & Libraries</h4>
            <p className="text-slate-600 text-xs">React, Node.js, Express, Django, Spring Boot</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Tools & Technologies</h4>
            <p className="text-slate-600 text-xs">Git, Docker, AWS, MongoDB, PostgreSQL</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Soft Skills</h4>
            <p className="text-slate-600 text-xs">Leadership, Communication, Problem Solving</p>
          </div>
        </div>
      </section>
    </div>
  );
};