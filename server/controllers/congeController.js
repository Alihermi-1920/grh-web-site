// server/controllers/congeController.js
const Conge = require('../models/conge');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const fs = require('fs');
const path = require('path');

// Default annual leave days
const DEFAULT_ANNUAL_LEAVE_DAYS = 30;

// Create a new leave request
exports.createConge = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request query:', req.query);

    // Log all fields in the request body
    for (const key in req.body) {
      console.log(`${key}: ${req.body[key]}`);
    }

    // Try to get employee ID from all possible sources
    let employee = req.body.employee ||
                  req.body.employeeId ||
                  req.body.employee_id ||
                  req.query.employee ||
                  req.query.employeeId ||
                  req.query.employee_id;

    // Get other fields from body
    const { leaveType, startDate, endDate, numberOfDays, reason, isMedical } = req.body;

    console.log('Employee ID from various sources:');
    console.log('- Body employee:', req.body.employee);
    console.log('- Body employeeId:', req.body.employeeId);
    console.log('- Body employee_id:', req.body.employee_id);
    console.log('- Query employee:', req.query.employee);
    console.log('- Query employeeId:', req.query.employeeId);
    console.log('- Query employee_id:', req.query.employee_id);
    console.log('- Final:', employee);

    // If still no employee ID, try to parse it from the request body as a string
    if (!employee && req.body && typeof req.body === 'string') {
      try {
        const bodyObj = JSON.parse(req.body);
        employee = bodyObj.employee || bodyObj.employeeId || bodyObj.employee_id;
        console.log('- Parsed from body string:', employee);
      } catch (e) {
        console.log('Failed to parse body as JSON:', e.message);
      }
    }

    // If still no employee ID, try to get it from the URL parameters
    if (!employee && req.params) {
      employee = req.params.employee || req.params.employeeId || req.params.employee_id;
      console.log('- From URL params:', employee);
    }

    // Last resort: try to find any field that looks like an ObjectId
    if (!employee) {
      console.log('Searching for ObjectId-like fields in request body:');
      for (const key in req.body) {
        const value = req.body[key];
        if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
          console.log(`Found potential ObjectId in field ${key}:`, value);
          employee = value;
          break;
        }
      }
    }

    if (!employee) {
      console.log('Employee ID is missing in the request');
      return res.status(400).json({ error: "ID d'employé manquant" });
    }

    // Validate employee ID format
    if (!employee.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid employee ID format:', employee);
      return res.status(400).json({ error: "Format d'ID d'employé invalide" });
    }

    console.log('Creating leave request for employee:', employee);

    // Find the employee's chef
    const employeeData = await Employee.findById(employee);
    if (!employeeData) {
      console.log('Employee not found:', employee);
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log("Found employee:", employeeData);
    console.log("Employee's chef:", employeeData.chefId);

    // Make sure we have a chef ID
    if (!employeeData.chefId) {
      console.log('Employee has no chef assigned:', employee);
      return res.status(400).json({ error: 'Aucun chef responsable assigné à cet employé' });
    }

    // Create the leave request
    const conge = new Conge({
      employee,
      chef: employeeData.chefId,
      leaveType,
      startDate,
      endDate,
      numberOfDays: parseInt(numberOfDays),
      reason,
      isMedical: isMedical === 'true',
      status: 'En attente'
    });

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      conge.documents = req.files.map(file => ({
        filePath: '/uploads/' + file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size
      }));
    }

    console.log("Creating leave request:", {
      employee,
      chef: employeeData.chef,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      isMedical,
      documents: conge.documents
    });

    await conge.save();

    // If not a medical leave, update the leave balance
    if (!conge.isMedical) {
      // Find or create leave balance
      let leaveBalance = await LeaveBalance.findOne({ employee });

      if (!leaveBalance) {
        leaveBalance = new LeaveBalance({
          employee,
          totalDays: DEFAULT_ANNUAL_LEAVE_DAYS,
          usedDays: parseInt(numberOfDays),
          remainingDays: DEFAULT_ANNUAL_LEAVE_DAYS - parseInt(numberOfDays),
          medicalDays: 0
        });
      } else {
        leaveBalance.usedDays += parseInt(numberOfDays);
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
      }

      await leaveBalance.save();
    } else {
      // For medical leave, update medical days count
      let leaveBalance = await LeaveBalance.findOne({ employee });

      if (!leaveBalance) {
        leaveBalance = new LeaveBalance({
          employee,
          totalDays: DEFAULT_ANNUAL_LEAVE_DAYS,
          usedDays: 0,
          remainingDays: DEFAULT_ANNUAL_LEAVE_DAYS,
          medicalDays: parseInt(numberOfDays)
        });
      } else {
        leaveBalance.medicalDays += parseInt(numberOfDays);
      }

      await leaveBalance.save();
    }

    res.status(201).json(conge);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Error creating leave request' });
  }
};

