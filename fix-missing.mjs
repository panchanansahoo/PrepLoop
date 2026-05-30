import fs from 'fs';
import path from 'path';

const fixes = {
    'C:/Users/panch/Desktop/Preploop/frontend/src/components/editor/DSAToolbar.jsx': ['Keyboard'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/AptitudeResults.jsx': ['TrendingUp'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/CompanyInterview.jsx': ['Settings'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/Home.jsx': ['Flame', 'Layers'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/LiveCodingCopilot.jsx': ['TrendingUp'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/Overview.jsx': ['Code'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/ProblemExplorer.jsx': ['Target', 'BarChart2', 'History'],
    'C:/Users/panch/Desktop/Preploop/frontend/src/pages/SQLLearningPath.jsx': ['Target', 'ChevronRight']
};

for (const [file, missingIcons] of Object.entries(fixes)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if there's already a lucide-react import
    if (content.includes("'lucide-react'") || content.includes('"lucide-react"')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/, (match, p1) => {
            const currentImports = p1.split(',').map(s => s.trim()).filter(Boolean);
            for (const icon of missingIcons) {
                if (!currentImports.includes(icon)) {
                    currentImports.push(icon);
                }
            }
            return `import { ${currentImports.join(', ')} } from 'lucide-react';`;
        });
    } else {
        // Add new import statement at the top (after other imports)
        const importStr = `import { ${missingIcons.join(', ')} } from 'lucide-react';\n`;
        // find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importStr);
            content = lines.join('\n');
        } else {
            content = importStr + content;
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
}
