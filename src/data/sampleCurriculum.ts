export interface SampleTopic {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  tag: string;
  notesText: string;
  sampleQuestionPaper?: string;
  sampleStudentAnswerSheet?: string;
}

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    id: 'cbse-10-electricity',
    title: 'Electricity & Ohm’s Law (CBSE Class 10)',
    subject: 'Science (Physics)',
    classLevel: 'Class 10 (CBSE/State)',
    tag: 'Board Exam Hot Topic ⚡',
    notesText: `Chapter: Electricity
1. Electric Current (I): The rate of flow of electric charge (Q) through a conductor.
Formula: I = Q / t (Unit: Ampere (A)). 1 Ampere = 1 Coulomb / 1 Second.
Current is measured using an Ammeter, which is always connected in series in a circuit.

2. Electric Potential Difference (V): The work done (W) to move a unit positive charge from one point to another.
Formula: V = W / Q (Unit: Volt (V)). 1 Volt = 1 Joule / 1 Coulomb.
Measured using a Voltmeter, connected in parallel.

3. Ohm’s Law (1827 - Georg Simon Ohm):
At constant temperature, the current (I) flowing through a conductor is directly proportional to the potential difference (V) across its ends.
V ∝ I  =>  V = I * R, where R is the resistance of the conductor in Ohms (Ω).

4. Factors on which Resistance depends:
R = ρ * (L / A)
- Length of wire (L): Directly proportional
- Area of cross-section (A): Inversely proportional
- Material resistivity (ρ): In Ω·m. Silver and Copper have lowest resistivity (best conductors). Nichrome is used in heating elements due to high resistivity and high melting point.

5. Resistors in Series:
Total Resistance R_s = R1 + R2 + R3. Current remains same across each resistor, voltage divides.

6. Resistors in Parallel:
1 / R_p = (1 / R1) + (1 / R2) + (1 / R3). Voltage remains same across each branch, total current divides. Domestic wiring is in parallel so appliances can be operated independently and get full 220V.

7. Joule's Law of Heating:
Heat produced H = I² * R * t = V * I * t = (V² / R) * t (Unit: Joules).
Electric Power P = V * I = I² * R = V² / R (Unit: Watt (W)).
Commercial unit of electrical energy: 1 kilowatt-hour (1 kWh) = 1 Unit = 3.6 × 10⁶ Joules.`,
    sampleQuestionPaper: `CBSE Class 10 Periodic Test - Physics (Electricity)
Q1. State Ohm's law and write its mathematical formula. (Max: 10 Marks)
Q2. Why are heating coils in electric toasters and irons made of an alloy rather than pure metal? Explain with 2 reasons. (Max: 10 Marks)
Q3. Three resistors of 2Ω, 3Ω, and 6Ω are connected in parallel across a 12V battery. Calculate the equivalent resistance and total current drawn. (Max: 10 Marks)`,
    sampleStudentAnswerSheet: `Answer Sheet - Rithvik S.

Ans 1: Ohm's law says that at constant temperature, the current in a wire is proportional to potential difference.
Formula is V = IR. Where V is volt, I is current, R is resistance.

Ans 2: Heating coils are made of alloys like nichrome because:
1. Alloys have higher resistivity than pure metals so they generate more heat.
2. They do not melt or oxidize easily at high temperature.

Ans 3: The resistors are in parallel:
1/Rp = 1/2 + 1/3 + 1/6
1/Rp = (3 + 2 + 1) / 6 = 6/6 = 1
So equivalent resistance Rp = 1 Ohm.
Total Current I = V / Rp = 12 / 1 = 12 Amperes.`,
  },
  {
    id: 'class-12-semiconductors',
    title: 'Semiconductor Electronics & P-N Junction (Class 12)',
    subject: 'Physics',
    classLevel: 'Class 12 / JEE',
    tag: 'JEE / Board Guarantee 🔬',
    notesText: `Semiconductor Electronics: Materials, Devices & Simple Circuits
1. Energy Bands in Solids:
- Valence Band (VB): Filled with valence electrons.
- Conduction Band (CB): Electrons free to conduct.
- Energy Band Gap (Eg):
  * Conductors: Overlapping bands (Eg ≈ 0)
  * Semiconductors: Small band gap (Eg < 3 eV, e.g., Si = 1.1 eV, Ge = 0.7 eV)
  * Insulators: Large band gap (Eg > 3 eV, e.g., Diamond Eg ≈ 5.4 eV)

2. Intrinsic vs Extrinsic Semiconductors:
- Intrinsic: Pure semiconductor (Si, Ge) where number of free electrons (ne) = number of holes (nh) = ni.
- Extrinsic: Doped semiconductors to increase conductivity.
  * n-type: Doped with Pentavalent impurity (P, As, Sb). Electrons are majority carriers (ne >> nh). Donor energy level lies just below CB.
  * p-type: Doped with Trivalent impurity (B, Al, In). Holes are majority carriers (nh >> ne). Acceptor energy level lies just above VB.

3. P-N Junction Diode:
Formed by fusing p-type and n-type semiconductors.
- Diffusion current occurs due to concentration gradient.
- Drift current occurs due to electric field in the Depletion Region (width ≈ 0.5 to 1 µm).
- Barrier potential: Si ≈ 0.7V, Ge ≈ 0.3V at 300K.

4. Biasing of Diode:
- Forward Bias: p-side connected to +ve, n-side to -ve. Depletion width decreases, barrier height decreases, conducts easily in mA.
- Reverse Bias: p-side to -ve, n-side to +ve. Depletion width increases, barrier increases, very tiny reverse saturation current in µA due to minority carriers.

5. Applications:
- Rectifier: Converts AC into DC. Half-wave rectifier efficiency = 40.6%, Full-wave rectifier efficiency = 81.2%.
- Zener Diode: Heavily doped p-n junction operating in reverse breakdown region, used as a Voltage Regulator.`,
    sampleQuestionPaper: `Class 12 Physics Pre-Board Examination
Q1. Distinguish between n-type and p-type semiconductors on the basis of doping and majority carriers. (Max: 10 Marks)
Q2. Explain the working of a Full Wave Rectifier with the help of a neat circuit diagram and input-output waveforms. (Max: 10 Marks)`,
    sampleStudentAnswerSheet: `Class 12 Pre-Board - Physics Submission

Ans 1: Difference between n-type and p-type:
- n-type semiconductor is doped with pentavalent impurities like Phosphorus and Arsenic. In this, electrons are the majority carriers and holes are minority.
- p-type semiconductor is doped with trivalent impurities like Boron and Aluminium. In this, holes are majority carriers and electrons are minority.
Both types remain electrically neutral overall.

Ans 2: Full wave rectifier uses two diodes D1 and D2 connected to a center-tapped transformer.
During positive half cycle of AC input, D1 is forward biased and conducts while D2 is reverse biased. Current flows through load resistor RL.
During negative half cycle, D1 becomes reverse biased and D2 becomes forward biased and conducts.
Thus current in load resistor flows in the same direction for both cycles. Efficiency is 81.2%.`,
  },
  {
    id: 'history-freedom-movement',
    title: 'Indian National Movement (1885 - 1947)',
    subject: 'Social Science / History',
    classLevel: 'Class 10 / Competitive Exams',
    tag: 'Indian History Essential 🇮🇳',
    notesText: `Indian National Movement: Chronology & Key Milestones
1. Formation of Indian National Congress (INC):
- Founded in December 1885 in Bombay by A.O. Hume. First President: Womesh Chandra Bonnerjee.

2. Partition of Bengal & Swadeshi Movement (1905):
- Lord Curzon partitioned Bengal in 1905.
- Sparked the Swadeshi and Boycott Movement; Vande Mataram became the national anthem of protest.

3. Arrival of Mahatma Gandhi (1915):
- Returned from South Africa on January 9, 1915 (observed as Pravasi Bharatiya Divas).
- Champaran Satyagraha (1917) - Indigo farmers; Kheda Satyagraha (1918) - Peasant tax relief; Ahmedabad Mill Strike (1918) - First hunger strike.

4. Rowlatt Act & Jallianwala Bagh Massacre (1919):
- Rowlatt Act (March 1919) authorized arrest without trial.
- April 13, 1919: General Dyer opened fire on unarmed gathering at Jallianwala Bagh in Amritsar. Rabindranath Tagore renounced his Knighthood.

5. Non-Cooperation & Khilafat Movement (1920 - 1922):
- Launched by Gandhi in 1920 to boycott foreign goods and institutions.
- Called off in February 1922 following the Chauri Chaura incident (police station set ablaze).

6. Civil Disobedience Movement & Dandi March (1930):
- Salt March from Sabarmati Ashram to Dandi (March 12 - April 6, 1930). 240 miles with 78 volunteers to break the British salt monopoly.

7. Quit India Movement (1942):
- August 8, 1942 at Gowalia Tank Maidan, Bombay: Gandhi gave the historic call "Do or Die" (Karo ya Maro).

8. Indian Independence Act (1947):
- August 15, 1947: India gained freedom; Lord Mountbatten was the last Viceroy and first Governor-General of independent India.`,
  },
];
