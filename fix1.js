const fs = require('fs'); 
const file = 'frontend/src/components/Layout/Sidebar.tsx'; 
let c = fs.readFileSync(file, 'utf8'); 
c = c.replace(/\{ to: '\/gate-pass',\s*label: 'Gate Pass',[^}]+\},/g, ''); 
c = c.replace(/label: 'Staff Gate Pass'/g, "label: 'Gate Pass'"); 
fs.writeFileSync(file, c);
