const fs = require('fs');
const path = require('path');

function getDirectoryStructure(dir, exclude = ['node_modules', '.git']) {
    let result = {};
    fs.readdirSync(dir).forEach(file => {
        if (exclude.includes(file)) return;
        let fullPath = path.join(dir, file);
        result[file] = fs.statSync(fullPath).isDirectory() ? getDirectoryStructure(fullPath, exclude) : 'file';
    });
    return result;
}

fs.writeFileSync('project-structure.json', JSON.stringify(getDirectoryStructure(__dirname), null, 2));
console.log('Project structure saved to project-structure.json');
