const fs = require('fs');
const file = 'c:/Users/panch/Desktop/Preploop/frontend/src/pages/Home.jsx';
const content = fs.readFileSync(file, 'utf8');

const faqMarker = '      {/* ═══════════════════════════════════════════════ */}\r\n      {/*                      FAQ                        */}\r\n';
const faqMarkerLF = '      {/* ═══════════════════════════════════════════════ */}\n      {/*                      FAQ                        */}\n';

const communityMarker = '      {/* ═══════════════════════════════════════════════ */}\r\n      {/*           COMMUNITY HUB SECTION                  */}\r\n';
const communityMarkerLF = '      {/* ═══════════════════════════════════════════════ */}\n      {/*           COMMUNITY HUB SECTION                  */}\n';

const fM = content.includes(faqMarker) ? faqMarker : faqMarkerLF;
const cM = content.includes(communityMarker) ? communityMarker : communityMarkerLF;

console.log("faq found? ", content.includes(fM));
console.log("community found? ", content.includes(cM));

if (content.includes(fM) && content.includes(cM)) {
  const i1 = content.indexOf(fM);
  const i2 = content.indexOf(cM);
  
  // Actually, wait, there's a `<GradientDivider />` maybe? No, between FAQ and Community Hub there is no `<GradientDivider />`.
  
  const lastDiv = content.lastIndexOf('    </div>');
  
  const part1 = content.substring(0, i1);
  const faqSection = content.substring(i1, i2);
  const communitySection = content.substring(i2, lastDiv);
  const part3 = content.substring(lastDiv);
  
  fs.writeFileSync(file, part1 + communitySection + '\n' + faqSection + part3, 'utf8');
  console.log('Swapped sections successfully');
} else {
  console.log('Markers not found');
}
