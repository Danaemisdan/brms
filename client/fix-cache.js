const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('/Users/sanjeevn/Downloads/BRMS/client/app/api', function(filePath) {
    if (filePath.endsWith('route.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('export async function GET') && !content.includes("export const dynamic = 'force-dynamic';")) {
            console.log("Fixing:", filePath);
            fs.writeFileSync(filePath, "export const dynamic = 'force-dynamic';\n" + content, 'utf8');
        }
    }
});
console.log("Done");
