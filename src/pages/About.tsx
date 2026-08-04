import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-lab-blue">
            About Our Virtual Laboratory
          </h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Our Mission</h2>
              <p className="mb-4">
                The Physics Virtual Laboratory aims to provide a comprehensive online
                platform for students and researchers to conduct many physics laboratory
                experiments in a virtual environment. Our mission is to make physics
                laboratory education more accessible, interactive, and engaging.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="section-title">Development Team</h2>
              <p className="mb-4">
                This virtual laboratory was developed as a mini project under an open
                education initiative. The CSE-Core students contributed to the webpage
                development and design, helping create an engaging and accessible webpage.
                {' '}
                <a
                  href="https://www.srmist.edu.in/faculty/dr-rajaboopathi-m/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lab-blue underline"
                >
                  Dr. Rajaboopathi Mani
                </a>
                , Research Assistant Professor, Department of Physics and Nanotechnology,
                SRMIST, Kattankulathur 603203, conceptualized the virtual lab and developed
                the simulation using an AI coding agent, along with the theory and procedures.
              </p>

              <p>
                Meet the team:
                <br />
                Atharv Tamboli, Ayush Kumar Sharma, Aman Kumar Chouhan, Ayush Kesarwani,
                Daksh Gupta, Kushagr Joshi,{' '}
                <a
                  href="https://www.linkedin.com/in/rajaboopathi-mani-phd-67851865/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lab-blue underline font-semibold"
                >
                  Dr. Rajaboopathi Mani
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default About;
