const fs = require('fs');
let content = fs.readFileSync('src/components/FounderProfile.tsx', 'utf8');

// The issue with object-contain is it might leave empty space. 
// Let's use object-cover but position it perfectly centered so the face isn't cut off.
content = content.replace(
  'className="w-full h-full object-contain bg-slate-100"', 
  'className="w-full h-full object-cover object-center"'
);

fs.writeFileSync('src/components/FounderProfile.tsx', content);
console.log("Patched image to object-center");
