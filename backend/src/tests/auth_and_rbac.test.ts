import { FallbackAIService } from '../services/ai/fallbackAIService.js';

describe('TalentFlow AI Backend Engine Tests', () => {
  const fallbackAI = new FallbackAIService();

  test('Fallback AI extracts structured data from raw IT resume text', async () => {
    const rawResume = `
      Arun Kumar
      Email: arun.dev@example.com
      Phone: +91 98765 43210
      Location: Chennai, India
      Professional Summary: Full Stack Software Engineer with 4 years of experience in React, Node.js, Express, MongoDB, and TypeScript.
      Experience:
      - Senior Developer at Tech Innovations Pvt Ltd (2022 - Present)
      Skills: React, JavaScript, Node.js, Express, MongoDB, TypeScript, Git, Docker, REST API.
      Education: Bachelor of Engineering in Computer Science, Anna University, 2020.
    `;

    const extracted = await fallbackAI.extractCandidateData(rawResume, 'Arun_Resume.pdf');

    expect(extracted.personalInformation.fullName).toBeDefined();
    expect(extracted.personalInformation.email).toBe('arun.dev@example.com');
    expect(extracted.professionalInformation.totalExperienceYears).toBeGreaterThanOrEqual(3);
    expect(extracted.skills.technicalSkills).toContain('React');
    expect(extracted.skills.technicalSkills).toContain('Node.js');
    expect(extracted.suggestedDepartment).toBe('IT Development');
  });

  test('Fallback AI correctly matches candidate against IT requirement', async () => {
    const candidate = {
      personalInformation: { fullName: 'Arun Kumar' },
      professionalInformation: { totalExperienceYears: 4, relevantExperienceYears: 4 },
      skills: {
        technicalSkills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'TypeScript'],
        programmingLanguages: ['JavaScript', 'TypeScript'],
        frameworks: ['React', 'Node.js'],
        databases: ['MongoDB'],
      },
      education: [{ highestQualification: 'Bachelor of Engineering' }],
    };

    const requirement = {
      title: 'Senior React Developer',
      department: 'IT Development',
      requiredSkills: ['React', 'Node.js', 'MongoDB'],
      preferredSkills: ['TypeScript', 'Docker'],
      minExperience: 3,
      maxExperience: 6,
      qualification: 'Bachelor of Engineering',
    };

    const evaluation = await fallbackAI.evaluateRequirementMatch(candidate, requirement);

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);
    expect(evaluation.skillsMatch.matched).toContain('React');
    expect(evaluation.skillsMatch.matched).toContain('Node.js');
    expect(evaluation.recommendation).toBe('Strong Match');
  });

  test('Fallback AI correctly categorizes legal candidate to Advocate department', async () => {
    const rawLegalResume = `
      Advocate Meenakshi Sundaram
      Email: meenakshi.advocate@court.in
      Phone: 9876543210
      5 years practicing advocate at Madras High Court.
      Expertise: Legal Research, Litigation, Drafting, Corporate Law, Commercial Contracts, Arbitration.
      Education: LL.B from Tamil Nadu Dr. Ambedkar Law University.
    `;

    const extracted = await fallbackAI.extractCandidateData(rawLegalResume, 'Meenakshi_Advocate.pdf');
    expect(extracted.suggestedDepartment).toBe('Advocate');
    expect(extracted.skills.technicalSkills).toContain('Litigation');
  });
});

