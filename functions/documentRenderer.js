// Renders a { title, sections } document (see agents/documentBuilder.js) to
// a PDF buffer with pdfkit. Kept separate from the agent itself so the same
// structured content that feeds the builder UI's live preview is also what
// produces the downloadable file — one source of truth, two outputs.
const PDFDocument = require('pdfkit');

/**
 * @param {{ title: string, sections: { heading: string, body: string }[] }} content
 * @returns {Promise<Buffer>}
 */
function renderDocumentPdf({ title, sections }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(24).text(title);
    doc.moveDown(1.2);

    sections.forEach((section) => {
      doc.font('Helvetica-Bold').fontSize(14).text(section.heading);
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(11).text(section.body, { lineGap: 3 });
      doc.moveDown(1);
    });

    doc.end();
  });
}

module.exports = { renderDocumentPdf };
