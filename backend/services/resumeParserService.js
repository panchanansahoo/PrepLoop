import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse resume file based on its type
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileType - File type ('pdf', 'docx', 'txt')
 * @returns {Promise<Object>} Parsed resume data
 */
export const parseResumeFile = async (fileBuffer, fileType) => {
  try {
    let textContent = '';
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
        break;
        
      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        textContent = docxResult.value;
        break;
        
      case 'txt':
        textContent = fileBuffer.toString('utf8');
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Clean up the text content
    const cleanedText = textContent
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    return {
      text: cleanedText,
      extracted: extractStructuredData(cleanedText),
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

/**
 * Extract structured data from resume text
 * @param {string} text - Resume text
 * @returns {Object} Structured data
 */
const extractStructuredData = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const locationRegex = /([A-Za-z\s]+,\s*[A-Za-z\s]+(?=\s*(?:\n|$)))/gi;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const locations = text.match(locationRegex) || [];
  
  // Extract name (usually first 2-3 words in the beginning)
  const firstLines = text.substring(0, 200).split('\n');
  let probableName = '';
  for (const line of firstLines) {
    if (line.trim().length > 3 && line.split(' ').length <= 4) {
      probableName = line.trim();
      break;
    }
  }
  
  // Extract skills (common skills list)
  const skills = extractSkills(text);
  
  // Extract experience sections
  const experiences = extractExperiences(text);
  
  // Extract education
  const education = extractEducation(text);
  
  // Extract projects
  const projects = extractProjects(text);
  
  return {
    name: probableName,
    email: emails[0] || '',
    phone: phones[0] || '',
    location: locations[0] || '',
    skills,
    experiences,
    education,
    projects,
  };
};

/**
 * Extract skills from resume text
 * @param {string} text - Resume text
 * @returns {Array<string>} Skills array
 */
const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  
  // Common skills keywords
  const skillKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'typescript', 'go', 'rust', 'php', 'ruby', 'csharp', 'cpp', 'c', 'swift', 'kotlin',
    // Frontend frameworks/libraries
    'react', 'angular', 'vue', 'svelte', 'jquery', 'ember', 'nextjs', 'gatsby', 'nuxtjs',
    // Backend frameworks/libraries
    'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'aspnet',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sqlserver',
    // DevOps/tools
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'git', 'github', 'gitlab', 'ci', 'cd',
    // Other skills
    'agile', 'scrum', 'tdd', 'oop', 'rest', 'graphql', 'api', 'microservices'
  ];
  
  const foundSkills = new Set();
  
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill)) {
      foundSkills.add(skill);
    }
  });
  
  return Array.from(foundSkills).slice(0, 30); // Limit to 30 skills
};

/**
 * Extract experiences from resume text
 * @param {string} text - Resume text
 * @returns {Array<Object>} Experience array
 */
const extractExperiences = (text) => {
  // Look for sections that might contain work experience
  const expSections = [];
  
  // This is a simplified extraction - a real implementation would need more robust parsing
  const expRegex = /(experience|employment|work|professional)[\s\S]*?(?=(education|skills|projects|$))/gi;
  const expMatch = text.match(expRegex);
  
  if (expMatch) {
    // Further parse the experience section
    // This is a simplified version - real parsing would be more complex
    const lines = expMatch[0].split('\n');
    let currentExp = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 2) continue;
      
      // Look for company names and positions
      if (currentExp) {
        if (/\d{4}/.test(trimmedLine)) { // Likely date line
          currentExp.dates = trimmedLine;
        } else if (!currentExp.role) {
          currentExp.role = trimmedLine;
        } else if (!currentExp.achievements) {
          currentExp.achievements = [trimmedLine];
        } else {
          currentExp.achievements.push(trimmedLine);
        }
      } else {
        // Start a new experience if this looks like a company/position
        if (/[A-Z][a-zA-Z\s]+Inc|[A-Z][a-zA-Z\s]+LLC|[A-Z][a-zA-Z\s]+Ltd/.test(trimmedLine)) {
          currentExp = { company: trimmedLine };
          expSections.push(currentExp);
        }
      }
    }
  }
  
  return expSections;
};

/**
 * Extract education from resume text
 * @param {string} text - Resume text
 * @returns {Array<Object>} Education array
 */
const extractEducation = (text) => {
  const eduRegex = /(education|academic|school|university)[\s\S]*?(?=(experience|skills|projects|$))/gi;
  const eduMatch = text.match(eduRegex);
  
  if (!eduMatch) return [];
  
  // Simplified extraction
  const lines = eduMatch[0].split('\n');
  const education = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    // Look for university/college names and degrees
    if (/(university|college|school|bs|ba|ms|ma|phd|btech|mtech)/i.test(trimmedLine)) {
      const eduObj = {};
      
      // Extract degree and institution
      if (/(bs|ba|ms|ma|phd|btech|mtech)/i.test(trimmedLine)) {
        const degreeMatch = trimmedLine.match(/([A-Z]{2,4}|[A-Za-z\s]+(?:in|of).+?)(?=\s+(?:at|from)|,|\s+[A-Z])/i);
        if (degreeMatch) eduObj.degree = degreeMatch[0];
      }
      
      // Extract institution
      const institutionMatch = trimmedLine.match(/(?:at|from)\s+([A-Za-z\s]+)/i);
      if (institutionMatch) eduObj.institute = institutionMatch[1].trim();
      
      // Extract year
      const yearMatch = trimmedLine.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) eduObj.year = yearMatch[0];
      
      if (eduObj.degree || eduObj.institute) {
        education.push(eduObj);
      }
    }
  }
  
  return education;
};

