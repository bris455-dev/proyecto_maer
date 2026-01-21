import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generarPDFGrupal = async (grupo, filters) => {
  try {
    // Obtener el elemento del contenido de la factura grupal
    const element = document.getElementById('factura-grupal-content');
    if (!element) {
      alert('No se encontró el contenido de la factura grupal');
      return;
    }

    // Ocultar botones de acción antes de capturar
    const actionButtons = document.querySelector('.export-section');
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

    // Generar nombre del archivo
    const clienteNombre = grupo.cliente.nombre?.replace(/[^a-z0-9]/gi, '_') || 'cliente';
    const fechaDesde = filters.fecha_desde?.replace(/-/g, '') || '';
    const fechaHasta = filters.fecha_hasta?.replace(/-/g, '') || '';
    const nombreArchivo = `FacturaGrupal_${clienteNombre}_${fechaDesde}_${fechaHasta}.pdf`;
    
    // Guardar PDF
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error generando PDF grupal:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
};

