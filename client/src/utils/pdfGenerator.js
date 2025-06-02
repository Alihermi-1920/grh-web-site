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

  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add company name - simple black text
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GROUPE DELICE', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text('CENTRE LAITIER NORD', pageWidth / 2, 25, { align: 'center' });

  // Add title
  doc.setFontSize(14);
  doc.text('DÉCISION DE CONGÉ', pageWidth / 2, 35, { align: 'center' });

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);

  // Reset font
  doc.setFont('helvetica', 'normal');

  // Add date only (reference removed)
  doc.setFontSize(10);
  doc.text(`Date d'émission: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, pageWidth - 20, 50, { align: 'right' });

  // Add employee section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DE L\'EMPLOYÉ', 20, 60);

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, 62, 100, 62);

  // Reset text color and font
  doc.setFont('helvetica', 'normal');

  // Create two columns for employee information
  const col1X = 25;
  const col2X = pageWidth / 2 + 10;
  let currentY = 70;

  // Employee information - Column 1
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nom et prénom:', col1X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userData.firstName} ${userData.lastName}`, col1X + 35, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('CIN:', col1X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userData.cin || 'Non spécifié'}`, col1X + 35, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Département:', col1X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userData.department || 'Non spécifié'}`, col1X + 35, currentY);

  // Employee information - Column 2
  currentY = 70;
  doc.setFont('helvetica', 'bold');
  doc.text('Poste:', col2X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userData.position || userData.role || 'Non spécifié'}`, col2X + 25, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Téléphone:', col2X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userData.phone || 'Non spécifié'}`, col2X + 25, currentY);

  // Add leave request section
  currentY = 95;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE LA DEMANDE DE CONGÉ', 20, currentY);

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, currentY + 2, 140, currentY + 2);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Leave request details
  currentY += 15;

  // Type of leave
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Type de congé: ${leaveRequest.leaveType}`, 25, currentY);

  // Reset font
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Period row
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Période:', 25, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Du ${format(new Date(leaveRequest.startDate), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(leaveRequest.endDate), 'dd/MM/yyyy', { locale: fr })}`, 70, currentY);

  // Number of days row
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre de jours:', 25, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(`${leaveRequest.numberOfDays} jour(s)`, 70, currentY);

  // Reason row
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Motif:', 25, currentY);

  // Add reason with word wrap
  const reasonText = leaveRequest.reason;
  const splitReason = doc.splitTextToSize(reasonText, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(splitReason, 70, currentY);

  // Update Y position based on the number of lines in the reason
  currentY += Math.max(8, splitReason.length * 5);

  // Add submission date
  const submissionDate = leaveRequest.createdAt
    ? format(new Date(leaveRequest.createdAt), 'dd/MM/yyyy', { locale: fr })
    : format(new Date(), 'dd/MM/yyyy', { locale: fr });

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date de soumission:', 25, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(submissionDate, 70, currentY);

  // Add employee signature section
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature de l\'employé:', 25, currentY);

  // Signature line removed - completely removing the line drawing code
  // doc.setDrawColor(0, 0, 0);
  // doc.setLineWidth(0.3);
  // doc.line(70, currentY, 140, currentY);

  // Add chef section - ULTRA SIMPLIFIED VERSION
  currentY += 20;

  // Add chef section header
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉCISION DU CHEF', 20, currentY);

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, currentY + 2, 100, currentY + 2);

  // Chef information
  currentY += 15;

  // Try to get chef information from the leave request
  let chefName = "Non spécifié";
  let chefCIN = "Non spécifié";
  let chefDepartment = userData.department || "Non spécifié";

  if (leaveRequest.chef) {
    if (typeof leaveRequest.chef === 'object') {
      chefName = `${leaveRequest.chef.firstName || ''} ${leaveRequest.chef.lastName || ''}`.trim();
      chefCIN = leaveRequest.chef.cin || "Non spécifié";
      chefDepartment = leaveRequest.chef.department || chefDepartment;
    }
  }

  // Chef information in two columns
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Chef responsable:', 25, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(chefName, 70, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('CIN du chef:', 25, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(chefCIN, 70, currentY);

  // Add approval status
  currentY += 15;

  // Add approval checkboxes
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Approved checkbox
  doc.rect(25, currentY, 8, 8);
  if (leaveRequest.status === 'Approuvé') {
    // Fill the checkbox with black instead of just a checkmark
    doc.setFillColor(0, 0, 0);
    doc.rect(25, currentY, 8, 8, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Approuvé', 40, currentY + 6);

  // Rejected checkbox
  doc.rect(80, currentY, 8, 8);
  if (leaveRequest.status === 'Rejeté') {
    // Fill the checkbox with black instead of just a checkmark
    doc.setFillColor(0, 0, 0);
    doc.rect(80, currentY, 8, 8, 'F');
  }

  doc.text('Refusé', 95, currentY + 6);

  // Add chef statement
  currentY += 15;

  // Add the chef statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let chefStatement = "";

  if (leaveRequest.status === 'Approuvé') {
    chefStatement = `Je soussigné(e) ${chefName}, Chef du département ${chefDepartment}, titulaire de la CIN ${chefCIN}, approuve la demande de congé de ${userData.firstName} ${userData.lastName} (CIN: ${userData.cin || 'Non spécifié'}) pour ${leaveRequest.numberOfDays} jour(s) du ${format(new Date(leaveRequest.startDate), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(leaveRequest.endDate), 'dd/MM/yyyy', { locale: fr })}.`;
  } else if (leaveRequest.status === 'Rejeté') {
    chefStatement = `Je soussigné(e) ${chefName}, Chef du département ${chefDepartment}, titulaire de la CIN ${chefCIN}, n'approuve pas la demande de congé de ${userData.firstName} ${userData.lastName} pour la période spécifiée.`;
  } else {
    chefStatement = `La demande de congé est en attente de décision.`;
  }

  const splitStatement = doc.splitTextToSize(chefStatement, 170);
  doc.text(splitStatement, 25, currentY);

  // Update Y position
  currentY += splitStatement.length * 5;

  // Add signature section
  currentY += 10;

  // Left side - signature
  doc.setFont('helvetica', 'bold');
  doc.text('Signature:', 25, currentY);

  // Signature line removed - completely removing the line drawing code

  // Right side - date
  doc.text('Date:', 120, currentY);
  // Date line removed - completely removing the line drawing code
  // doc.line(140, currentY, 180, currentY);

  // Add the current date if approved or rejected
  if (leaveRequest.status === 'Approuvé' || leaveRequest.status === 'Rejeté') {
    const today = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    doc.setFont('helvetica', 'normal');
    doc.text(today, 140, currentY - 5);
  }

  // Add footer
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Document officiel - Groupe Delice Centre Laitier Nord', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
};

/**
 * Download a leave request as PDF
 * @param {Object} leaveRequest - The leave request data
 * @param {Object} userData - The user data
 * @returns {Promise<boolean>} - Whether the PDF was successfully generated and downloaded
 */
export const downloadLeavePDF = async (leaveRequest, userData) => {
  try {
    console.log('Generating PDF for leave request:', leaveRequest);
    console.log('User data:', userData);

    // Simple approach: Get chef data directly from the employee's profile
    try {
      // First try to get chef data from the messages API (most reliable)
      const chefResponse = await fetch(`http://localhost:5000/api/messages/chef/${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (chefResponse.ok) {
        const chefData = await chefResponse.json();
        console.log('Chef data fetched successfully from messages API:', chefData);

        // Update the leave request with the chef data
        leaveRequest.chef = chefData;
      } else {
        console.log('Failed to fetch chef from messages API, trying employee API...');

        // If that fails, try to get the employee data which includes chefId
        const employeeResponse = await fetch(`http://localhost:5000/api/employees/${userData._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
          }
        });

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          console.log('Employee data fetched:', employeeData);

          if (employeeData.chefId) {
            // Now fetch the chef data using the chefId
            const chefDetailResponse = await fetch(`http://localhost:5000/api/employees/${employeeData.chefId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Cache-Control': 'no-cache'
              }
            });

            if (chefDetailResponse.ok) {
              const chefDetailData = await chefDetailResponse.json();
              console.log('Chef detail data fetched:', chefDetailData);

              // Update the leave request with the chef data
              leaveRequest.chef = chefDetailData;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chef data:', error);
    }

    // If chef is still not found, try to find from all employees
    if (!leaveRequest.chef || typeof leaveRequest.chef === 'string') {
      try {
        console.log('Trying to find chef from employees list...');
        const response = await fetch(`http://localhost:5000/api/employees`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const employees = await response.json();
          console.log('Employees data received:', employees.length);

          // Find the employee with matching ID
          const currentEmployee = employees.find(emp =>
            emp._id === userData._id ||
            emp.id === userData._id
          );

          if (currentEmployee && currentEmployee.chefId) {
            console.log('Found employee with chefId:', currentEmployee);

            // Find the chef in the employees list
            const chef = employees.find(emp =>
              emp._id === currentEmployee.chefId ||
              (typeof currentEmployee.chefId === 'object' && emp._id === currentEmployee.chefId._id)
            );

            if (chef) {
              console.log('Found chef in employees list:', chef);
              leaveRequest.chef = chef;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching employees list:', error);
      }
    }

    // Generate the PDF
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
