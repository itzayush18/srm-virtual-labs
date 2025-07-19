export interface Experiment {
  id: string;
  title: string;
  shortDescription: string;
  highlights: string[];
  imageUrl: string;
  sections: {
    theory: string;
    procedure: string[];
    selfEvaluation: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
    references: {
      title: string;
      link?: string;
    }[];
  };
}
export const experimentsList: Experiment[] = [
  {
    id: 'hall-coefficient',
    title: 'Determination of Hall Coefficient',
    imageUrl: '/Hall-effect.png',
    shortDescription: 'Investigate the Hall effect and determine the carrier type',
    highlights: [
      'Adjustable magnetic field',
      'Variable current settings',
      'Material selection',
      'Carrier type determination',
    ],
    sections: {
      theory: `
  <div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/hall_effect.png" alt="Hall effect Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: Hall effect experimental setup
  </p>
</div>

    <p>
      When a current-carrying conductor is placed in a transverse magnetic field, a potential difference is developed across the conductor in a direction perpendicular to both the current and the magnetic field. This phenomenon is called the <strong>Hall effect</strong>. It determines both the type and concentration of charge carriers in the given semiconductor sample.
    </p>

    <div style="background-color:#f3f4f6;padding:12px 16px;margin:1.5em 0;border-radius:8px;text-align:center;font-style:italic;border-left:4px solid #3b82f6">
      Hall coefficient (R<sub>H</sub>) = (V<sub>H</sub> × t) / (I × H) × 10<sup>8</sup> cm<sup>3</sup>C<sup>−1</sup>
    </div>

    <p>
      where V<sub>H</sub> = Hall voltage (volt), t = thickness of the sample (cm), I = current (ampere), H = magnetic field (gauss).
    </p>

    <p>
      Carrier density refers to the number of free charge carriers (electrons in n-type or holes in p-type semiconductors) per unit volume of the material. It can be calculated once the Hall coefficient (R<sub>H</sub>) is known using the relation:
    </p>

    <div style="text-align:center;margin:1.2em 0;font-style:italic">
      Carrier density (n) = 1 / (R<sub>H</sub> × q) carriers/cm<sup>3</sup>
    </div>

    <p>
      where R<sub>H</sub> = Hall coefficient (cm<sup>3</sup> C<sup>−1</sup>), q = charge of the electron or hole (1.6 × 10<sup>−19</sup> C).
    </p>

    <p>
      Carrier mobility is a measure of how quickly a charge carrier (electron or hole) can move through a semiconductor when subjected to an electric field. It reflects the ease with which carriers can drift and directly affects the material’s conductivity and response time in electronic devices.
    </p>

    <div style="text-align:center;margin:1.2em 0;font-style:italic">
      Carrier mobility (μ) = R<sub>H</sub>σ cm<sup>2</sup>V<sup>−1</sup>s<sup>−1</sup>
    </div>

    <p>
      where σ = conductivity (C V<sup>−1</sup>s<sup>−1</sup>cm<sup>−1</sup>).
    </p>
  </div>
`,

      procedure: [
        'Select the semiconductor material from the available options',
        'Set the desired current through the sample using the slider',
        'Apply a magnetic field perpendicular to the current using the field strength slider',
        'Observe the Hall voltage reading on the digital display',
        'Calculate the Hall coefficient using the formula: R_H = V_H × t / (I × B), where t is the sample thickness',
        'Determine the carrier type based on the sign of the Hall coefficient',
      ],
      selfEvaluation: [
        {
          question: 'What is the sign of the Hall coefficient for n-type semiconductors?',
          options: ['Positive', 'Negative', 'Zero', 'Depends on temperature'],
          correctAnswer: 1,
        },
        {
          question: 'What happens to the Hall voltage if the magnetic field strength is doubled?',
          options: [
            'It remains the same',
            'It doubles',
            'It becomes half',
            'It becomes four times',
          ],
          correctAnswer: 1,
        },
        {
          question: 'The Hall effect can be used to determine:',
          options: [
            'Only carrier type',
            'Only carrier concentration',
            'Both carrier type and concentration',
            'None of the above',
          ],
          correctAnswer: 2,
        },
      ],
      references: [
        {
          title: 'Principles of Semiconductor Devices by Sima Dimitrijev',
        },
        {
          title: 'Semiconductor Physics and Devices by Donald A. Neamen',
        },
      ],
    },
  },
  {
    id: 'band-gap',
    title: 'Band Gap Determination',
    shortDescription: 'Determine the band gap of semiconductor materials using a post office box',
    imageUrl: '/Post-office-box.png',
    highlights: [
      'Temperature control',
      'Resistance measurement',
      'ln(R) vs 1/T plotting',
      'Band gap calculation',
    ],
    sections: {
      theory: `
      <style>
  .formula {
    text-align: center;
    font-size: 1.3em;
    font-weight: 500;
    margin: 1em 0;
    font-family: 'Cambria Math', 'Times New Roman', serif;
  }

  .text-block {
    font-size: 1.05em;
    line-height: 1.6;
    text-align: justify;
    margin: 0.8em 0;
  }

  .highlight {
    font-weight: bold;
  }
</style>

<div>
  <p class="text-block">
    The <span class="highlight">Wheatstone bridge principle</span> is used in the Post Office Box experiment as it allows the accurate determination of an unknown resistance by balancing voltages, not by directly measuring current or voltage drops. Wheatstone’s condition for a balanced network is:
  </p>

  <p class="formula">P / Q = R / S</p>

  <p class="text-block">
    Among the four resistances, if three are known and one is unknown, the unknown resistance can be calculated. This is essential for detecting small variations in resistance in semiconductors with temperature, which are used to determine the <span class="highlight">band gap energy</span>.
  </p>

  <p class="text-block">
    The band gap of a semiconductor is the energy difference between the top of the valence band and the bottom of the conduction band. It represents the minimum energy required to excite an electron from the valence band to the conduction band, enabling electrical conduction.
  </p>

  <p class="text-block">
    In intrinsic semiconductors, the resistivity is highly temperature-dependent and follows an exponential relationship:
  </p>

  <p class="formula">
    ρ = ρ<sub>0</sub> × exp( E<sub>g</sub> / 2k<sub>B</sub>T )
  </p>

  <p class="text-block">
    where:<br>
    ρ – resistivity<br>
    ρ<sub>0</sub> – material-dependent constant<br>
    E<sub>g</sub> – band gap energy (in eV)<br>
    k<sub>B</sub> – Boltzmann constant (8.617 × 10<sup>−5</sup> eV/K)<br>
    T – absolute temperature in Kelvin
  </p>

  <p class="text-block">Taking the natural logarithm on both sides:</p>

  <p class="formula">ln(ρ) = ln(ρ<sub>0</sub>) + ( E<sub>g</sub> / 2kT )</p>

  <p class="text-block">Since resistance R is proportional to resistivity ρ for a given sample, we can write:</p>

  <p class="formula">ln(R) = ln(R<sub>0</sub>) + ( E<sub>g</sub> / 2kT )</p>

  <p class="text-block">
    Thus, a plot of ln(R) versus 1/T yields a straight line, whose slope is equal to:
  </p>

  <p class="formula">
    slope = E<sub>g</sub> / 2k &nbsp;&nbsp;&nbsp;&nbsp;⇒&nbsp;&nbsp;&nbsp;&nbsp; E<sub>g</sub> = 2k × slope
  </p>

  <p class="text-block">
    By experimentally determining the resistance R of the semiconductor at various temperatures and plotting ln(R) vs 1/T, the <span class="highlight">band gap energy</span> E<sub>g</sub> can be calculated from the slope of the graph.
  </p>
</div>
`,
      procedure: [
        'Set up the post office box configuration',
        'Adjust the temperature controller to set the semiconductor sample to different temperatures',
        'Measure the resistance at each temperature',
        'Record the resistance values and corresponding temperatures',
        'Plot ln(R) against 1/T (in Kelvin)',
        "Calculate the slope of the line and determine the band gap using the formula: Eg = 2k × slope, where k is Boltzmann's constant",
      ],
      selfEvaluation: [
        {
          question: 'In the equation ln(R) = ln(R₀) + Eg/2kT, what does k represent?',
          options: ['Kelvin', 'Kinetic energy', "Boltzmann's constant", 'Wave vector'],
          correctAnswer: 2,
        },
        {
          question: 'What is the expected trend when plotting ln(R) vs 1/T for a semiconductor?',
          options: ['Horizontal line', 'Vertical line', 'Positive slope', 'Negative slope'],
          correctAnswer: 2,
        },
        {
          question: 'The unit of band gap energy is typically expressed in:',
          options: ['Joules', 'Electron volts (eV)', 'Kelvin', 'Amperes'],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Solid State Physics by N.W. Ashcroft and N.D. Mermin',
        },
        {
          title: 'Semiconductor Material and Device Characterization by Dieter K. Schroder',
        },
      ],
    },
  },
  {
    id: 'four-probe',
    title: 'Four-Probe Method',
    shortDescription: 'Measure resistivity of semiconductor materials using the four-probe method',
    imageUrl: '/Four-probe-method.png',
    highlights: [
      'Adjustable probe spacing',
      'Material selection',
      'Contact-less measurement',
      'Temperature effects',
    ],
    sections: {
      theory: `The four-probe method is a technique used to measure the resistivity of semiconductor materials. It overcomes the limitations of two-probe methods by eliminating the effects of contact resistance, spreading resistance, and other parasitic resistances.

In this method, four sharp metal probes are placed in a straight line on the sample surface with equal spacing. A constant current is passed through the outer two probes, and the voltage is measured between the inner two probes. Since the voltmeter has a high input impedance, negligible current flows through the voltage probes, eliminating the effect of contact resistance.

For a thin sheet of semiconductor material, the resistivity ρ is given by:

ρ = 2πs × (V/I) × CF

Where:
- s is the probe spacing
- V is the measured voltage
- I is the applied current
- CF is a correction factor that depends on the sample dimensions and probe configuration

For a semi-infinite sample (thickness much greater than probe spacing), CF = 1, and for very thin samples (thickness much less than probe spacing), CF = (π/ln(2)).`,
      procedure: [
        'Place the semiconductor sample on the measurement platform',
        'Adjust the four probes to make good contact with the sample, maintaining equal spacing',
        'Set the desired current using the current source control',
        'Measure the voltage between the inner two probes using the voltmeter',
        'Calculate the resistivity using the formula: ρ = 2πs × (V/I) × CF, where s is the probe spacing',
        'Repeat the measurement at different locations or with different probe spacings to confirm the results',
      ],
      selfEvaluation: [
        {
          question:
            'Why is the four-probe method preferred over the two-probe method for resistivity measurements?',
          options: [
            "It's easier to set up",
            'It eliminates contact resistance effects',
            'It requires less equipment',
            'It works at higher temperatures',
          ],
          correctAnswer: 1,
        },
        {
          question: 'In the four-probe method, current is passed through:',
          options: [
            'All four probes',
            'Only the inner two probes',
            'Only the outer two probes',
            'Alternating pairs of probes',
          ],
          correctAnswer: 2,
        },
        {
          question: 'How does probe spacing affect the measured resistivity in a four-probe setup?',
          options: [
            'It has no effect',
            'Resistivity is directly proportional to spacing',
            'Resistivity is inversely proportional to spacing',
            'The relationship is non-linear',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Semiconductor Measurements and Instrumentation by W.R. Runyan',
        },
        {
          title: 'Electronic Properties of Materials by Rolf E. Hummel',
        },
      ],
    },
  },
  {
    id: 'ldr-characteristics',
    title: 'V-I Characteristics of LDR',
    shortDescription: 'Study the voltage-current characteristics of a light-dependent resistor',
    imageUrl: '/LDR.png',
    highlights: [
      'Adjustable light intensity',
      'Real-time V-I curve plotting',
      'Resistance vs illumination analysis',
      'Temperature effects',
    ],
    sections: {
      theory: `A Light Dependent Resistor (LDR) or photoresistor is a light-controlled variable resistor. The resistance of an LDR decreases with increasing incident light intensity. This property makes LDRs useful in light-sensing applications.

The relationship between resistance and illumination for an LDR typically follows a power law:

R = R₀ × (E₀/E)^γ

Where:
- R is the resistance at illumination E
- R₀ is the resistance at reference illumination E₀
- γ is a constant characteristic of the particular LDR material (typically between 0.5 and 0.8)

The V-I characteristics of an LDR follow Ohm's law at a fixed illumination level:

V = I × R

However, as the illumination changes, the resistance changes, resulting in a family of V-I curves for different illumination levels.`,
      procedure: [
        'Connect the LDR to the circuit setup with variable voltage source',
        'Set the light source at a specific intensity using the control slider',
        'Vary the applied voltage in small increments and record the corresponding current',
        'Repeat the measurements for different light intensities',
        'Plot the V-I curves for each light intensity',
        'Calculate the resistance at each operating point using R = V/I',
        'Plot the resistance vs. illumination curve to determine the sensitivity of the LDR',
      ],
      selfEvaluation: [
        {
          question: 'How does the resistance of an LDR change with increasing light intensity?',
          options: ['Increases', 'Decreases', 'Remains constant', 'First increases then decreases'],
          correctAnswer: 1,
        },
        {
          question: 'Which of the following materials is commonly used in LDRs?',
          options: ['Silicon', 'Germanium', 'Cadmium Sulfide (CdS)', 'Gallium Arsenide (GaAs)'],
          correctAnswer: 2,
        },
        {
          question:
            'What is the mathematical relationship between resistance and illumination for an LDR?',
          options: [
            'Linear relationship',
            'Logarithmic relationship',
            'Exponential relationship',
            'Power law relationship',
          ],
          correctAnswer: 3,
        },
      ],
      references: [
        {
          title: 'Photonic Devices by Jia-Ming Liu',
        },
        {
          title: 'Fundamentals of Photonics by B.E.A. Saleh and M.C. Teich',
        },
      ],
    },
  },
  {
    id: 'solar-cell',
    title: 'Solar Cell Characteristics',
    shortDescription: 'Study V-I characteristics and efficiency of a solar cell',
    imageUrl: '/Solar-Cell.jpg',
    highlights: [
      'Adjustable light intensity',
      'Load resistance variation',
      'Efficiency calculation',
      'Maximum power point tracking',
    ],
    sections: {
      theory: `A solar cell, or photovoltaic cell, is a device that converts light energy directly into electricity through the photovoltaic effect. When light is absorbed by a semiconductor material, electron-hole pairs are generated, which can be separated by the built-in electric field at a p-n junction, creating a voltage and current.

The I-V characteristic of a solar cell can be modeled by:

I = IL - I0 × [exp(qV/nkT) - 1]

Where:
- I is the output current
- IL is the light-generated current
- I0 is the saturation current
- q is the electron charge
- V is the voltage
- n is the ideality factor
- k is Boltzmann's constant
- T is the temperature in Kelvin

Key parameters of a solar cell include:
- Short-circuit current (Isc): The current when the voltage is zero
- Open-circuit voltage (Voc): The voltage when the current is zero
- Fill factor (FF): The ratio of maximum power to the product of Voc and Isc
- Efficiency (η): The ratio of output electrical power to input light power

The efficiency is calculated as:
η = (Pmax/Pin) × 100% = (Vmp × Imp/Pin) × 100%

Where:
- Pmax is the maximum power output
- Pin is the incident light power
- Vmp and Imp are the voltage and current at maximum power point`,
      procedure: [
        'Connect the solar cell to the measurement circuit',
        'Set the desired light intensity using the control slider',
        'Vary the load resistance to measure the current and voltage at different operating points',
        'Record the current and voltage values for each load resistance setting',
        'Plot the I-V curve and identify the short-circuit current (Isc) and open-circuit voltage (Voc)',
        'Calculate the power at each operating point using P = V × I and identify the maximum power point',
        'Calculate the fill factor and efficiency of the solar cell',
        'Repeat the measurements for different light intensities to study the effect on cell performance',
      ],
      selfEvaluation: [
        {
          question: 'What is the fill factor of a solar cell?',
          options: [
            'The ratio of maximum power to the product of Voc and Isc',
            'The ratio of output power to input power',
            'The ratio of Voc to Isc',
            'The maximum efficiency possible',
          ],
          correctAnswer: 0,
        },
        {
          question:
            'How does increasing light intensity affect the short-circuit current of a solar cell?',
          options: [
            'It decreases',
            'It increases',
            'It remains constant',
            'It first increases then decreases',
          ],
          correctAnswer: 1,
        },
        {
          question: 'The maximum power point of a solar cell is found at:',
          options: [
            'Short-circuit current',
            'Open-circuit voltage',
            'The point where the product V×I is maximum',
            'The point where resistance is minimum',
          ],
          correctAnswer: 2,
        },
      ],
      references: [
        {
          title: 'Physics of Semiconductor Devices by S.M. Sze',
        },
        {
          title:
            'Solar Cells: Operating Principles, Technology and System Applications by Martin A. Green',
        },
      ],
    },
  },
  {
    id: 'pn-junction',
    title: 'PN Junction Diode Characteristics',
    shortDescription:
      'Study the characteristics of PN junction diodes under forward and reverse bias',
    imageUrl: '/PN-junction-diode.png',
    highlights: [
      'Depletion region visualization',
      'Temperature effects',
      'Breakdown voltage study',
      'Diode parameters extraction',
    ],
    sections: {
      theory: `A p-n junction diode is formed by joining p-type and n-type semiconductor materials. At the junction, a depletion region forms due to diffusion of charge carriers, creating a built-in electric field.

The current-voltage relationship of an ideal p-n junction diode is described by the Shockley diode equation:

I = I₀ × [exp(qV/nkT) - 1]

Where:
- I is the diode current
- I₀ is the reverse saturation current
- q is the electron charge (1.602 × 10⁻¹⁹ C)
- V is the voltage across the diode
- n is the ideality factor (1 for ideal diode)
- k is Boltzmann's constant (1.381 × 10⁻²³ J/K)
- T is the absolute temperature in Kelvin

Under forward bias (positive voltage applied to p-side), the depletion region narrows, reducing the potential barrier and allowing significant current flow. Under reverse bias (negative voltage applied to p-side), the depletion region widens, increasing the potential barrier and allowing only a small leakage current (saturation current).

Key parameters of a diode include:
- Forward voltage drop (typically 0.7V for silicon, 0.3V for germanium)
- Reverse breakdown voltage
- Reverse saturation current
- Ideality factor`,
      procedure: [
        'Connect the diode to the circuit setup with variable voltage source',
        'Start with zero bias and gradually increase the forward bias voltage',
        'Record the current at each voltage step',
        'Reverse the polarity and gradually increase the reverse bias voltage',
        'Record the current at each voltage step in reverse bias',
        'Plot the complete I-V characteristic curve',
        'Observe the depletion region visualization at different bias conditions',
        'Repeat the measurements at different temperatures to study temperature effects',
        'Extract diode parameters such as saturation current and ideality factor from the measurements',
      ],
      selfEvaluation: [
        {
          question:
            'What happens to the depletion region width when a p-n junction diode is forward biased?',
          options: ['Increases', 'Decreases', 'Remains unchanged', 'Disappears completely'],
          correctAnswer: 1,
        },
        {
          question: 'The reverse saturation current in a p-n junction diode is primarily due to:',
          options: [
            'Majority carrier drift',
            'Majority carrier diffusion',
            'Minority carrier drift',
            'Minority carrier diffusion',
          ],
          correctAnswer: 3,
        },
        {
          question: 'How does temperature affect the forward voltage drop of a silicon diode?',
          options: [
            'Increases with temperature',
            'Decreases with temperature',
            'Remains constant with temperature',
            'First increases then decreases with temperature',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Semiconductor Physics and Devices by Donald A. Neamen',
        },
        {
          title: 'Solid State Electronic Devices by Ben G. Streetman and Sanjay Banerjee',
        },
      ],
    },
  },
  {
    id: 'photocell',
    title: 'Photocell Characteristics',
    shortDescription: 'Study illumination and V-I characteristics of a photocell',
    imageUrl: '/photo-cell.png',
    highlights: [
      'Adjustable light wavelength',
      'Variable light intensity',
      'Spectral response analysis',
      'Quantum efficiency calculation',
    ],
    sections: {
      theory: `A photocell, or photoelectric cell, is a device that converts light energy into electrical energy based on the photoelectric effect. When light with sufficient energy (above the work function of the material) strikes the photosensitive surface, electrons are emitted and can be collected to generate a current.

The photocurrent in a photocell is proportional to the light intensity:

I = K × (E - E₀)

Where:
- I is the photocurrent
- K is a constant that depends on the cell
- E is the illumination intensity
- E₀ is the threshold illumination below which no photocurrent flows

The spectral response of a photocell varies with the wavelength of incident light. The quantum efficiency (η) of a photocell is defined as the ratio of the number of electrons generated to the number of incident photons:

η = Number of electrons generated / Number of incident photons

The incident light energy must be greater than the work function (φ) of the photosensitive material to produce photoemission:

hv > φ

Where:
- h is Planck's constant
- v is the frequency of the incident light
- φ is the work function of the material`,
      procedure: [
        'Set up the photocell in the measurement circuit',
        'Adjust the light source to the desired wavelength using the monochromator',
        'Set the light intensity using the control slider',
        'Measure the photocurrent at different light intensities for a fixed wavelength',
        'Plot the photocurrent vs. light intensity curve',
        'Repeat the measurements for different wavelengths of light',
        'Plot the spectral response curve (photocurrent vs. wavelength) at constant intensity',
        'Calculate the quantum efficiency at different wavelengths',
        'Determine the threshold frequency and work function of the photosensitive material',
      ],
      selfEvaluation: [
        {
          question: 'The photoelectric effect occurs when:',
          options: [
            'Electrons absorb thermal energy and escape',
            'Electrons absorb light energy and escape',
            'Protons absorb light energy and escape',
            'Neutrons absorb light energy and escape',
          ],
          correctAnswer: 1,
        },
        {
          question:
            "According to Einstein's photoelectric equation, the maximum kinetic energy of emitted electrons depends on:",
          options: [
            'Only the intensity of light',
            'Only the frequency of light',
            'Both intensity and frequency of light',
            'Neither intensity nor frequency of light',
          ],
          correctAnswer: 1,
        },
        {
          question: 'The quantum efficiency of a photocell is defined as:',
          options: [
            'The ratio of output power to input power',
            'The ratio of electrons generated to incident photons',
            'The ratio of output current to input voltage',
            'The ratio of input current to output voltage',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Optoelectronics: An Introduction by J. Wilson and J.F.B. Hawkes',
        },
        {
          title: 'Introduction to Solid State Physics by Charles Kittel',
        },
      ],
    },
  },
  {
    id: 'carrier-mobility',
    title: 'Electron and Hole Mobility',
    shortDescription: 'Study electron and hole mobility vs doping concentration',
    imageUrl: '/Electron-and-hole-mobility.png',
    highlights: [
      'Doping concentration variation',
      'Temperature dependence',
      'Scattering mechanisms',
      'Mobility calculation',
    ],
    sections: {
      theory: `Carrier mobility is a measure of how quickly an electron or hole can move through a semiconductor when pulled by an electric field. It is defined as the proportionality constant between the drift velocity and the applied electric field:

μ = vd / E

Where:
- μ is the mobility (in cm²/V·s)
- vd is the drift velocity (in cm/s)
- E is the electric field (in V/cm)

Mobility is affected by various scattering mechanisms:
1. Lattice scattering: Due to thermal vibrations of the crystal lattice (phonons)
2. Impurity scattering: Due to ionized impurities (dopants)
3. Carrier-carrier scattering: Due to interactions between charge carriers

The temperature dependence of mobility due to lattice scattering follows:
μL ∝ T^(-3/2)

The doping concentration dependence of mobility due to impurity scattering follows:
μI ∝ N^(-1)

Where N is the doping concentration.

The combined mobility (μ) considering both mechanisms follows Matthiessen's rule:
1/μ = 1/μL + 1/μI

As doping concentration increases, impurity scattering becomes more significant, reducing mobility.`,
      procedure: [
        'Select the semiconductor material (Si, Ge, or GaAs)',
        'Set the desired doping concentration using the slider',
        'Choose the dopant type (n-type or p-type)',
        'Adjust the temperature if studying temperature effects',
        'Calculate the electron and hole mobilities based on the selected parameters',
        'Plot the mobility vs. doping concentration curve',
        'Repeat the calculations for different temperatures to observe temperature dependence',
        'Compare the mobility values with theoretical models and experimental data',
      ],
      selfEvaluation: [
        {
          question:
            'How does electron mobility in silicon compare to hole mobility at the same doping level?',
          options: [
            'Electron mobility is lower',
            'Electron mobility is higher',
            'They are exactly the same',
            'It depends on temperature only',
          ],
          correctAnswer: 1,
        },
        {
          question: 'As doping concentration increases, carrier mobility generally:',
          options: ['Increases', 'Decreases', 'Remains constant', 'First increases then decreases'],
          correctAnswer: 1,
        },
        {
          question: 'The dominant scattering mechanism limiting mobility at high temperatures is:',
          options: [
            'Ionized impurity scattering',
            'Lattice (phonon) scattering',
            'Carrier-carrier scattering',
            'Surface scattering',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Semiconductor Physics and Devices by Donald A. Neamen',
        },
        {
          title:
            'Fundamentals of Semiconductor Devices by Betty Lise Anderson and Richard L. Anderson',
        },
      ],
    },
  },
  {
    id: 'fermi-function',
    title: 'Fermi Function Determination',
    shortDescription:
      'Visualize and study the Fermi-Dirac distribution function at different temperatures',
    imageUrl: '/Fermi-function.png',
    highlights: [
      'Temperature variation',
      'Interactive visualization',
      'Energy level adjustment',
      'Semiconductor doping effects',
    ],
    sections: {
      theory: `The Fermi-Dirac distribution function describes the probability of an energy state being occupied by an electron in a system of fermions at thermal equilibrium. It is given by:

f(E) = 1 / [1 + exp((E - EF)/kT)]

Where:
- f(E) is the probability of occupation of an energy state E
- EF is the Fermi energy level
- k is Boltzmann's constant (8.617 × 10⁻⁵ eV/K)
- T is the absolute temperature in Kelvin

The Fermi level (EF) represents the energy at which the probability of occupation is exactly 0.5.

In intrinsic semiconductors, the Fermi level lies approximately in the middle of the band gap. In doped semiconductors, the Fermi level shifts:
- For n-type semiconductors, it moves closer to the conduction band
- For p-type semiconductors, it moves closer to the valence band

The temperature dependence of the Fermi function is significant:
- At T = 0 K, the function is a step function (states below EF are filled, above are empty)
- As T increases, the function becomes smoother, with states near EF having partial occupancy probabilities`,
      procedure: [
        'Select the semiconductor material (Si, Ge, or GaAs)',
        'Set the doping type (intrinsic, n-type, or p-type) and concentration',
        'Adjust the temperature using the slider',
        'Observe the Fermi-Dirac distribution function plotted against energy',
        'Note the position of the Fermi level relative to the band edges',
        'Study how the distribution changes with increasing temperature',
        'Compare the carrier concentration in conduction and valence bands at different temperatures',
        'Calculate the carrier concentrations using the Fermi function and density of states',
      ],
      selfEvaluation: [
        {
          question: 'At what energy level is the Fermi function value exactly 0.5?',
          options: [
            'At the conduction band edge',
            'At the valence band edge',
            'At the Fermi energy level',
            'At the middle of the band gap',
          ],
          correctAnswer: 2,
        },
        {
          question: 'How does the Fermi function change as temperature increases?',
          options: [
            'It becomes steeper at the Fermi level',
            'It becomes more gradual (less steep) around the Fermi level',
            'It remains unchanged with temperature',
            'It shifts to higher energies without changing shape',
          ],
          correctAnswer: 1,
        },
        {
          question: 'In an n-type semiconductor, where is the Fermi level located?',
          options: [
            'Below the valence band',
            'In the middle of the band gap',
            'Closer to the conduction band',
            'Closer to the valence band',
          ],
          correctAnswer: 2,
        },
      ],
      references: [
        {
          title: 'Solid State Physics by Neil W. Ashcroft and N. David Mermin',
        },
        {
          title: 'Principles of Electronic Materials and Devices by S.O. Kasap',
        },
      ],
    },
  },
  {
    id: 'optical-fiber',
    title: 'Optical Fiber Attenuation',
    shortDescription: 'Study attenuation and propagation in optical fiber cables',
    imageUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
    highlights: [
      'Light propagation visualization',
      'Attenuation calculation',
      'Wavelength dependence',
      'Fiber parameter adjustment',
    ],
    sections: {
      theory: `Optical fibers are waveguides that transmit light through total internal reflection. The attenuation (loss) in optical fibers is a measure of the decrease in optical power as light travels through the fiber, typically expressed in decibels per kilometer (dB/km).

The attenuation coefficient (α) is given by:

α = (10/L) × log₁₀(Pin/Pout)

Where:
- α is the attenuation coefficient in dB/km
- L is the fiber length in km
- Pin is the input optical power
- Pout is the output optical power

The main sources of attenuation in optical fibers are:
1. Material absorption (intrinsic and extrinsic)
2. Rayleigh scattering
3. Waveguide imperfections
4. Bending losses

The attenuation spectrum varies with wavelength, with typical silica fibers having low attenuation windows around 850 nm, 1310 nm, and 1550 nm.

Light propagation in an optical fiber depends on the fiber's numerical aperture (NA) and V-number. The numerical aperture is related to the acceptance angle (θmax) by:

NA = n₀ × sin(θmax) = √(n₁² - n₂²)

Where:
- n₀ is the refractive index of the surrounding medium
- n₁ is the core refractive index
- n₂ is the cladding refractive index`,
      procedure: [
        'Select the fiber type (single-mode or multi-mode)',
        'Set the wavelength of light using the slider',
        'Adjust the fiber parameters (core diameter, NA, etc.)',
        'Visualize the light propagation in the fiber',
        'Measure the input and output power for different fiber lengths',
        'Calculate the attenuation coefficient using the formula: α = (10/L) × log₁₀(Pin/Pout)',
        'Plot the attenuation vs. wavelength curve',
        'Study the effect of bending on attenuation by adjusting the bend radius',
      ],
      selfEvaluation: [
        {
          question:
            'Which of the following wavelengths typically has the lowest attenuation in silica optical fibers?',
          options: ['850 nm', '1310 nm', '1550 nm', '2000 nm'],
          correctAnswer: 2,
        },
        {
          question: 'Rayleigh scattering in optical fibers is proportional to:',
          options: ['λ⁴', 'λ²', '1/λ²', '1/λ⁴'],
          correctAnswer: 3,
        },
        {
          question: 'The numerical aperture (NA) of an optical fiber is related to:',
          options: [
            'Core diameter only',
            'The maximum acceptance angle of light entering the fiber',
            'The wavelength of transmitted light only',
            'The fiber length',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Fiber-Optic Communication Systems by Govind P. Agrawal',
        },
        {
          title: 'Optical Fiber Communications: Principles and Practice by John M. Senior',
        },
      ],
    },
  },
  {
    id: 'diode-iv',
    title: 'Diode I-V Characteristics',
    shortDescription: 'Study I-V characteristics of diodes using computational tools',
    imageUrl: '/Diode-Charcteristic.png',
    highlights: [
      'Parameter inputs',
      'Automatic plotting',
      'Temperature variation',
      'Multiple diode comparison',
    ],
    sections: {
      theory: `The current-voltage (I-V) characteristics of a diode can be modeled using the Shockley diode equation:

I = Is × [exp(qV/nkT) - 1]

Where:
- I is the diode current
- Is is the reverse saturation current
- q is the electron charge (1.602 × 10⁻¹⁹ C)
- V is the voltage across the diode
- n is the ideality factor (1 for ideal diode, typically 1-2 for real diodes)
- k is Boltzmann's constant (1.381 × 10⁻²³ J/K)
- T is the absolute temperature in Kelvin

The reverse saturation current Is depends on temperature and material properties:

Is = Is0 × (T/T0)^γ × exp[-(Eg/k) × (1/T - 1/T0)]

Where:
- Is0 is the saturation current at reference temperature T0
- γ is a constant (typically 3 for silicon)
- Eg is the band gap energy of the semiconductor

The ideality factor n accounts for recombination in the depletion region and typically ranges from 1 to 2:
- n ≈ 1: Ideal diode (diffusion current dominates)
- n ≈ 2: Non-ideal diode (recombination current dominates)

For real diodes, the I-V characteristics are also affected by series resistance (Rs) and parallel resistance (Rp):

I = Is × [exp(q(V-IRs)/nkT) - 1] + (V-IRs)/Rp`,
      procedure: [
        'Select the diode type from available options (Si, Ge, Schottky, etc.)',
        'Set diode parameters: saturation current (Is), ideality factor (n), series resistance (Rs), etc.',
        'Set the temperature using the temperature control',
        'Define the voltage range for analysis',
        'Run the simulation to calculate and plot the I-V curve',
        'Observe the forward and reverse characteristics',
        'Analyze the effects of changing parameters on the I-V characteristics',
        'Compare the computational results with theoretical models',
      ],
      selfEvaluation: [
        {
          question: 'What is the ideality factor for an ideal diode?',
          options: ['0', '1', '2', 'Infinity'],
          correctAnswer: 1,
        },
        {
          question:
            'How does an increase in temperature affect the forward voltage drop of a silicon diode at constant current?',
          options: [
            'Increases',
            'Decreases',
            'Remains unchanged',
            'First increases then decreases',
          ],
          correctAnswer: 1,
        },
        {
          question: 'Which of the following diode types has the lowest forward voltage drop?',
          options: ['Silicon diode', 'Germanium diode', 'Schottky diode', 'Light-emitting diode'],
          correctAnswer: 2,
        },
      ],
      references: [
        {
          title: 'Semiconductor Physics and Devices by Donald A. Neamen',
        },
        {
          title: 'Microelectronic Circuits by Adel S. Sedra and Kenneth C. Smith',
        },
      ],
    },
  },
  {
    id: 'xray-diffraction',
    title: 'Lattice Cell Parameters',
    shortDescription: 'Calculate lattice cell parameters using X-ray diffraction',
    imageUrl: 'Lattice-cell-parameter.png',
    highlights: [
      'Crystal structure visualization',
      'Diffraction pattern simulation',
      "Bragg's law application",
      'Lattice constant calculation',
    ],
    sections: {
      theory: `X-ray diffraction (XRD) is a powerful technique for determining the crystal structure and lattice parameters of materials. It is based on Bragg's law:

nλ = 2d × sin(θ)

Where:
- n is an integer (the diffraction order)
- λ is the wavelength of the X-rays
- d is the interplanar spacing
- θ is the diffraction angle

For cubic crystals, the interplanar spacing d for planes with Miller indices (h,k,l) is related to the lattice constant a by:

d = a / √(h² + k² + l²)

Combining this with Bragg's law:

sin²(θ) = (λ²/4a²) × (h² + k² + l²)

By measuring the diffraction angles and knowing the X-ray wavelength, we can determine the lattice constant.

The intensity of diffracted X-rays depends on:
1. The structure factor (atomic arrangement within the unit cell)
2. The multiplicity factor (number of equivalent planes)
3. The Lorentz-polarization factor
4. The temperature factor (Debye-Waller factor)`,
      procedure: [
        'Select the crystal structure (simple cubic, body-centered cubic, face-centered cubic, etc.)',
        'Set the material parameters (atomic radius, bond length, etc.)',
        'Choose the X-ray source and wavelength (Cu Kα, Mo Kα, etc.)',
        'Visualize the crystal structure in 3D',
        'Simulate the X-ray diffraction pattern',
        'Identify the peaks in the diffraction pattern and their corresponding planes (Miller indices)',
        "Calculate the interplanar spacing from the diffraction angles using Bragg's law",
        'Determine the lattice constants and other structural parameters',
      ],
      selfEvaluation: [
        {
          question: "Bragg's law relates which of the following?",
          options: [
            'X-ray wavelength, interplanar spacing, and diffraction angle',
            'Lattice constant, atomic radius, and bond angle',
            'Unit cell volume, atomic weight, and density',
            'Crystal symmetry, atomic number, and thermal expansion',
          ],
          correctAnswer: 0,
        },
        {
          question:
            "For a cubic crystal, how does the lattice parameter 'a' relate to the interplanar spacing 'd' for planes with Miller indices (h,k,l)?",
          options: [
            'a = d',
            'a = d × √(h² + k² + l²)',
            'a = d / √(h² + k² + l²)',
            'a = d × (h + k + l)',
          ],
          correctAnswer: 1,
        },
        {
          question:
            'Which of the following would NOT produce a diffraction peak in a body-centered cubic (BCC) crystal?',
          options: [
            'Planes with h+k+l = even',
            'Planes with h+k+l = odd',
            'Planes with all indices even',
            'Planes with all indices odd',
          ],
          correctAnswer: 1,
        },
      ],
      references: [
        {
          title: 'Elements of X-ray Diffraction by B.D. Cullity and S.R. Stock',
        },
        {
          title: 'Introduction to Solid State Physics by Charles Kittel',
        },
      ],
    },
  },
];
