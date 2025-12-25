import { toPng } from 'html-to-image';
import jspdf from 'jspdf';

export const PdfService = {
    async download(element: HTMLElement | null, company: string, position: string): Promise<void> {
        if (!element) return;

        try {
            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                height: element.scrollHeight,
                style: {
                    overflow: 'visible',
                    height: 'auto',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    padding: '10px'
                }
            });

            const pdf = new jspdf('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeightInMm = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeightInMm;
            let positionInPdf = 0;

            pdf.addImage(dataUrl, 'PNG', 0, positionInPdf, pdfWidth, imgHeightInMm);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                positionInPdf = heightLeft - imgHeightInMm;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, positionInPdf, pdfWidth, imgHeightInMm);
                heightLeft -= pageHeight;
            }

            const cleanFileName = `${company}_${position}`.replace(/[/\\?%*:|"<> ]/g, '_');
            pdf.save(`${cleanFileName}.pdf`);
        } catch (error) {
            console.error('PDF Error:', error);
        }
    }
};