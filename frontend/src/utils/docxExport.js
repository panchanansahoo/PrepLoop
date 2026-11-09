import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';

/**
 * Builds and downloads a true binary OpenXML .docx file client-side.
 * Compatible with Microsoft Word, Google Docs, LibreOffice, and ATS parsers.
 */
export async function downloadResumeDocx(resumeData) {
  if (!resumeData) return;

  const sections = [];

  // 1. Header: Candidate Full Name
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: (resumeData.fullName || 'RESUME').toUpperCase(),
        bold: true,
        size: 30, // 15pt
        font: 'Times New Roman',
      }),
    ],
  }));

  // 2. Contact Details Line
  const contactParts = [
    resumeData.email,
    resumeData.phone,
    resumeData.location,
    resumeData.linkedin,
    resumeData.portfolio,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    sections.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactParts.join('  |  '),
          size: 19, // 9.5pt
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

  // 3. Professional Summary
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

  // 4. Work Experience
  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    sections.push(createSectionHeader('Experience'));
    for (const exp of resumeData.experience) {
      sections.push(new Paragraph({
        spacing: { before: 100, after: 40 },
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
            text: (exp.startDate || exp.endDate) ? ` (${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})` : '',
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

  // 5. Projects
  if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
    sections.push(createSectionHeader('Projects'));
    for (const proj of resumeData.projects) {
      sections.push(new Paragraph({
        spacing: { before: 90, after: 30 },
        children: [
          new TextRun({
            text: `${proj.title || proj.name || 'Project'} `,
            bold: true,
            size: 21,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: proj.tech ? `(${proj.tech})` : (proj.tools ? `(${Array.isArray(proj.tools) ? proj.tools.join(', ') : proj.tools})` : ''),
            italics: true,
            size: 19,
            font: 'Times New Roman',
            color: '555555',
          }),
        ],
      }));

      const bullets = Array.isArray(proj.bullets)
        ? proj.bullets
        : (typeof proj.bullets === 'string' ? proj.bullets.split('\n') : (proj.description ? [proj.description] : []));

      for (const bullet of bullets) {
        const cleanBullet = bullet.replace(/^[•\-*]\s*/, '').trim();
        if (!cleanBullet) continue;
        sections.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
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

  // 6. Education
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

  // 7. Skills
  if (resumeData.skills) {
    sections.push(createSectionHeader('Technical Skills'));
    let skillText = '';
    if (Array.isArray(resumeData.skills)) {
      skillText = resumeData.skills.map(s => typeof s === 'string' ? s : `${s.group}: ${s.items?.join(', ')}`).join('  |  ');
    } else if (typeof resumeData.skills === 'object') {
      skillText = Object.entries(resumeData.skills)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('  |  ');
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

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (resumeData.fullName || 'Resume').replace(/\s+/g, '_');
  link.download = `${safeName}_ATS.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
