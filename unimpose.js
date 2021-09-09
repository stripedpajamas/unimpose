const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function main(input, output) {
    console.log('Reading input file', input);
    const inputDoc = await PDFDocument.load(fs.readFileSync(input));
    const outputDoc = await PDFDocument.create();

    const rights = await PDFDocument.create();
    const lefts = await PDFDocument.create();

    for (let i = 0; i < inputDoc.getPageCount(); i++) {
        const [currentPageRight] = await rights.copyPages(inputDoc, [i]);
        const [currentPageLeft] = await lefts.copyPages(inputDoc, [i]);

        currentPageRight.setWidth(currentPageRight.getWidth() / 2);
        currentPageRight.translateContent(-currentPageRight.getWidth(), 0);

        currentPageLeft.setWidth(currentPageLeft.getWidth() / 2);

        rights.addPage(currentPageRight);
        lefts.addPage(currentPageLeft);
    }

    // copy out of temp and into output, interleaving
    const rightPages = await outputDoc.copyPages(rights, rights.getPageIndices());
    const leftPages = await outputDoc.copyPages(lefts, lefts.getPageIndices());

    // insert the beginning pages into the output document
    for (let j = 0; j < inputDoc.getPageCount(); j++) {
        const page = j % 2 === 0 ? rightPages[j] : leftPages[j];
        outputDoc.addPage(page);
    }

    // now add the end pages, starting from the end of the input doc
    for (let j = inputDoc.getPageCount() - 1; j >= 0; j--) {
        const page = j % 2 === 0 ? leftPages[j] : rightPages[j];
        outputDoc.addPage(page);
    }

    console.log('Writing output file', output);
    const bytes = await outputDoc.save();
    fs.writeFileSync(output, bytes);
}

main(...process.argv.slice(2)).catch(console.error);
