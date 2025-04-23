import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  const labCategories = [
    {
      id: "semiconductor",
      title: "Semiconductor Physics Lab",
      description:
        "Interactive experiments on semiconductor materials and devices",
      experimentsCount: 12,
      imagePath: "/researchlab2.jpg",
    },
    {
      id: "upcoming-1",
      title: "Digital Electronics Lab",
      description:
        "Coming Soon - Experiments on digital circuits and logic design",
      experimentsCount: 0,
      imagePath: "digital.jpg",
    },
    {
      id: "upcoming-2",
      title: "Optoelectronics Lab",
      description: "Coming Soon - Experiments on optical devices and phenomena",
      experimentsCount: 0,
      imagePath: "optoelectronics.jpg",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-lab-blue text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Virtual Semiconductor Physics Laboratory
            </h1>
            <p className="text-xl mb-8 opacity-90 animate-fade-in">
              Experience interactive semiconductor physics experiments in a
              virtual environment
            </p>
            <div className="animate-slide-in">
              <Button
                asChild
                size="lg"
                className="bg-lab-amber text-lab-blue hover:bg-lab-amber/90"
              >
                <Link to="/lab">
                  Explore Experiments <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-lab-blue">
            Lab Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {labCategories.map((category) => (
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
                      category.id === "semiconductor"
                        ? "bg-lab-blue/20"
                        : "bg-gray-500/50"
                    } flex items-center justify-center`}
                  >
                    <h3 className="text-white text-2xl font-bold">
                      {category.title}
                    </h3>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lab-blue">
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {category.experimentsCount > 0
                      ? `${category.experimentsCount} experiments available`
                      : "Coming soon"}
                  </p>
                </CardContent>
                <CardFooter>
                  {category.id === "semiconductor" ? (
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
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-lab-blue">
              About Our Virtual Lab
            </h2>
            <p className="text-lg mb-8 text-gray-700">
              Our virtual laboratory provides interactive simulations that
              accurately demonstrate semiconductor physics principles, allowing
              students to collect and analyze data as they would in a physical
              lab environment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
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
                      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-lab-blue">
                  Educational
                </h3>
                <p className="text-gray-600">
                  Comprehensive theory and practical knowledge for students
                </p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lab-teal/10 text-lab-teal">
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
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-1.587c-1.718-.293-2.3-2.379-1.067-3.611L5 14.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-lab-teal">
                  Interactive
                </h3>
                <p className="text-gray-600">
                  Hands-on simulations that respond to user input in real-time
                </p>
              </div>
              <div className="p-6">
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-lab-amber">
                  Data Analytics
                </h3>
                <p className="text-gray-600">
                  Collect, visualize, and export experimental data for analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-lab-teal text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Explore Our Virtual Lab?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start your journey into semiconductor physics with our interactive
            experiments.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-lab-teal hover:bg-gray-100"
          >
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
