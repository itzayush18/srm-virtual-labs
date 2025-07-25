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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/post_office_box.png" alt="Post Office Box Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: Post Office Box experimental setup
  </p>
</div>
<div>
  <p class="text-block">
    The <span class="highlight">Wheatstone bridge principle</span> is used in the Post Office Box experiment as it allows the accurate determination of an unknown resistance by balancing voltages, not by directly measuring current or voltage drops. Wheatstone’s principle for balanced network
  </p>

  <p class="formula">P / Q = R / S</p>

  <p class="text-block">
   of the four resistances, if three are known and one is unknown, the unknown resistance can be calculated. This is essential for detecting small variations in resistance in semiconductors with temperature, which are used to determine the <span class="highlight">band gap energy</span>.
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
    k<sub>B</sub> – Boltzmann constant (8.617 × 10<sup>-5</sup> eV/K)<br>
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
    By experimentally determining the resistance R of the semiconductor at various temperatures and plotting ln(R) vs 1/T, the <span class="highlight">band gap energy</span> E<sub>g</sub> can be calculated from the slope of the linear graph.
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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/four_probe.png" alt="Four Probe Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: Four Probe experimental setup
  </p>
</div>
      <div>
      <p class="text-block">
        At a constant temperature, the resistance 𝑅 of a conductor is directly proportional to its length 𝐿 and inversely proportional to its cross-sectional area 𝐴:
      </p>
      <p class="formula">
        R = ρ × (L/A)
        </p>
      <p class="text-block">
        Here, 𝜌 is the resistivity of the material, measured in ohm-meters (Ω·m). In the four-probe method, the resistivity of the semiconductor can be calculated based on the sample thickness “W” and the distance between the probes “S”. The resistivity 𝜌 of a sample can be calculated using the relation:
        </p>
      <p class="formula">
        ρ = ρ<sub>0</sub>/(f(w/s))
        </p>
        <p class="text-block">
        Here, the function f(w/s) is a correction factor. It accounts for geometrical effects during measurement. We assume the metal probe tips are very small and the sample thickness is greater than the distance between the probes. The initial resistivity  ρ<sub>0</sub> is given by:
        </p>
        <p class="formula">
         ρ<sub>0</sub> = V/I (2πS)
         </p>
         <p class="text-block">
         where V is the measured voltage between the inner probes (in volts), I is the current passed through the outer probes (in amperes), and S is the distance between the probes (in meters).
         </p>
         <p class="text-block">
          At absolute zero temperature (0 K), the conduction band is empty since it lies above the Fermi level, and no thermal energy is available to excite electrons. However, as temperature increases, more electrons gain enough energy to jump into the conduction band. This increases the number of charge carriers, thus reducing the electrical resistivity of the semiconductor. Since resistivity is the inverse of conductivity, its variation with temperature can be expressed as: 
         </p>
         <p class="formula">
          ρ = A × exp(E<sub>g</sub> / (2k<sub>B</sub>T))
          </p>
          <p class='formula'>
            E<sub>g</sub> = 2k<sub>B</sub> × (2.303log<sub>10</sub>(ρ))/(1/T)
            </p>
          <p class="text-block">
            where:<br>
            ρ – Resistivity of the semiconductor<br>
            A – Constant<br>
            E<sub>g</sub> – Band gap energy of the material(in eV)<br>
            k<sub>B</sub> – Boltzmann constant (8.617 × 10<sup>-5</sup> eV/K)<br>
            T – Temperature (K)<br>
            This equation shows that the resistivity of a semiconductor increases exponentially as temperature decreases.
          </p>
          `,
      procedure: [
        'Choose a suitable given material for determining its resistivity and bandgap.',
        'Fix a value for current, probe spacing, and sample thickness with the help of the control slider.',
        'Vary the temperature and record the corresponding change in voltage.',
        'Plot the log₁₀(ρ)/(1/T) graph.',
        'Calculate the band gap by substituting the slope obtained from the graph in the given formula Eg = 2kB × (2.303 × log₁₀(ρ)) / (1/T).',
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
      theory:`
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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/vi_chars_ldr.png" alt="LDR Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: LDR experimental setup
  </p>
