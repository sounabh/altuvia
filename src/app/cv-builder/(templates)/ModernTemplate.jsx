import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

export const ModernTemplate = () => {
  return (
    <div className="p-8 h-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold cv-heading mb-2">John Doe</h1>
        <p className="text-lg cv-body mb-4">Software Engineering Student</p>
        
        <div className="flex flex-wrap gap-4 text-sm cv-body">
          <div className="flex items-center space-x-1">
            <Mail className="w-4 h-4" />
            <span>john.doe@email.com</span>
          </div>
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>New York, NY</span>
          </div>
          <div className="flex items-center space-x-1">
            <Linkedin className="w-4 h-4" />
            <span>linkedin.com/in/johndoe</span>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-bold cv-heading mb-3 pb-1 border-b-2 border-cvAccent">Professional Summary</h2>
        <p className="cv-body text-sm leading-relaxed">
          Passionate Computer Science student with strong foundation in software development, data structures, 
          and algorithms. Experienced in full-stack web development with React and Node.js. Seeking internship 
          opportunities to apply technical skills and contribute to innovative projects.
        </p>
      </div>

      {/* Education */}
      <div className="mb-6">
        <h2 className="text-xl font-bold cv-heading mb-3 pb-1 border-b-2 border-cvAccent">Education</h2>
        <div className="mb-3">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold cv-heading">Bachelor of Science in Computer Science</h3>
            <span className="text-sm cv-body">2021 - 2025</span>
          </div>
          <div className="text-sm cv-body mb-2">
            <p>Harvard University • Cambridge, MA</p>
            <p>GPA: 3.8/4.0</p>
          </div>
          <p className="text-sm cv-body">
            Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems, Machine Learning
          </p>
        </div>
      </div>

      {/* Experience */}
      <div className="mb-6">
        <h2 className="text-xl font-bold cv-heading mb-3 pb-1 border-b-2 border-cvAccent">Experience</h2>
        <div className="mb-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold cv-heading">Software Engineering Intern</h3>
            <span className="text-sm cv-body">Jun 2024 - Aug 2024</span>
          </div>
          <div className="text-sm cv-body mb-2">
            <p>Google Inc. • Mountain View, CA</p>
          </div>
          <ul className="text-sm cv-body space-y-1 list-disc list-inside">
            <li>Developed and maintained web applications using React and Node.js</li>
            <li>Collaborated with cross-functional teams to deliver features on time</li>
            <li>Improved application performance by 25% through code optimization</li>
          </ul>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-6">
        <h2 className="text-xl font-bold cv-heading mb-3 pb-1 border-b-2 border-cvAccent">Projects</h2>
        <div className="mb-4">
          <h3 className="font-semibold cv-heading mb-1">E-commerce Web Application</h3>
          <p className="text-sm cv-body mb-2">React, Node.js, MongoDB, Express</p>
          <ul className="text-sm cv-body space-y-1 list-disc list-inside">
            <li>Built full-stack e-commerce platform with user authentication and payment processing</li>
            <li>Implemented RESTful APIs and integrated with Stripe payment gateway</li>
            <li>Deployed using Docker containers on AWS with auto-scaling capabilities</li>
          </ul>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-xl font-bold cv-heading mb-3 pb-1 border-b-2 border-cvAccent">Technical Skills</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium cv-heading mb-2">Programming Languages</h4>
            <p className="cv-body">JavaScript, Python, Java, C++, TypeScript</p>
          </div>
          <div>
            <h4 className="font-medium cv-heading mb-2">Frameworks & Libraries</h4>
            <p className="cv-body">React, Node.js, Express, Django, Spring Boot</p>
          </div>
          <div>
            <h4 className="font-medium cv-heading mb-2">Tools & Technologies</h4>
            <p className="cv-body">Git, Docker, AWS, MongoDB, PostgreSQL</p>
          </div>
          <div>
            <h4 className="font-medium cv-heading mb-2">Soft Skills</h4>
            <p className="cv-body">Leadership, Communication, Problem Solving</p>
          </div>
        </div>
      </div>
    </div>
  );
};