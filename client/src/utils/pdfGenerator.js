import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Use the global jsPDF object from the CDN
const getJsPDF = () => {
  // Check if jsPDF is available globally (from CDN)
  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }

  // Fallback to directly accessing jsPDF if available
  if (window.jsPDF) {
    return window.jsPDF;
  }

  return null;
};

/**
 * Generate a leave request PDF form
 * @param {Object} leaveRequest - The leave request data
 * @param {Object} userData - The user data
 * @returns {Object|null} - The PDF document or null if jsPDF is not available
 */
export const generateLeavePDF = (leaveRequest, userData) => {
  // Get jsPDF constructor
  const jsPDF = getJsPDF();

  // Check if jsPDF is available
  if (!jsPDF) {
    console.error('jsPDF is not available. Please check if the CDN script is loaded correctly.');
    return null;
  }

  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFont('helvetica');

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Formulaire de Demande de Congé', 105, 20, { align: 'center' });

  // Add company information
  doc.setFontSize(12);
  doc.text('Informations sur l\'entreprise : Groupe Délice - Centre Laitier Nord', 20, 40);

  // Add employee section title
  doc.setFontSize(14);
  doc.setTextColor(0, 153, 255);
  doc.text('Employé', 20, 55);
  doc.setDrawColor(0, 153, 255);
  doc.line(20, 57, 50, 57);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  // Add employee information
  doc.text(`Nom de l'employé : ${userData.firstName} ${userData.lastName}`, 20, 65);
  doc.text(`Département et poste : ${userData.department || 'N/A'} - ${userData.role}`, 20, 75);
  doc.text(`Date de début : ${format(new Date(leaveRequest.startDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 85);
  doc.text(`Date de fin : ${format(new Date(leaveRequest.endDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 95);
  doc.text(`Nombre total de jours de congés demandés : ${leaveRequest.numberOfDays}`, 20, 105);
  doc.text(`Type de congé : ${leaveRequest.leaveType}`, 20, 115);

  // Add reason with word wrap
  const reasonText = `Motif(s) du congé : ${leaveRequest.reason}`;
  const splitReason = doc.splitTextToSize(reasonText, 170);
  doc.text(splitReason, 20, 125);

  // Add checkbox
  doc.rect(20, 140, 5, 5);
  doc.text('Je comprends que cette demande est soumise à approbation.', 30, 145);

  // Add submission date
  const submissionDate = leaveRequest.createdAt
    ? format(new Date(leaveRequest.createdAt), 'dd/MM/yyyy', { locale: fr })
    : format(new Date(), 'dd/MM/yyyy', { locale: fr });

  doc.text(`Date de soumission : ${submissionDate}`, 20, 160);
  doc.text(`Signature de l'employé : ____________________`, 20, 170);

  // Add manager section
  doc.setFontSize(14);
  doc.setTextColor(0, 153, 255);
  doc.text('Responsable', 20, 190);
  doc.setDrawColor(0, 153, 255);
  doc.line(20, 192, 70, 192);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  // Add approval checkboxes
  doc.rect(20, 200, 5, 5);
  if (leaveRequest.status === 'Approuvé') {
    doc.setFillColor(0, 0, 0);
    doc.rect(20, 200, 5, 5, 'F');
  }
  doc.text('Congés approuvés', 30, 205);

  doc.rect(20, 210, 5, 5);
  if (leaveRequest.status === 'Rejeté') {
    doc.setFillColor(0, 0, 0);
    doc.rect(20, 210, 5, 5, 'F');
  }
  doc.text('Congés refusés', 30, 215);

  // Add manager remarks
  if (leaveRequest.chefJustification) {
    doc.text('Autres remarques :', 20, 225);
    const splitJustification = doc.splitTextToSize(leaveRequest.chefJustification, 170);
    doc.text(splitJustification, 20, 235);
  } else {
    doc.text('Autres remarques : ____________________', 20, 225);
  }

  // Add manager signature
  doc.text('Signature du responsable et date de signature : ____________________', 20, 250);

  // Add footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Document généré automatiquement par le système HRMS', 105, 280, { align: 'center' });

  return doc;
};

/**
 * Download a leave request as PDF
 * @param {Object} leaveRequest - The leave request data
 * @param {Object} userData - The user data
 * @returns {boolean} - Whether the PDF was successfully generated and downloaded
 */
export const downloadLeavePDF = (leaveRequest, userData) => {
  try {
    const doc = generateLeavePDF(leaveRequest, userData);

    // Check if PDF generation was successful
    if (!doc) {
      alert('La bibliothèque PDF n\'est pas disponible. Veuillez contacter l\'administrateur système.');
      return false;
    }

    // Generate filename
    const fileName = `demande_conge_${userData.firstName}_${userData.lastName}_${format(new Date(leaveRequest.startDate), 'dd-MM-yyyy')}.pdf`;

    // Save the PDF
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Une erreur s\'est produite lors de la génération du PDF. Veuillez réessayer plus tard.');
    return false;
  }
};
