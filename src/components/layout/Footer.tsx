
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-lab-blue text-white py-8">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Semiconductor Physics VLab</h3>
        <p className="text-gray-300 mb-2">
          An interactive virtual laboratory for semiconductor physics experiments.
        </p>
        <div className="flex items-start space-x-4 mt-2">
          <div className="text-gray-300 text-sm">
            Department of Physics and Nanotechnology,<br />
            SRM Institute of Science and Technology,<br />
            Kattankulathur - 603203,<br />
            Chengalpattu District,<br />
            Tamil Nadu, India.
          </div>
          <img 
            src="../../../public/logo.png" 
            alt="SRM Logo" 
            className="w-40 h-20 object-contain"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
        <ul className="space-y-2">
          <li>
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link to="/lab" className="text-gray-300 hover:text-white transition-colors">
              All Experiments
            </Link>
          </li>
          <li>
            <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
              About VLab
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Contact</h3>
        <p className="text-gray-300">
          For support or queries, please email us at:
          <a 
            href="mailto:support@semiconducovlab.edu" 
            className="block text-white hover:underline mt-1"
          >
            support@semiconducovlab.edu
          </a>
        </p>
      </div>
    </div>

    <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
      <p>© {new Date().getFullYear()} Semiconductor Physics Virtual Laboratory. All rights reserved.</p>
    </div>
  </div>
</footer>
  );
};

export default Footer;
