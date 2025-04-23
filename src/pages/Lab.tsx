
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { experimentsList } from '@/data/experiments';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Lab = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredExperiments = categoryFilter 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? experimentsList.filter(exp => (exp as any).category === categoryFilter)
    : experimentsList;

  // Extract unique categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = Array.from(new Set(experimentsList.map(exp => (exp as any).category)));

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <Layout>
      <section className="py-12 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-4 text-[#2563eb] bg-clip-text text-transparent bg-gradient-to-r from-[#2563eb] to-[#123c95]"
            >
              Semiconductor Physics Laboratory
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600"
            >
              Explore our collection of interactive semiconductor physics experiments
            </motion.p>
          </div>
          
          {/* Filters Section */}
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row justify-between items-center mb-4"
            >
              <h2 className="text-xl font-semibold text-[#2563eb] mb-4 md:mb-0">
                Available Experiments
              </h2>
              
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full md:w-auto">
                <div className="flex items-center">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter size={16} />
                      Filter Experiments
                      {isFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="mt-4">
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={categoryFilter === null ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setCategoryFilter(null)}
                        className="transition-all"
                      >
                        All
                      </Button>
                      {categories.map(category => (
                        <Button 
                          key={category} 
                          variant={categoryFilter === category ? "default" : "outline"}
                          size="sm" 
                          onClick={() => setCategoryFilter(category)}
                          className="transition-all"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          </div>
          
          {/* Experiment Cards */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredExperiments.map((experiment) => (
              <motion.div key={experiment.id} variants={item}>
                <Card className="h-full flex flex-col group transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden border-slate-200 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[#2563eb]">{experiment.title}</CardTitle>
                    <CardDescription>{experiment.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-md mb-4 h-36 flex items-center justify-center overflow-hidden">
                      <img 
                        src={experiment.imageUrl} 
                        alt={experiment.title}
                        className="max-h-full transition-transform duration-500 transform group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placeholder.svg';
                        }}
                      />
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {experiment.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-lab-teal">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4 pb-5">
                    <Link 
                      to={`/experiment/${experiment.id}`}
                      className="w-full group-hover:bg-[#2563eb]/90 py-2.5 px-4 bg-[#2563eb] text-white rounded-md text-center transition-all flex items-center justify-center"
                    >
                      <span>Start Experiment</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          {filteredExperiments.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-gray-500"
            >
              <p>No experiments found matching the selected filters.</p>
              <Button 
                variant="outline"
                onClick={() => setCategoryFilter(null)}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Lab;
