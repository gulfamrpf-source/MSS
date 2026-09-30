const fs = require('fs');
let content = fs.readFileSync('src/components/FounderProfile.tsx', 'utf8');

content = content.replace(
  '<section className="w-full max-w-5xl mx-auto py-16 px-6">', 
  '<section className="w-full bg-white py-24 px-6 border-t border-slate-100">\n      <div className="max-w-6xl mx-auto">'
);

content = content.replace(
  '</section>', 
  '</div>\n    </section>'
);

// We need to just do a smart string replacement:
fs.writeFileSync('src/components/FounderProfile.tsx', content);
console.log("Patched FounderProfile");