// Get all leave requests
exports.getConges = async (req, res) => {
  try {
    const { employeeId, chefId, chef } = req.query;
    let query = {};

    console.log('Query parameters:', req.query);

    if (employeeId) {
      query.employee = employeeId;
    }

    // Support both chefId and chef parameters for backward compatibility
    if (chef || chefId) {
      query.chef = chef || chefId;
    }

    console.log('Final query:', query);

    const conges = await Conge.find(query)
      .populate('employee', 'firstName lastName photo')
      .sort({ createdAt: -1 });

    res.status(200).json(conges);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Error fetching leave requests' });
  }
};

// Get leave balance for an employee
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Getting leave balance for employee:', employeeId);

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log('Employee not found:', employeeId);
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('Employee found:', employee);

    // Find or create leave balance
    let leaveBalance = await LeaveBalance.findOne({ employee: employeeId });
    console.log('Existing leave balance:', leaveBalance);

    if (!leaveBalance) {
      console.log('Creating new leave balance for employee:', employeeId);
      leaveBalance = new LeaveBalance({
        employee: employeeId,
        totalDays: DEFAULT_ANNUAL_LEAVE_DAYS,
        usedDays: 0,
        remainingDays: DEFAULT_ANNUAL_LEAVE_DAYS,
        medicalDays: 0
      });

      await leaveBalance.save();
      console.log('New leave balance created:', leaveBalance);
    } else {
      // Make sure remainingDays is calculated correctly
      leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
      await leaveBalance.save();
      console.log('Updated leave balance:', leaveBalance);
    }

    res.status(200).json(leaveBalance);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: 'Error fetching leave balance' });
  }
};

// Update leave request status
exports.updateCongeStatus = async (req, res) => {
  try {
    const { congeId } = req.params;
    const { status, justification } = req.body;

    const conge = await Conge.findById(congeId);

    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // If rejecting an approved leave, restore the leave balance
    if (conge.status === 'Approuvé' && status === 'Rejeté' && !conge.isMedical) {
      const leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });

      if (leaveBalance) {
        leaveBalance.usedDays -= conge.numberOfDays;
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
        await leaveBalance.save();
      }
    }

    // Update the leave request
    conge.status = status;
    conge.chefJustification = justification;
    await conge.save();

    res.status(200).json(conge);
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: 'Error updating leave request status' });
  }
};

// Delete a leave request
exports.deleteConge = async (req, res) => {
  try {
    const { congeId } = req.params;

    const conge = await Conge.findById(congeId);

    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Delete associated documents
    if (conge.documents && conge.documents.length > 0) {
      conge.documents.forEach(doc => {
        const filePath = path.join(__dirname, '..', '..', 'client', 'public', doc.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // If the leave was approved and not medical, restore the leave balance
    if (conge.status === 'Approuvé' && !conge.isMedical) {
      const leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });

      if (leaveBalance) {
        leaveBalance.usedDays -= conge.numberOfDays;
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
        await leaveBalance.save();
      }
    }

    await conge.remove();

    res.status(200).json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ error: 'Error deleting leave request' });
  }
};
