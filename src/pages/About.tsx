import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-lab-blue">About Our Virtual Laboratory</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Our Mission</h2>
              <p className="mb-4">
                The Semiconductor Physics Virtual Laboratory aims to provide a comprehensive online
                platform for students and researchers to conduct semiconductor physics experiments
                in a virtual environment. Our mission is to make semiconductor physics education
                more accessible, interactive, and engaging. Through our interactive simulations,
                users can explore the fundamental principles of semiconductor physics, conduct
                experiments, collect data, and analyze results, all without the need for physical
                laboratory equipment.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Key Features</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Interactive Simulations:</span> Real-time,
                  responsive simulations that accurately model semiconductor physics phenomena.
                </li>
                <li>
                  <span className="font-semibold">Educational Content:</span> Comprehensive theory,
                  procedures, and references for each experiment.
                </li>
                <li>
                  <span className="font-semibold">Self-Assessment:</span> Built-in quizzes to test
                  understanding of key concepts.
                </li>
                <li>
                  <span className="font-semibold">Data Collection & Analysis:</span> Tools for
                  gathering and visualizing experimental data.
                </li>
                <li>
                  <span className="font-semibold">Accessibility:</span> Available anywhere with an
                  internet connection, on any device.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Intended Audience</h2>
              <p className="mb-4">Our virtual laboratory is designed for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Undergraduate and graduate students in physics, electrical engineering, and
                  materials science
                </li>
                <li>Educators looking for supplementary teaching resources</li>
                <li>Researchers who want to validate concepts before physical experimentation</li>
                <li>Self-learners interested in semiconductor physics</li>
                <li>
                  Educational institutions with limited access to physical laboratory equipment
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Development Team:</h2>
              <p className="mb-4">
                Our virtual laboratory platform was developed by a dedicated team of CSE-Core
                students as part of an open education initiative, integrating student-led coding and
                design efforts to create an engaging and accessible learning environment. The
                virtual lab was conceptualized and guided by Dr Rajaboopathi Mani, Research
                Assistant Professor from SRMIST, Kattankulathur 603203.
              </p>
              <p>
                Meet the team:
                <br />
                Atharv Tamboli, Ayush Kumar Sharma, Aman Kumar Chouhan, Ayush Kesarwani, Daksh
                Gupta, Kushagr Joshi, Dr. Rajaboopathi Mani*
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default About;
