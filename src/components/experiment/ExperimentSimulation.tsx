import React from 'react';
import HallCoefficientSimulation from './simulations/HallCoefficientSimulation';
import BandGapSimulation from './simulations/BandGapSimulation';
import FourProbeSimulation from './simulations/FourProbeSimulation';
import LDRCharacteristicsSimulation from './simulations/ldr/LDRCharacteristicsSimulation';
import SolarCellSimulation from './simulations/SolarCellSimulation';
import PNJunctionSimulation from './simulations/PNJunctionSimulation';
import PhotocellSimulation from './simulations/PhotocellSimulation';
import CarrierMobilitySimulation from './simulations/CarrierMobilitySimulation';
import FermiFunctionSimulation from './simulations/FermiFunctionSimulation';
import OpticalFiberSimulation from './simulations/OpticalFiberSimulation';
import DiodeIVSimulation from './simulations/DiodeIVSimulation';
import XRayDiffractionSimulation from './simulations/XRayDiffractionSimulation';

interface ExperimentSimulationProps {
  experimentId: string;
}

const ExperimentSimulation: React.FC<ExperimentSimulationProps> = ({ experimentId }) => {
  // Render the appropriate simulation component based on the experiment ID
  switch (experimentId) {
    case 'hall-coefficient':
      return <HallCoefficientSimulation />;
    case 'band-gap':
      return <BandGapSimulation />;
    case 'four-probe':
      return <FourProbeSimulation />;
    case 'ldr-characteristics':
      return <LDRCharacteristicsSimulation />;
    case 'solar-cell':
      return <SolarCellSimulation />;
    case 'pn-junction':
      return <PNJunctionSimulation />;
    case 'photocell':
      return <PhotocellSimulation />;
    case 'carrier-mobility':
      return <CarrierMobilitySimulation />;
    case 'fermi-function':
      return <FermiFunctionSimulation />;
    case 'optical-fiber':
      return <OpticalFiberSimulation />;
    case 'diode-iv':
      return <DiodeIVSimulation />;
    case 'xray-diffraction':
      return <XRayDiffractionSimulation />;
    default:
      return <div>Simulation not found for experiment ID: {experimentId}</div>;
  }
};

export default ExperimentSimulation;
