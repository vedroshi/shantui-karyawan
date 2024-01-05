const PizZip = require('pizzip')
const docxtemplater = require('docxtemplater')
const fs = require("fs");
const path = require("path");
const expressionParser = require("docxtemplater/expressions")

// Load the docx file as binary content
const content = fs.readFileSync(
    path.join(__dirname, '../templates/PKWT Template.docx'),
    "binary"
);

const docsInit = () =>{
    // Unzip the content of the file
    const zip = new PizZip(content);
    
    // Create new DocxTemplater instance
    // This will parse the template, and will throw an error if the template is
    // invalid, for example, if the template is "{user" (no closing tag)
    const doc = new docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        parser : expressionParser
    });

    return doc
}

module.exports = docsInit
