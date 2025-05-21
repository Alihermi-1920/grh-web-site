// src/utils/credentialPdfGenerator.js
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Generate a welcome PDF with employee credentials
 * @param {Object} employee - Employee data
 * @param {string} type - 'digital' or 'letter'
 * @returns {jsPDF} PDF document
 */
export const generateCredentialPDF = (employee, type = 'digital') => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Define colors
  const primaryColor = [25, 118, 210]; // #1976d2
  const secondaryColor = [66, 165, 245]; // #42a5f5
  const textColor = [33, 33, 33]; // #212121
  const accentColor = [0, 150, 136]; // #009688

  // Set up document
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Format date
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  // Common header for both types
  const addHeader = () => {
    // Add logo/header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Add company name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('DELICE CENTRE LAITIER NORD', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Système de Gestion des Ressources Humaines', pageWidth / 2, 30, { align: 'center' });
  };

  // Common footer for both types
  const addFooter = () => {
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Delice Centre Laitier Nord - HRMS', margin, pageHeight - 10);

    doc.text(`Généré le ${currentDate}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Add header
  addHeader();

  // Different content based on type
  if (type === 'digital') {
    // Digital version (for email)

    // Welcome message
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Bienvenue chez Delice Centre Laitier Nord', pageWidth / 2, 60, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Cher/Chère ${employee.firstName} ${employee.lastName},`, margin, 80);

    const welcomeText =
      "Nous sommes ravis de vous accueillir dans notre équipe! Voici vos identifiants " +
      "de connexion pour accéder à notre système de gestion des ressources humaines.";

    doc.text(welcomeText, margin, 90, {
      maxWidth: contentWidth,
      align: 'left'
    });

    // Credentials box
    doc.setDrawColor(...primaryColor);
    doc.setFillColor(240, 247, 255); // Light blue background
    doc.roundedRect(margin, 110, contentWidth, 50, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.text('Vos identifiants de connexion', pageWidth / 2, 120, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.text(`Email: ${employee.email}`, margin + 10, 135);
    doc.text(`Mot de passe: ${employee.password}`, margin + 10, 145);

    // Instructions
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.setFontSize(12);
    doc.text('Important:', margin, 180);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const securityText =
      "Pour des raisons de sécurité, veuillez changer votre mot de passe lors de votre première connexion. " +
      "Si vous rencontrez des difficultés pour vous connecter, veuillez contacter votre chef responsable.";

    doc.text(securityText, margin, 190, {
      maxWidth: contentWidth,
      align: 'left'
    });

    // Contact info
    doc.setFont('helvetica', 'bold');
    doc.text('Pour toute assistance:', margin, 215);
    doc.setFont('helvetica', 'normal');
    doc.text('Service des Ressources Humaines', margin, 225);
    doc.text('Email: rh@delice.tn', margin, 235);
    doc.text('Téléphone: +216 71 123 456', margin, 245);

  } else if (type === 'letter') {
    // Letter version (for printing with fold lines)
    console.log("Generating letter PDF...");

    // Add fold lines
    doc.setDrawColor(180, 180, 180); // Light gray
    doc.setLineDashPattern([3, 3], 0); // Dashed line

    // First fold line at 1/3 of the page
    const firstFoldY = pageHeight / 3;
    doc.line(0, firstFoldY, pageWidth, firstFoldY);

    // Second fold line at 2/3 of the page
    const secondFoldY = (pageHeight / 3) * 2;
    doc.line(0, secondFoldY, pageWidth, secondFoldY);

    // Reset line style
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...textColor);

    // Very small folding instructions
    doc.setFillColor(245, 245, 245);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(4);
    doc.text("PLIER ICI", 5, firstFoldY - 1);
    doc.text("PLIER ICI", 5, secondFoldY - 1);

    // Reset styles
    doc.setTextColor(...textColor);
    doc.setFontSize(11);

    // Simple letter layout
    // Date at top right
    doc.text(`Le ${currentDate}`, pageWidth - margin, 50, { align: 'right' });

    // Recipient info
    doc.setFont('helvetica', 'bold');
    doc.text(`À l'attention de: ${employee.firstName} ${employee.lastName}`, margin, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`CIN: ${employee.cin || 'N/A'}`, margin, 70);
    doc.text(`Département: ${employee.department}`, margin, 80);
    doc.text(`Poste: ${employee.position || 'Nouvel employé'}`, margin, 90);

    // Subject
    doc.setFont('helvetica', 'bold');
    doc.text('Objet: Vos identifiants de connexion au système HRMS', margin, 105);

    // Greeting
    doc.setFont('helvetica', 'normal');
    doc.text(`Cher/Chère ${employee.firstName} ${employee.lastName},`, margin, 120);

    // Welcome text - reduced space between greeting and welcome text
    const letterText1 =
      "Nous vous souhaitons la bienvenue au sein de Delice Centre Laitier Nord. " +
      "Nous sommes ravis de vous compter parmi notre équipe et nous espérons que " +
      "votre intégration se déroulera dans les meilleures conditions.";

    doc.text(letterText1, margin, 130, {
      maxWidth: contentWidth,
      align: 'left'
    });

    // Warning and signature in the middle section (section 2)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('IMPORTANT:', margin, 145);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const warningText =
      "Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre " +
      "première connexion. Si vous ne parvenez pas à vous connecter avec ces identifiants, " +
      "veuillez contacter immédiatement votre chef responsable.";

    doc.text(warningText, margin, 155, {
      maxWidth: contentWidth,
      align: 'left'
    });

    // Signature in middle section
    doc.text('Cordialement,', margin, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('Le Service des Ressources Humaines', margin, 182);
    doc.setFont('helvetica', 'normal');
    doc.text('Delice Centre Laitier Nord', margin, 189);
    doc.text('Email: rh@delice.tn | Tél: +216 71 123 456', margin, 196);

    // Introduction to credentials - at the start of section 3 (bottom third)
    const letterText2 =
      "Vous trouverez ci-dessous vos identifiants de connexion pour accéder à notre " +
      "système :";

    // Position at the start of the bottom third
    doc.text(letterText2, margin, secondFoldY + 15, {
      maxWidth: contentWidth,
      align: 'left'
    });

    // Credentials box in the bottom third (section 3)
    doc.setDrawColor(...primaryColor);
    doc.setFillColor(240, 247, 255); // Light blue background
    doc.roundedRect(margin, secondFoldY + 25, contentWidth, 40, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Identifiants de connexion', margin + 10, secondFoldY + 40);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(`Email: ${employee.email}`, margin + 10, secondFoldY + 50);
    doc.text(`Mot de passe initial: ${employee.password}`, margin + 10, secondFoldY + 60);
  }

  // Add footer
  addFooter();

  return doc;
};

/**
 * Generate and download a welcome PDF with employee credentials
 * @param {Object} employee - Employee data
 * @param {string} type - 'digital' or 'letter'
 */
export const downloadCredentialPDF = (employee, type = 'digital') => {
  try {
    console.log(`Starting PDF generation for type: ${type}`);

    // Validate employee data
    if (!employee || !employee.firstName || !employee.lastName) {
      console.error('Invalid employee data:', employee);
      throw new Error('Invalid employee data for PDF generation');
    }

    const doc = generateCredentialPDF(employee, type);

    // Generate filename
    const dateStr = format(new Date(), 'yyyyMMdd');
    const filePrefix = type === 'digital' ? 'bienvenue' : 'lettre';
    const filename = `${filePrefix}-${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}-${dateStr}.pdf`;

    console.log(`Saving PDF with filename: ${filename}`);

    // Download the PDF
    doc.save(filename);

    console.log(`PDF generation complete for type: ${type}`);
  } catch (error) {
    console.error(`Error generating ${type} PDF:`, error);
    throw error;
  }
};