</div>
    <div>
    <p class="text-block">
      An <span class="highlight">LDR (Light Dependent Resistor)</span> is also known as a photo resistor. This works based on the principle of photoconductivity. When the light incident on the LDR material, the electrons are excited from the valence band to the conduction band. Thus, the number of free carriers increases, the electrical conductivity increases, and the resistance of the LDR tends to decrease.
    </p>

    <p class="text-block">
      Dark resistance is the resistance of an LDR or any photosensitive material in the absence of light. The dark resistance of the LDR normally ranges from a few kilo-ohms to several mega-ohms, depending on the type of material. 
    </p>

    <p class="text-block">
      The V-I characteristics of an LDR follow Ohm's law at a fixed illumination level:
      </p>
      <p class="formula">
        V = IR (or) R = (V/I)
      </p>
      <p class="text-block">
        where:<br>
        &nbsp;&nbsp;&nbsp;&nbsp;R – resistance<br>
        &nbsp;&nbsp;&nbsp;&nbsp;V – voltage<br>
        &nbsp;&nbsp;&nbsp;&nbsp;I – current<br>
      </p>
      </div>
      `,
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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/solar_cell.png" alt="Solar Cell Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: Solar Cell experimental setup
  </p>
</div>
    <div>
    <p class="text-block">
      A <span class="highlight">solar cell</span>, or photovoltaic cell, is a device that converts light energy directly into electricity through the photovoltaic effect. When light is absorbed by a semiconductor material in the solar cell, electron-hole pairs are generated, which can be separated by the built-in electric field at a p-n junction, producing a voltage and current.
    </p>
    <p class="text-block">
      The efficiency of the solar cell is measured as:
    </p>
      <p class="formula">
        η = (P<sub>max</sub> / AI<sub>0</sub>) × 100%
      </p>
      <p class="text-block">
        where:<br>
        &nbsp;&nbsp;&nbsp;&nbsp;η – Efficiency<br>
        &nbsp;&nbsp;&nbsp;&nbsp;P<sub>max</sub> – Maximum power output (W)<br>
        &nbsp;&nbsp;&nbsp;&nbsp;A – Area of the solar panel (m²)<br>
        &nbsp;&nbsp;&nbsp;&nbsp;I<sub>0</sub> – Intensity of the light (W/m²)
      </p>
      <p class="text-block">
        The maximum power of the solar cell can be calculated using the formula:
      </p>
      <p class="formula">
        P<sub>max</sub> = (V<sub>max</sub> × I<sub>max</sub>) watt
      </p>
      `,
      procedure: [
        'Connect the solar cell to the measurement circuit.',
        'Set the desired light intensity using the control slider.',
        'Vary the load resistance to measure the current and voltage at different operating points.',
        'Record the current and voltage values for each load resistance setting.',
        'Plot the I-V curve and V-R characteristics graph.',
        'Calculate the power at each operating point using Pₘₐₓ = (Vₘₐₓ × Iₘₐₓ) and identify the maximum power point. The efficiency of the solar cell can be found by substituting the obtained values in the given formula η = (Pₘₐₓ / AI₀) × 100%.',
        'Repeat the measurements for different light intensities to study the effect on cell performance.',
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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/pn_junction.png" alt="PN Junction Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: PN Junction experimental setup
  </p>
</div>
    <div>
    <p class="text-block">
      A <span class="highlight">PN junction diode</span> is a two-terminal semiconductor device formed by joining p-type and n-type semiconductor materials. At the junction, a depletion region forms due to the diffusion of charge carriers, creating a built-in electric field.
    </p>
    <p class="text-block">
      The current-voltage relationship of an ideal p-n junction diode is described by the Shockley diode equation: 
    </p>
      <p class="formula">
        I = I<sub>0</sub> × (exp(qV / nk<sub>B</sub>T) - 1)
      </p>
    <p class="text-block">
      where I is the diode current, I<sub>0</sub> is the reverse saturation current, q is the electron charge (1.602 × 10⁻¹⁹ C), V is the voltage across the diode, n is the ideality factor (1 for ideal diode), k<sub>B</sub> is Boltzmann's constant (1.381 × 10⁻²³ J/K), and T is the absolute temperature in Kelvin. 
      </p
       <p class="text-block">
       Under forward bias (positive voltage applied to the p-side), the depletion region narrows, which reduces the potential barrier and allows significant current flow. Under reverse bias (negative voltage applied to the p-side), the depletion region gets wider, resulting in an increase in the potential barrier and allowing only a small leakage current (saturation current). 
       </p>
       <p class="text-block">
        Key parameters of a diode include: Forward voltage drop (typically 0.7V for silicon, 0.3V for germanium), Reverse breakdown voltage, Reverse saturation current, Ideality factor.
        </p>
      </div>
      `,
      procedure: [
        'Connect the diode to the circuit setup with variable voltage source',
        'Start with zero bias and gradually increase the forward bias voltage',
        'Record the current at each voltage step',
        'Reverse the polarity and gradually increase the reverse bias voltage',
        'Record the current at each voltage step in reverse bias',
        'Plot the complete I-V characteristic curve',
        'Observe the depletion region visualization at different bias conditions',
        'Repeat the measurements at different temperatures to study temperature effects',
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
<div style="line-height:1.75; font-size:1.05rem; color:#1f2937">

      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
  <img src="/diagrams/photo_cell.png" alt="Photo Cell Diagram"
    style="max-width: 450px; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 0.95rem; color: #4b5563; margin-top: 0.5rem; text-align: center;">
    Figure: Photo Cell experimental setup
  </p>
</div>
    <div>
    <p class="text-block">
      A <span class="highlight">photocell</span> or photoelectric cell, is a device that converts light energy into electrical energy based on the photoelectric effect. A photocell is a solid-state device where a photosensitive cathode produces electrons when the light is illuminated, and an anode collects the emitted electrons. The illumination of light results in the excitation of electrons, which are attracted to the anode, producing a current proportional to the intensity of the illumination.
    </p>
    <p class="text-block">
      The photocurrent in a photocell is proportional to the light intensity:
      </p>
      <p class="formula">
        I = K(E-E<sub>0</sub>)
      </p>
      <p class="text-block">
        where I is the photocurrent, K is a constant that depends on the cell, E is the illumination intensity, and E<sub>0</sub> is the threshold illumination below which no photocurrent flows.
      </p>
      </div>
      `,
      procedure: [
        'Set up the photocell in the measurement circuit',
        'Adjust the light source to the desired wavelength using the monochromator',
        'Set the light intensity using the control slider',
        'By varying the temperature values, measure the photocurrent and voltage for a fixed wavelength.',
        'Plot the photocurrent vs. voltage spectral response curve.',
        'Repeat the measurements for different intensities of light',
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
      Carrier mobility is a measure of how quickly an electron or hole can move through a semiconductor when pulled by an electric field. It is defined as the proportionality constant between the drift velocity and the applied electric field:
      </p>
      <p class="formula">
        μ = vd / E
      </p>
  <p class="text-block">  
      Where:<br>
      &nbsp;&nbsp;&nbsp;&nbsp;μ – mobility (in cm²/V·s)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;vd – drift velocity (in cm/s)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;E – electric field (in V/cm)<br>
  </p>
      <p class="text-block">
      Mobility is affected by various scattering mechanisms:
      </p>
     <p class="text-block">
      1. Lattice scattering: Due to thermal vibrations of the crystal lattice (phonons)
      </p>
     <p class="text-block">
      2. Impurity scattering: Due to ionized impurities (dopants)
      </p>
     <p class="text-block">
      3. Carrier-carrier scattering: Due to interactions between charge carriers
      </p>
      <p class="text-block">
The temperature dependence of mobility due to lattice scattering follows:
      </p>
      <p class="formula">
        μL ∝ T^(-3/2)
      </p>
      <p class="text-block">
      The doping concentration dependence of mobility due to impurity scattering follows:
      </p>
      <p class="formula">
        μI ∝ N^(-1)
      </p>  
      <p class="text-block">
Where N is the doping concentration.
</p>
<p class="text-block">
The combined mobility (μ) considering both mechanisms follows Matthiessen's rule:
</p>
<p class="formula">
1/μ = 1/μL + 1/μI
</p>
<p class="text-block">
As doping concentration increases, impurity scattering becomes more significant, reducing mobility.
</p>
</div>
`,
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
      The Fermi-Dirac distribution function describes the probability of an energy state being occupied by an electron in a system of fermions at thermal equilibrium. It is given by:
        </p>
        <p class="formula">
f(E) = 1 / [1 + exp((E - EF)/kT)]
      </p>

      <p class="text-block">
        Where:<br>
      &nbsp;&nbsp;&nbsp;&nbsp;f(E) is the probability of occupation of an energy state E<br>
      &nbsp;&nbsp;&nbsp;&nbsp;EF is the Fermi energy level<br>
      &nbsp;&nbsp;&nbsp;&nbsp;k is Boltzmann's constant (8.617 × 10⁻⁵ eV/K)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;T is the absolute temperature in Kelvin<br>
      </p>
      
      <p class="text-block">
        The Fermi level (EF) represents the energy at which the probability of occupation is exactly 0.5.
      </p>
      
      <p class="text-block">
        In intrinsic semiconductors, the Fermi level lies approximately in the middle of the band gap. In doped semiconductors, the Fermi level shifts:
      </p>

      <p class="text-block">
        - For n-type semiconductors, it moves closer to the conduction band
      </p>

      <p class="text-block">
        - For p-type semiconductors, it moves closer to the valence band
      </p>

      <p class="text-block">
        The temperature dependence of the Fermi function is significant:
      </p>
      <p class="text-block">
        - At T = 0 K, the function is a step function (states below EF are filled, above are empty)
      </p>
      <p class="text-block">
        - As T increases, the function becomes smoother, with states near EF having partial occupancy probabilities
      </p>
      </div>
      `,
      
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
      theory:` 
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
    Optical fibers are waveguides that transmit light through total internal reflection. The attenuation (loss) in optical fibers is a measure of the decrease in optical power as light travels through the fiber, typically expressed in decibels per kilometer (dB/km).
    </p>
    <p class="text-block">
The attenuation coefficient (α) is given by:
</p>
<p class="formula">

α = (10/L) × log₁₀(Pin/Pout)
</p>

<p class="text-block">
Where:<br>
- α is the attenuation coefficient in dB/km<br>
- L is the fiber length in km<br>
- Pin is the input optical power<br>
- Pout is the output optical power<br>
</p>
<p class="text-block">
The main sources of attenuation in optical fibers are:
</p>
<p class="text-block">
1. Material absorption (intrinsic and extrinsic)
</p>
<p class="text-block">
2. Rayleigh scattering
</p>
<p class="text-block">
3. Waveguide imperfections
</p>
<p class="text-block">
4. Bending losses
</p>

<p class="text-block">
The attenuation spectrum varies with wavelength, with typical silica fibers having low attenuation windows around 850 nm, 1310 nm, and 1550 nm.
</p>
<p class="text-block">
Light propagation in an optical fiber depends on the fiber's numerical aperture (NA) and V-number. The numerical aperture is related to the acceptance angle (θmax) by:
</p>
<p class="formula">
NA = n₀ × sin(θmax) = √(n₁² - n₂²)
</p>
<p class="text-block">

Where:<br>
- n₀ is the refractive index of the surrounding medium<br>
- n₁ is the core refractive index<br>
- n₂ is the cladding refractive index<br>
</p>
</div>`,
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
      The current-voltage (I-V) characteristics of a diode can be modeled using the Shockley diode equation:
      </p>
      <p class="formula">
I = I<sub>s</sub> × [exp(qV/nkT) - 1]
      </p>
      <p class="text-block">
      Where:<br>
      &nbsp;&nbsp;&nbsp;&nbsp;I is the diode current<br>
      &nbsp;&nbsp;&nbsp;&nbsp;I<sub>s</sub> is the  reverse saturation current<br>
      &nbsp;&nbsp;&nbsp;&nbsp;q is the electron charge (1.602 × 10⁻¹⁹ C)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;V is the voltage across the diode<br>
      &nbsp;&nbsp;&nbsp;&nbsp;n is the ideality factor (1 for ideal diode, typically 1-2 for real diodes)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;k is Boltzmann's constant (1.381 × 10⁻²³ J/K)<br>
      &nbsp;&nbsp;&nbsp;T is the absolute temperature in Kelvin<br>
      </p>
      <p class="text-block">
The reverse saturation current I<sub>s</sub> depends on temperature and material properties:
      </p>
      <p class="formula">
I<sub>s</sub> = I<sub>s0</sub> × (T/T<sub>0</sub>)<sup>γ</sup> × exp[-(E<sub>g</sub>/k) × (1/T - 1/T<sub>0</sub>)]
      </p>
      <p class="text-block">
Where:<br>
- I<sub>s0</sub> is the saturation current at reference temperature T<sub>0</sub><br>
- γ is a constant (typically 3 for silicon)<br>
- E<sub>g</sub> is the band gap energy of the semiconductor<br>
- T<sub>0</sub> is the reference temperature (usually 300 K)<br>
</p>
      <p class="text-block">
The ideality factor n accounts for recombination in the depletion region and typically ranges from 1 to 2:
</p>
      <p class="text-block">
- n ≈ 1: Ideal diode (diffusion current dominates)<br>
- n ≈ 2: Non-ideal diode (recombination current dominates)
</p>
      <p class="text-block">
For real diodes, the I-V characteristics are also affected by series resistance (R<sub>s</sub>) and parallel resistance (R<sub>p</sub>):
      </p>
      <p class="formula">
I = I<sub>s</sub> × [exp(q(V-IR<sub>s</sub>)/nkT) - 1] + (V-IR<sub>s</sub>)/R<sub>p</sub>
      </p>
      </div>`,
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
      X-ray diffraction (XRD) is a powerful technique for determining the crystal structure and lattice parameters of materials. It is based on Bragg's law:
      </p>
      <p class="formula">
        nλ = 2d × sin(θ)
      </p>
      <p class="text-block">
Where:<br>
      &nbsp;&nbsp;&nbsp;&nbsp;n is the diffraction order (an integer)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;λ is the wavelength of the X-rays<br>
      &nbsp;&nbsp;&nbsp;&nbsp;d is the interplanar spacing<br>
      &nbsp;&nbsp;&nbsp;&nbsp;θ is the diffraction angle<br>
      </p>
      <p class="text-block">
For cubic crystals, the interplanar spacing d for planes with Miller indices (h,k,l) is related to the lattice constant a by:
      </p>
      <p class="formula">
d = a / √(h² + k² + l²)
      </p>
      <p class="text-block">
        Combining this with Bragg's law:
      </p>
      <p class="formula">
        sin²(θ) = (λ²/4a²) × (h² + k² + l²)
      </p>
      <p class="text-block">
By measuring the diffraction angles and knowing the X-ray wavelength, we can determine the lattice constant.
      </p>
      <p class="text-block">
The intensity of diffracted X-rays depends on:
1. The structure factor (atomic arrangement within the unit cell)
2. The multiplicity factor (number of equivalent planes)
3. The Lorentz-polarization factor
4. The temperature factor (Debye-Waller factor)
      </p>`,
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
