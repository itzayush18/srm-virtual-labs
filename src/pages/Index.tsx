import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Index = () => {
  const labCategories = [
    {
      id: 'semiconductor',
      title: 'Semiconductor Physics Lab',
      description: 'Interactive experiments on semiconductor materials and devices',
      experimentsCount: 12,
      imagePath: '/researchlab2.jpg',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-lab-blue text-white py-28">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 animate-fade-in">
              Virtual Semiconductor Physics Laboratory
            </h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90 animate-fade-in">
              Explore the fundamentals of semiconductor physics through interactive, virtual
              experiments — anytime, anywhere.
            </p>
            <p className="text-lg italic text-lab-lightBlue mb-2 animate-fade-in">
              “No lab coats. No limits. Just clicks.”
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-lab-blue">Lab Categories</h2>
          <div className="flex flex-wrap justify-center">
            {labCategories.map(category => (
              <Card
                key={category.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={category.imagePath}
                    alt={category.title}
                    className="object-cover w-full h-full"
                  />
                  <div
                    className={`absolute inset-0 ${
                      category.id === 'semiconductor' ? 'bg-lab-blue/20' : 'bg-gray-500/50'
                    } flex items-center justify-center`}
                  >
                    <h3 className="text-white text-2xl font-bold">{category.title}</h3>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lab-blue">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {category.experimentsCount > 0
                      ? `${category.experimentsCount} experiments available`
                      : 'Coming soon'}
                  </p>
                </CardContent>
                <CardFooter>
                  {category.id === 'semiconductor' ? (
                    <Button asChild variant="outline">
                      <Link to="/lab">
                        View Experiments <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Coming Soon <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ✅ Intended Audience Card - Left Side */}
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-lab-blue/10 text-lab-blue">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 7a4 4 0 110-8 4 4 0 010 8zM17 11a4 4 0 110-8 4 4 0 010 8zM7 11a4 4 0 110-8 4 4 0 010 8z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-lab-blue">Intended Audience</h2>
                <p className="mb-4 text-gray-600">Our virtual laboratory is designed for:</p>
                <ul className="list-disc pl-5 text-gray-600 text-left space-y-2">
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

            {/* ✅ Key Features - Right Side */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-lab-blue text-center">Key Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="p-6 text-center border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-teal/10 text-lab-teal">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-lab-teal">
                    Interactive Simulations
                  </h3>
                  <p className="text-gray-600">
                    Real-time, responsive simulations that accurately model semiconductor physics
                    phenomena.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-6 text-center border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-blue/10 text-lab-blue">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 14l6.16-3.422A12.042 12.042 0 0112 21.5a12.042 12.042 0 01-6.16-10.922L12 14z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-lab-blue">Educational Content</h3>
                  <p className="text-gray-600">
                    Comprehensive theory, procedures, and references for each experiment.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-6 text-center border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-amber/10 text-lab-amber">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-lab-amber">Self-Assessment</h3>
                  <p className="text-gray-600">
                    Built-in quizzes to test understanding of key concepts.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="p-6 text-center border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-purple/10 text-lab-purple">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v2a2 2 0 104 0v-2m0 0a2 2 0 002-2v-5a2 2 0 00-2-2m-4 9a2 2 0 01-2-2v-5a2 2 0 012-2m0 0V7a2 2 0 114 0v1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-lab-purple">
                    Data Collection & Analysis
                  </h3>
                  <p className="text-gray-600">
                    Tools for gathering and visualizing experimental data.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="p-6 text-center border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-green/10 text-lab-green">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h.01M15 12h.01M9 16h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h3l2 2h6a2 2 0 012 2v12a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-lab-green">Accessibility</h3>
                  <p className="text-gray-600">
                    Available anywhere with an internet connection, on any device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-lab-teal text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Explore Our Virtual Lab?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start your journey into semiconductor physics with our interactive experiments.
          </p>
          <Button asChild size="lg" className="bg-white text-lab-teal hover:bg-gray-100">
            <Link to="/lab">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
