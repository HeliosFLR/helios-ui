const fs = require('fs'); fs.writeFileSync('src/app/page.tsx', fs.readFileSync('src/app/page.tsx.new')); console.log('done');
