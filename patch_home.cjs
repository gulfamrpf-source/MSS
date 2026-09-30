const fs = require('fs');
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldSection = `{/* FOUNDER PROFILE (Existing) */}
      <div className="bg-white border-t border-slate-100 py-20 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 mb-6 tracking-tight">Our Leadership</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Meet the visionary minds driving our mission to create a more equitable, inclusive, and sensitive society.
        </p>
      </div>`;

home = home.replace(oldSection, "");
fs.writeFileSync('src/pages/Home.tsx', home);
console.log("Patched Home.tsx");
