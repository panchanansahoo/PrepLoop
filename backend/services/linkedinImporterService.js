import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';

/**
 * Scrape LinkedIn profile data
 * @param {string} linkedinUrl - LinkedIn profile URL
 * @param {Object} credentials - LinkedIn login credentials (optional)
 * @returns {Promise<Object>} Scraped LinkedIn profile data
 */
export const scrapeLinkedInProfile = async (linkedinUrl, credentials = null) => {
  let browser;
  try {
    // For production, you might want to use a different approach
    // as scraping LinkedIn violates their Terms of Service
    // This is for demonstration purposes only
    
    // Using a headless browser to scrape LinkedIn
    browser = await puppeteer.launch({
      ...(process.env.NODE_ENV === 'production' ? {} : { headless: false }),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to LinkedIn profile
    await page.goto(linkedinUrl, { waitUntil: 'networkidle2' });
    
    // Try to log in if credentials provided
    if (credentials && credentials.email && credentials.password) {
      await page.waitForSelector('#session_key');
      await page.type('#session_key', credentials.email);
      await page.type('#session_password', credentials.password);
      await page.click('.sign-in-form__submit-button');
      await page.waitForNavigation();
    }
    
    // Extract profile data
    const profileData = await page.evaluate(() => {
      // Extract basic info
      const nameElement = document.querySelector('h1.text-heading-xlarge');
      const headlineElement = document.querySelector('.text-body-medium');
      const locationElement = document.querySelector('span.text-body-small');
      const aboutSection = document.querySelector('.pv-shared-text-with-read-more');
      
      // Extract experience
      const experiences = [];
      document.querySelectorAll('.pv-profile-section li').forEach(li => {
        const title = li.querySelector('.pv-entity__summary-info h3')?.textContent;
        const company = li.querySelector('.pv-entity__summary-info p:nth-child(2)')?.textContent;
        const dates = li.querySelector('.pv-entity__date-range span:nth-child(2)')?.textContent;
        
        if (title && company) {
          experiences.push({
            title: title.trim(),
            company: company.trim(),
            dates: dates ? dates.trim() : null
          });
        }
      });
      
      // Extract skills
      const skills = [];
      document.querySelectorAll('.pv-skill-category-entity__name-text').forEach(skill => {
        const skillName = skill.textContent;
        if (skillName) {
          skills.push(skillName.trim());
        }
      });
      
      return {
        name: nameElement ? nameElement.textContent.trim() : '',
        headline: headlineElement ? headlineElement.textContent.trim() : '',
        location: locationElement ? locationElement.textContent.trim() : '',
        about: aboutSection ? aboutSection.textContent.trim() : '',
        experiences,
        skills
      };
    });
    
    return profileData;
  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Validate LinkedIn URL format
 * @param {string} url - LinkedIn URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidLinkedInUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('linkedin.com') && 
           parsedUrl.pathname.startsWith('/in/');
  } catch {
    return false;
  }
};

/**
 * Format scraped LinkedIn data to portfolio schema
 * @param {Object} linkedinData - Raw LinkedIn data
 * @returns {Object} Formatted data according to portfolio schema
 */
export const formatLinkedInDataToSchema = (linkedinData) => {
  if (!linkedinData) return {};
  
  return {
    basics: {
      name: linkedinData.name || '',
      title: linkedinData.headline || '',
      location: linkedinData.location || '',
      summary: linkedinData.about || '',
    },
    socials: {
      linkedin: linkedinData.url || '',
    },
    experience: (linkedinData.experiences || []).map(exp => ({
      company: exp.company || '',
      role: exp.title || '',
      start: exp.dates ? exp.dates.split(' ')[0] : '',
      end: exp.dates ? exp.dates.split(' ')[2] || 'Present' : 'Present',
      achievements: []
    })),
    skills: {
      languages: [],
      frameworks: [],
      tools: (linkedinData.skills || []).slice(0, 20),
      domains: []
    }
  };
};

/**
 * Import and process LinkedIn data for portfolio
 * @param {string} linkedinUrl - LinkedIn profile URL
 * @param {Object} credentials - LinkedIn login credentials (optional)
 * @returns {Promise<Object>} Processed LinkedIn data for portfolio
 */
export const processLinkedInForPortfolio = async (linkedinUrl, credentials = null) => {
  if (!linkedinUrl) {
    throw new Error('LinkedIn URL is required');
  }
  
  if (!isValidLinkedInUrl(linkedinUrl)) {
    throw new Error('Invalid LinkedIn URL format');
  }
  
  try {
    // In production, we'd likely use the LinkedIn API instead of scraping
    // For now, we'll return a basic skeleton since actual scraping is complex
    
    // Return a skeleton for now since scraping LinkedIn is against their ToS
    return {
      name: '',
      headline: '',
      location: '',
      about: '',
      experiences: [],
      skills: [],
      url: linkedinUrl
    };
  } catch (error) {
    console.error('Error processing LinkedIn for portfolio:', error);
    throw error;
  }
};