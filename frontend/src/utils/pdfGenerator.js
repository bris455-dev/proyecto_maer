import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../assets/logo.jpeg';

export const generarPDF = async () => {
  try {
    // Obtener el elemento del contenido de la factura
    const element = document.getElementById('factura-content');
    if (!element) {
      alert('No se encontró el contenido de la factura');
      return;
    }

    // Ocultar botones de acción antes de capturar
    const actionButtons = document.querySelector('.factura-header-actions');
    const originalDisplay = actionButtons?.style.display;
    if (actionButtons) {
      actionButtons.style.display = 'none';
    }

    // Esperar un momento para que se oculte
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capturar el contenido como imagen
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor resolución
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // Restaurar botones
    if (actionButtons) {
      actionButtons.style.display = originalDisplay || '';
    }

    // Calcular dimensiones del PDF
    const imgWidth = 210; // Ancho A4 en mm
    const pageHeight = 297; // Alto A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Crear PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Convertir canvas a imagen
    const imgData = canvas.toDataURL('image/png');

    // Agregar primera página
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Agregar páginas adicionales si es necesario
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Obtener número de factura para el nombre del archivo
    const numeroFactura = document.querySelector('.numero-factura')?.textContent?.replace('N° ', '') || 'factura';
    
    // Guardar PDF
    doc.save(`Factura_${numeroFactura}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
};
