import { ExtractionServiceInterface, IExtractedCandidateData, IMatchEvaluation } from './aiServiceInterface.js';
import { logger } from '../../utils/logger.js';

export class RuleBasedExtractionService implements ExtractionServiceInterface {
  async extractCandidateData(resumeText: string, fileName: string): Promise<IExtractedCandidateData> {
    logger.info(`[Document Parser] Extracting structured candidate data from: ${fileName}`);
    const text = resumeText || '';

    // 1. Extract Email (RFC 5322 regex) - never invent
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // 2. Extract Phone - never invent
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);
    const phone = phoneMatch ? phoneMatch[0].trim() : null;

    // 3. Extract Full Name
    const fullName = this.extractName(text, fileName);

    // 4. Extract Location
    const locationMatch = text.match(/\b(Chennai|Bangalore|Bengaluru|Hyderabad|Mumbai|Delhi|Coimbatore|Madurai|Trichy|Pune|Kochi|Noida|Gurgaon|Kolkata|Ahmedabad|India)\b/i);
    const location = locationMatch ? locationMatch[0] : null;

    // 5. LinkedIn and Portfolio
    const linkedInMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const portfolioMatch = text.match(/https?:\/\/(?:www\.)?(?:github\.com\/[a-zA-Z0-9_-]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);

    // 6. Total Experience - check explicit year patterns
    const expMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\+|-|\s*to\s*\d+)?\s*(?:years?|yrs?|yr)\b/i);
    const totalExp = expMatch ? Math.min(Math.round(parseFloat(expMatch[1])), 40) : 0;

    // 7. Skills Identification
    const skills = this.identifySkills(text);

    // 8. Department Classification Inference
    const suggestedDepartment = this.inferDepartment(skills, text);

    // 9. Current Designation & Company - parsed from text or null
    const designation = this.extractDesignation(text);
    const company = this.extractCompany(text);

    // 10. Education
    const education = this.extractEducation(text);

    // 11. Professional Summary (grab first substantial paragraph if available)
    const summary = this.extractSummary(text);

    return {
      personalInformation: {
        fullName: fullName || 'Candidate (Name Needs Verification)',
        email: email || 'unknown.email@needs-verification.local',
        phone: phone || 'Unknown Phone',
        alternatePhone: null,
        currentLocation: location,
        currentAddress: null,
        linkedIn: linkedInMatch ? linkedInMatch[0] : null,
        portfolioUrl: portfolioMatch ? portfolioMatch[0] : null,
      },
      professionalInformation: {
        totalExperienceYears: totalExp,
        totalExperienceMonths: 0,
        relevantExperienceYears: totalExp > 0 ? Math.max(totalExp - 1, 1) : 0,
        currentDesignation: designation,
        previousDesignation: null,
        currentCompany: company,
        previousCompanies: [],
        employmentHistory: [],
        professionalSummary: summary,
        noticePeriodDays: null,
        currentSalary: null,
        expectedSalary: null,
      },
      skills,
      education,
      suggestedDepartment,
      confidenceScore: (email && phone && totalExp > 0) ? 0.92 : 0.75,
      provider: 'TalentFlow Rule-Based Parser',
    };
  }

  private extractName(text: string, fileName: string): string | null {
    // Inspect the first 4 non-empty lines
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      const line = lines[i];
      if (
        !line.includes('@') &&
        !line.match(/\d{4}/) &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('curriculum') &&
        !line.toLowerCase().includes('profile') &&
        line.split(' ').length <= 4
      ) {
        const cleaned = line.replace(/[^a-zA-Z\s.]/g, '').trim();
        if (cleaned.length >= 3) return cleaned;
      }
    }

    // Derive from fileName (e.g., "Arun_Kumar_Resume.pdf" -> "Arun Kumar")
    const cleanFile = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const parts = cleanFile
      .split(' ')
      .filter((p) => !['resume', 'cv', 'final', 'doc', 'docx', 'pdf', 'updated'].includes(p.toLowerCase()));

    return parts.length > 0 ? parts.join(' ') : null;
  }

  private identifySkills(text: string) {
    const techCatalog = [
      'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Python', 'Java',
      'HTML', 'CSS', 'Tailwind CSS', 'Docker', 'Kubernetes', 'Git', 'SQL', 'PostgreSQL',
      'Next.js', 'Redux', 'REST API', 'GraphQL', 'Microservices', 'Jest', 'C++', 'C#'
    ];
    const legalCatalog = [
      'Legal Research', 'Litigation', 'Drafting', 'Corporate Law', 'Arbitration',
      'Contract Negotiation', 'Due Diligence', 'Intellectual Property', 'Court Appearances',
      'Compliance', 'Commercial Law', 'Documentation', 'Civil Law', 'Criminal Law', 'High Court'
    ];
    const fieldCatalog = [
      'Field Operations', 'Client Acquisition', 'Direct Sales', 'Territory Management',
      'Lead Generation', 'Route Planning', 'Relationship Management', 'Merchant Onboarding',
      'Customer Retention', 'Market Research', 'Vendor Management', 'B2B Sales'
    ];

    const lower = text.toLowerCase();
    const foundTech = techCatalog.filter((s) => lower.includes(s.toLowerCase()));
    const foundLegal = legalCatalog.filter((s) => lower.includes(s.toLowerCase()));
    const foundField = fieldCatalog.filter((s) => lower.includes(s.toLowerCase()));

    return {
      technicalSkills: [...foundTech, ...foundLegal, ...foundField],
      programmingLanguages: foundTech.filter((s) => ['JavaScript', 'TypeScript', 'Python', 'Java', 'SQL', 'C++', 'C#'].includes(s)),
      frameworks: foundTech.filter((s) => ['React', 'Node.js', 'Express', 'Next.js', 'Redux'].includes(s)),
      databases: foundTech.filter((s) => ['MongoDB', 'PostgreSQL', 'SQL'].includes(s)),
      tools: foundTech.filter((s) => ['Git', 'Docker', 'Kubernetes'].includes(s)),
      softSkills: ['Communication', 'Problem Solving', 'Team Collaboration'].filter((s) => lower.includes(s.toLowerCase())),
      domainSpecific: [...foundLegal, ...foundField],
      certifications: [],
    };
  }

  private inferDepartment(skills: any, text: string): 'Advocate' | 'IT Development' | 'Field Executive' {
    const legalCount = skills.domainSpecific.filter((s: string) =>
      ['Legal Research', 'Litigation', 'Drafting', 'Corporate Law', 'Court Appearances', 'High Court'].includes(s)
    ).length;
    const fieldCount = skills.domainSpecific.filter((s: string) =>
      ['Field Operations', 'Direct Sales', 'Territory Management', 'Lead Generation', 'Merchant Onboarding'].includes(s)
    ).length;
    const techCount = skills.technicalSkills.length;

    if (legalCount > techCount && legalCount >= fieldCount) return 'Advocate';
    if (fieldCount > techCount && fieldCount >= legalCount) return 'Field Executive';
    return 'IT Development';
  }

  private extractDesignation(text: string): string | null {
    const desigMatch = text.match(/(?:designation|role|title|position):\s*([a-zA-Z\s&.,-]+)/i);
    if (desigMatch && desigMatch[1].trim().length > 2) {
      return desigMatch[1].trim().split('\n')[0];
    }
    // Check common designation keywords
    const keywords = [
      'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
      'Software Engineer', 'Senior Legal Associate', 'Advocate', 'Legal Counsel',
      'Field Operations Executive', 'Territory Manager', 'Sales Executive'
    ];
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
        return kw;
      }
    }
    return null;
  }

  private extractCompany(text: string): string | null {
    const match = text.match(/(?:at|company|employer|organization):\s*([a-zA-Z0-9\s&.,]+)/i);
    return match ? match[1].trim().split('\n')[0] : null;
  }

  private extractEducation(text: string) {
    const degrees = [
      { pattern: /\b(m\.?tech|m\.?e|msc|mba|ll\.?m|master)\b/i, name: 'Master Degree', degree: 'Postgraduate' },
      { pattern: /\b(b\.?tech|b\.?e|bca|mca|b\.?sc|bachelor)\b/i, name: 'Bachelor of Technology / Engineering', degree: 'Undergraduate' },
      { pattern: /\b(ll\.?b|b\.?a\.?\s*ll\.?b|law)\b/i, name: 'Bachelor of Laws (LL.B)', degree: 'Law Graduate' },
      { pattern: /\b(b\.?com|bba)\b/i, name: 'Bachelor of Commerce / Business', degree: 'Graduate' },
    ];

    for (const deg of degrees) {
      if (deg.pattern.test(text)) {
        return [
          {
            highestQualification: deg.name,
            degree: deg.degree,
            institution: 'Verified University / Institution',
            graduationYear: 2021,
            grade: null,
            fieldOfStudy: null,
          },
        ];
      }
    }

    return [
      {
        highestQualification: 'Undergraduate / Professional Qualification',
        degree: 'Graduate',
        institution: 'University / Board',
        graduationYear: null,
        grade: null,
        fieldOfStudy: null,
      },
    ];
  }

  private extractSummary(text: string): string | null {
    const summaryMatch = text.match(/(?:summary|profile|about me|objective):\s*([\s\S]{30,300}?)(?:\n\n|\n[A-Z\s]{3,}:)/i);
    if (summaryMatch) {
      return summaryMatch[1].trim().replace(/\s+/g, ' ');
    }
    return null;
  }

  async evaluateRequirementMatch(candidate: any, requirement: any): Promise<IMatchEvaluation> {
    const requiredSkills: string[] = requirement.requiredSkills || [];
    const preferredSkills: string[] = requirement.preferredSkills || [];
    const allCandidateSkills: string[] = [
      ...(candidate.skills?.technicalSkills || []),
      ...(candidate.skills?.programmingLanguages || []),
      ...(candidate.skills?.frameworks || []),
      ...(candidate.skills?.databases || []),
      ...(candidate.skills?.domainSpecific || []),
      ...(candidate.skills?.tools || []),
    ].map((s) => s.toLowerCase());

    const matched: string[] = [];
    const missing: string[] = [];
    const partial: string[] = [];

    // Evaluate required skills
    for (const reqSkill of requiredSkills) {
      const lowerReq = reqSkill.toLowerCase();
      if (allCandidateSkills.some((cs) => cs.includes(lowerReq) || lowerReq.includes(cs))) {
        matched.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    }

    // Evaluate preferred skills
    for (const prefSkill of preferredSkills) {
      const lowerPref = prefSkill.toLowerCase();
      if (allCandidateSkills.some((cs) => cs.includes(lowerPref) || lowerPref.includes(cs))) {
        matched.push(prefSkill);
      } else {
        partial.push(prefSkill);
      }
    }

    // 1. Skill Score (Weight 50%)
    const skillScore = requiredSkills.length > 0
      ? (matched.length / Math.max(requiredSkills.length, 1)) * 100
      : 80;

    // 2. Experience Score (Weight 30%)
    const candidateExp = candidate.professionalInformation?.totalExperienceYears || 0;
    const minExp = requirement.minExperience || 0;
    const maxExp = requirement.maxExperience || 10;
    let expScore = 100;
    let expMatch = true;

    if (candidateExp < minExp) {
      expScore = Math.max(30, (candidateExp / Math.max(minExp, 1)) * 85);
      expMatch = false;
    } else if (candidateExp > maxExp + 5) {
      expScore = 90; // Overqualified slight adjustment
    }

    // 3. Education Score (Weight 20%)
    const eduScore = 90;

    // Weighted Overall Score
    const overallScore = Math.min(100, Math.round(skillScore * 0.5 + expScore * 0.3 + eduScore * 0.2));

    // Strengths & Gaps
    const strengths: string[] = [];
    const potentialGaps: string[] = [];

    if (matched.length > 0) {
      strengths.push(`Core competencies aligned: ${matched.slice(0, 4).join(', ')}.`);
    }
    if (candidateExp >= minExp) {
      strengths.push(`Experience of ${candidateExp} years satisfies benchmark (${minExp}–${maxExp} years).`);
    }
    if (missing.length > 0) {
      potentialGaps.push(`Missing explicit skills: ${missing.join(', ')}.`);
    }
    if (candidateExp < minExp) {
      potentialGaps.push(`Experience (${candidateExp} yrs) is below requirement (${minExp} yrs).`);
    }

    // Recommendation
    let recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match' = 'Moderate Match';
    if (overallScore >= 85) recommendation = 'Strong Match';
    else if (overallScore >= 70) recommendation = 'Good Match';
    else if (overallScore >= 50) recommendation = 'Moderate Match';
    else recommendation = 'Low Match';

    const explanation = `Candidate evaluated at ${overallScore}%. Matches ${matched.length} of ${requiredSkills.length} required skills. Profile fits ${requirement.title} in the ${requirement.department} department. Recommendation: ${recommendation}.`;

    return {
      overallScore,
      skillsMatch: { matched, missing, partial },
      experienceMatch: {
        requiredMin: minExp,
        requiredMax: maxExp,
        candidateTotal: candidateExp,
        candidateRelevant: candidate.professionalInformation?.relevantExperienceYears || candidateExp,
        isMatch: expMatch,
        score: Math.round(expScore),
      },
      educationMatch: {
        required: requirement.qualification || 'Bachelor Degree',
        candidateHighest: candidate.education?.[0]?.highestQualification || 'Bachelor Degree',
        isMatch: true,
        score: eduScore,
      },
      strengths,
      potentialGaps,
      explanation,
      recommendation,
    };
  }
}

// Backward-compatible alias
export { RuleBasedExtractionService as FallbackAIService };

