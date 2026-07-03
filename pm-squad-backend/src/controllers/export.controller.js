const PDFDocument = require('pdfkit');
const Task = require('../models/Task');
const User = require('../models/User');

// Human-readable labels for enum values used in exports.
const STATUS_LABELS = {
  todo: 'To Do',
  inprog: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};
const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High' };

// Wrap a value for safe CSV output (quote + escape embedded quotes).
const csvCell = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const formatDate = (date) =>
  date ? new Date(date).toISOString().slice(0, 10) : '';

/**
 * @route   GET /api/export/csv
 * @desc    Export all work tasks as a CSV file.
 * @access  Boss only
 */
const exportCSV = async (req, res) => {
  const tasks = await Task.find({ type: 'work' })
    .populate('owner', 'name')
    .sort({ due: 1, createdAt: -1 });

  const headers = [
    'Title',
    'Type',
    'Owner',
    'Status',
    'Priority',
    'Due Date',
    'Created At',
  ];

  const lines = [headers.map(csvCell).join(',')];

  tasks.forEach((task) => {
    lines.push(
      [
        csvCell(task.title),
        csvCell(task.type),
        csvCell(task.owner ? task.owner.name : ''),
        csvCell(STATUS_LABELS[task.status] || task.status),
        csvCell(PRIORITY_LABELS[task.priority] || task.priority),
        csvCell(formatDate(task.due)),
        csvCell(formatDate(task.createdAt)),
      ].join(',')
    );
  });

  const csv = lines.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=pmsquad-tasks.csv'
  );
  res.status(200).send(csv);
};

/**
 * @route   GET /api/export/pdf
 * @desc    Export a formatted PDF task report.
 * @access  Boss only
 */
const exportPDF = async (req, res) => {
  const [tasks, totalUsers] = await Promise.all([
    Task.find({ type: 'work' })
      .populate('owner', 'name')
      .sort({ due: 1, createdAt: -1 }),
    User.countDocuments({ isActive: true }),
  ]);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  const completionRate =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=pmsquad-report.pdf'
  );

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ---- Header ----
  doc
    .fontSize(20)
    .fillColor('#111827')
    .text('PM Squad — Task Report', { align: 'left' });
  doc
    .moveDown(0.3)
    .fontSize(10)
    .fillColor('#6B7280')
    .text(`Generated: ${new Date().toLocaleString()}`);

  // ---- Team stats ----
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#111827').text('Team Summary');
  doc
    .moveDown(0.3)
    .fontSize(10)
    .fillColor('#374151')
    .text(`Total work tasks: ${tasks.length}`)
    .text(`Completed: ${doneCount} (${completionRate}%)`)
    .text(`Blocked: ${blockedCount}`)
    .text(`Active team members: ${totalUsers}`);

  // ---- Table ----
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#111827').text('Tasks');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const cols = {
    title: { x: 50, width: 170 },
    owner: { x: 220, width: 100 },
    status: { x: 320, width: 80 },
    priority: { x: 400, width: 70 },
    due: { x: 470, width: 80 },
  };

  // Header row.
  doc.fontSize(9).fillColor('#6B7280');
  doc.text('Title', cols.title.x, tableTop, { width: cols.title.width });
  doc.text('Owner', cols.owner.x, tableTop, { width: cols.owner.width });
  doc.text('Status', cols.status.x, tableTop, { width: cols.status.width });
  doc.text('Priority', cols.priority.x, tableTop, {
    width: cols.priority.width,
  });
  doc.text('Due', cols.due.x, tableTop, { width: cols.due.width });

  // Divider line.
  doc
    .moveTo(50, tableTop + 14)
    .lineTo(550, tableTop + 14)
    .strokeColor('#E5E7EB')
    .stroke();

  let y = tableTop + 22;
  doc.fillColor('#111827');

  tasks.forEach((task) => {
    // Page break if we're near the bottom margin.
    if (y > doc.page.height - 70) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(9).fillColor('#111827');
    doc.text(task.title || '', cols.title.x, y, {
      width: cols.title.width,
    });
    doc.text(task.owner ? task.owner.name : '—', cols.owner.x, y, {
      width: cols.owner.width,
    });
    doc.text(STATUS_LABELS[task.status] || task.status, cols.status.x, y, {
      width: cols.status.width,
    });
    doc.text(
      PRIORITY_LABELS[task.priority] || task.priority,
      cols.priority.x,
      y,
      { width: cols.priority.width }
    );
    doc.text(formatDate(task.due) || '—', cols.due.x, y, {
      width: cols.due.width,
    });

    // Advance by the tallest cell (title may wrap to multiple lines).
    const titleHeight = doc.heightOfString(task.title || '', {
      width: cols.title.width,
    });
    y += Math.max(titleHeight, 14) + 6;
  });

  doc.end();
};

module.exports = { exportCSV, exportPDF };
