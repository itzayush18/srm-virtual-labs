import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { experimentsList } from '@/data/experiments';
import { ArrowLeft } from 'lucide-react';
import ExperimentSimulation from '@/components/experiment/ExperimentSimulation';
import { cn } from '@/lib/utils';

const Experiment = () => {
  const { id } = useParams<{ id: string }>();
  const [currentExperiment, setCurrentExperiment] = useState(() =>
    experimentsList.find(exp => exp.id === id)
  );

  if (!currentExperiment) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Experiment Not Found</h1>
            <p className="mb-6">Sorry, the requested experiment could not be found.</p>
            <Button asChild>
              <Link to="/lab">Return to Lab</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Experiment Header */}
        <div className="mb-8">
          <Link to="/lab" className="inline-flex items-center text-lab-blue hover:underline mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Experiments
          </Link>
          <h1 className="text-3xl font-bold text-lab-blue mb-2">{currentExperiment.title}</h1>
          <p className="text-lg text-gray-600">{currentExperiment.shortDescription}</p>
        </div>

        {/* Experiment Tabs */}
        <Tabs defaultValue="theory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger
              value="theory"
              className="data-[state=active]:bg-lab-blue data-[state=active]:text-white"
            >
              Theory
            </TabsTrigger>
            <TabsTrigger
              value="procedure"
              className="data-[state=active]:bg-lab-blue data-[state=active]:text-white"
            >
              Procedure
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="data-[state=active]:bg-lab-blue data-[state=active]:text-white"
            >
              Simulation
            </TabsTrigger>
            <TabsTrigger
              value="evaluation"
              className="data-[state=active]:bg-lab-blue data-[state=active]:text-white"
            >
              Self Evaluation
            </TabsTrigger>
            <TabsTrigger
              value="references"
              className="data-[state=active]:bg-lab-blue data-[state=active]:text-white"
            >
              References
            </TabsTrigger>
          </TabsList>

          {/* Theory Tab */}
          <TabsContent value="theory">
            <Card>
              <CardContent className="pt-6">
                <h2 className="section-title">Theoretical Background</h2>
                <div className="prose max-w-none">
                  {currentExperiment.sections.theory.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedure Tab */}
          <TabsContent value="procedure">
            <Card>
              <CardContent className="pt-6">
                <h2 className="section-title">Experimental Procedure</h2>
                <ol className="list-decimal pl-5 space-y-2">
                  {currentExperiment.sections.procedure.map((step, index) => (
                    <li key={index} className="text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation">
            <Card>
              <CardContent className="pt-6">
                <h2 className="section-title">Interactive Simulation</h2>
                <ExperimentSimulation experimentId={currentExperiment.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Self Evaluation Tab */}
          <TabsContent value="evaluation">
            <Card>
              <CardContent className="pt-6">
                <h2 className="section-title">Self Evaluation Quiz</h2>
                <div className="space-y-6">
                  {currentExperiment.sections.selfEvaluation.map((question, qIndex) => (
                    <div key={qIndex} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">
                        Question {qIndex + 1}: {question.question}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center">
                            <input
                              type="radio"
                              id={`q${qIndex}-o${oIndex}`}
                              name={`question-${qIndex}`}
                              className="mr-2"
                            />
                            <label htmlFor={`q${qIndex}-o${oIndex}`} className="text-gray-700">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="text-sm"
                          onClick={() => {
                            // This would be replaced with actual functionality
                            alert(
                              `The correct answer is: ${question.options[question.correctAnswer]}`
                            );
                          }}
                        >
                          Check Answer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* References Tab */}
          <TabsContent value="references">
            <Card>
              <CardContent className="pt-6">
                <h2 className="section-title">References & Further Reading</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {currentExperiment.sections.references.map((reference, index) => (
                    <li key={index} className="text-gray-700">
                      {reference.link ? (
                        <a
                          href={reference.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lab-blue hover:underline"
                        >
                          {reference.title}
                        </a>
                      ) : (
                        reference.title
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Experiment;