/**
 * Extract projects from resume text
 * @param {string} text - Resume text
 * @returns {Array<Object>} Projects array
 */
const extractProjects = (text) => {
  const projRegex = /(projects?|portfolio)[\s\S]*?(?=(education|experience|skills|$))/gi;
  const projMatch = text.match(projRegex);
  
  if (!projMatch) return [];
  
  // Simplified extraction
  const lines = projMatch[0].split('\n');
  const projects = [];
  
  let currentProject = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    // Look for project names (often bolded or capitalized)
    if (/^[A-Z][A-Z\s-]+$/.test(trimmedLine) || /^[A-Z][a-zA-Z\s-]{5,30}$/.test(trimmedLine)) {
      if (currentProject && currentProject.name) {
        projects.push(currentProject);
      }
      currentProject = { name: trimmedLine };
    } else if (currentProject && !currentProject.description) {
      currentProject.description = trimmedLine;
    } else if (currentProject && currentProject.description) {
      if (!currentProject.stack) currentProject.stack = [];
      currentProject.stack.push(trimmedLine);
    }
  }
  
  if (currentProject && currentProject.name) {
    projects.push(currentProject);
  }
  
  return projects.slice(0, 10); // Limit to 10 projects
};

/**
 * Format parsed resume data to portfolio schema
 * @param {Object} resumeData - Parsed resume data
 * @returns {Object} Formatted data according to portfolio schema
 */
export const formatResumeDataToSchema = (resumeData) => {
  if (!resumeData) return {};
  
  return {
    basics: {
      name: resumeData.extracted.name || '',
      title: '', // Often not directly available in resume
      photo: '', // Not available in text resume
      email: resumeData.extracted.email || '',
      phone: resumeData.extracted.phone || '',
      location: resumeData.extracted.location || '',
      summary: '', // Summary might be part of the text
      website: '', // Not usually in resume text
    },
    socials: {
      linkedin: '',
      github: '',
      twitter: '',
      leetcode: '',
      portfolioLink: '',
    },
    skills: {
      languages: resumeData.extracted.skills.filter(skill => 
        ['javascript', 'python', 'java', 'typescript', 'go', 'rust', 'php', 'ruby', 'csharp', 'cpp', 'c', 'swift', 'kotlin'].includes(skill.toLowerCase())
      ),
      frameworks: resumeData.extracted.skills.filter(skill => 
        ['react', 'angular', 'vue', 'svelte', 'jquery', 'ember', 'nextjs', 'gatsby', 'nuxtjs', 
         'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'aspnet'].includes(skill.toLowerCase())
      ),
      tools: resumeData.extracted.skills.filter(skill => 
        !['javascript', 'python', 'java', 'typescript', 'go', 'rust', 'php', 'ruby', 'csharp', 'cpp', 'c', 'swift', 'kotlin',
          'react', 'angular', 'vue', 'svelte', 'jquery', 'ember', 'nextjs', 'gatsby', 'nuxtjs', 
          'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'aspnet'].includes(skill.toLowerCase())
      ),
      domains: [],
    },
    experience: resumeData.extracted.experiences.map(exp => ({
      company: exp.company || '',
      role: exp.role || '',
      start: exp.dates ? exp.dates.split('-')[0]?.trim() || '' : '',
      end: exp.dates ? exp.dates.split('-')[1]?.trim() || 'Present' : 'Present',
      achievements: exp.achievements || [],
    })),
    education: resumeData.extracted.education,
    projects: resumeData.extracted.projects,
    achievements: {
      awards: [],
      certifications: [],
      ranks: [],
    },
    openSource: {
      contributions: 0,
      organizations: [],
      stars: 0,
      followers: 0,
    },
    resumeMeta: {
      uploadedFile: 'resume.pdf', // Placeholder
      parsedAt: new Date().toISOString(),
      confidenceScore: 0.8, // Placeholder confidence score
    },
    portfolioMeta: {
      template: 'minimal-professional',
      theme: 'light',
      slug: '',
      publishedUrl: '',
      lastUpdated: new Date().toISOString(),
    },
  };
};

/**
 * Process resume file for portfolio
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {string} fileType - File type ('pdf', 'docx', 'txt')
 * @returns {Promise<Object>} Processed resume data for portfolio
 */
export const processResumeForPortfolio = async (fileBuffer, fileType) => {
  try {
    const parsedResume = await parseResumeFile(fileBuffer, fileType);
    return formatResumeDataToSchema(parsedResume);
  } catch (error) {
    console.error('Error processing resume for portfolio:', error);
    throw error;
  }
};