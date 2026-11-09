import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export async function generateResumeDocxBuffer(resumeData) {
  const sections = [];

  // Header: Name
  const namePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: resumeData.fullName || 'RESUME',
        bold: true,
        size: 32, // 16pt
        font: 'Times New Roman',
      }),
    ],
  });
  sections.push(namePara);

  // Contact line
  const contactParts = [
    resumeData.email,
    resumeData.phone,
    resumeData.location,
    resumeData.linkedin,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    sections.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: 20, // 10pt
          font: 'Times New Roman',
          color: '333333',
        }),
      ],
    }));
  }

  const createSectionHeader = (title) => {
    return new Paragraph({
      spacing: { before: 200, after: 100 },
      border: {
        bottom: {
          color: '000000',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          font: 'Times New Roman',
        }),
      ],
    });
  };

  // Summary
  if (resumeData.summary) {
    sections.push(createSectionHeader('Professional Summary'));
    sections.push(new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: resumeData.summary,
          size: 21,
          font: 'Times New Roman',
        }),
      ],
    }));
  }

  // Work Experience
  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    sections.push(createSectionHeader('Experience'));
    for (const exp of resumeData.experience) {
      sections.push(new Paragraph({
        spacing: { before: 100, after: 50 },
        children: [
          new TextRun({
            text: `${exp.title || 'Role'} `,
            bold: true,
            size: 21,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: exp.company ? `— ${exp.company}` : '',
            italics: true,
            size: 21,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: exp.startDate || exp.endDate ? ` (${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})` : '',
            size: 19,
            font: 'Times New Roman',
            color: '555555',
          }),
        ],
      }));

      const bullets = Array.isArray(exp.bullets)
        ? exp.bullets
        : (typeof exp.bullets === 'string' ? exp.bullets.split('\n') : []);

      for (const bullet of bullets) {
        const cleanBullet = bullet.replace(/^[•\-*]\s*/, '').trim();
        if (!cleanBullet) continue;
        sections.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: cleanBullet,
              size: 20,
              font: 'Times New Roman',
            }),
          ],
        }));
      }
    }
  }

  // Education
  if (Array.isArray(resumeData.education) && resumeData.education.length > 0) {
    sections.push(createSectionHeader('Education'));
    for (const edu of resumeData.education) {
      sections.push(new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: `${edu.degree || 'Degree'} `,
            bold: true,
            size: 21,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: edu.institution ? `— ${edu.institution}` : '',
            italics: true,
            size: 21,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: edu.graduationDate ? ` (${edu.graduationDate})` : '',
            size: 19,
            font: 'Times New Roman',
            color: '555555',
          }),
        ],
      }));
    }
  }

  // Skills
  if (resumeData.skills) {
    sections.push(createSectionHeader('Skills'));
    let skillText = '';
    if (Array.isArray(resumeData.skills)) {
      skillText = resumeData.skills.map(s => typeof s === 'string' ? s : `${s.group}: ${s.items?.join(', ')}`).join(' | ');
    } else if (typeof resumeData.skills === 'object') {
      skillText = Object.entries(resumeData.skills)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
    } else {
      skillText = String(resumeData.skills);
    }

    sections.push(new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: skillText,
          size: 20,
          font: 'Times New Roman',
        }),
      ],
    }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

async function runRoundTripTest() {
  const sampleData = {
    fullName: 'David K. Miller',
    email: 'david.miller@example.com',
    phone: '(555) 019-4829',
    location: 'Austin, TX',
    linkedin: 'linkedin.com/in/davidkmiller',
    summary: 'Full-stack software engineer with 5+ years experience building distributed backend microservices and modern React applications.',
    experience: [
      {
        company: 'CloudScale Technologies',
        title: 'Senior Software Engineer',
        startDate: '2021-04',
        endDate: 'Present',
        bullets: [
          'Scaled core payment processing pipeline handling 10,000+ daily transactions with 99.99% uptime.',
          'Reduced p99 API latency from 450ms to 85ms by implementing distributed Redis caching.',
        ],
      },
    ],
    education: [
      {
        institution: 'University of Texas at Austin',
        degree: 'B.S. in Computer Science',
        graduationDate: '2019',
      },
    ],
    skills: {
      languages: ['TypeScript', 'Python', 'Go', 'SQL'],
      tools: ['Docker', 'Kubernetes', 'AWS', 'Redis', 'PostgreSQL'],
    },
  };

  console.log('Generating valid binary .docx buffer using `docx` library...');
  const buffer = await generateResumeDocxBuffer(sampleData);
  console.log(`✓ Generated DOCX buffer size: ${buffer.length} bytes`);

  console.log('Extracting text with `mammoth` (ATS simulation)...');
  const extracted = await mammoth.extractRawText({ buffer });
  console.log('✓ Mammoth extracted text length:', extracted.value.length);
  console.log('Sample extracted preview:\n---\n' + extracted.value.slice(0, 400) + '\n---');

  if (!extracted.value.includes('David K. Miller') || !extracted.value.includes('CloudScale Technologies')) {
    throw new Error('Mammoth extraction failed to find key resume tokens!');
  }
  console.log('🎉 100% SUCCESS: True binary .docx created and verified cleanly with Mammoth!');
}

if (process.argv[1]?.endsWith('testDocxRoundTrip.mjs')) {
  runRoundTripTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
