const express = require('express');
const auth = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const router = express.Router();

router.get('/:id/excel', auth, async (req, res) => {
  const tt = await Timetable.findOne({ _id: req.params.id, createdBy: req.user.id })
    .populate('entries.class entries.subject entries.teacher entries.classroom');
  if (!tt) return res.status(404).json({ message: 'Not found' });

  const workbook = new ExcelJS.Workbook();

  // Group by class
  const byClass = {};
  for (const e of tt.entries) {
    const key = e.class?.name || 'Unknown';
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(e);
  }

  for (const [className, entries] of Object.entries(byClass)) {
    const sheet = workbook.addWorksheet(className);
    const days = [...new Set(entries.map(e => e.day))].sort();
    const periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);

    sheet.addRow(['Period/Day', ...days]);
    for (const period of periods) {
      const row = [`Period ${period}`];
      for (const day of days) {
        const entry = entries.find(e => e.day === day && e.period === period);
        row.push(entry ? `${entry.subject?.name || ''}\n${entry.teacher?.name || ''}` : '-');
      }
      sheet.addRow(row);
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=timetable.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

router.get('/:id/pdf', auth, async (req, res) => {
  const tt = await Timetable.findOne({ _id: req.params.id, createdBy: req.user.id })
    .populate('entries.class entries.subject entries.teacher entries.classroom');
  if (!tt) return res.status(404).json({ message: 'Not found' });

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=timetable.pdf');
  doc.pipe(res);

  doc.fontSize(16).text('ChronoGen - Timetable', { align: 'center' });
  doc.fontSize(10).text(`Fitness Score: ${tt.fitnessScore}% | Generated: ${new Date(tt.createdAt).toLocaleDateString()}`, { align: 'center' });
  doc.moveDown();

  const byClass = {};
  for (const e of tt.entries) {
    const key = e.class?.name || 'Unknown';
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(e);
  }

  for (const [className, entries] of Object.entries(byClass)) {
    doc.fontSize(12).text(`Class: ${className}`, { underline: true });
    doc.moveDown(0.3);

    const days = [...new Set(entries.map(e => e.day))].sort();
    const periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);

    const colW = 100;
    const rowH = 30;
    let x = doc.x;
    let y = doc.y;

    // Header
    doc.fontSize(8).text('Period', x, y, { width: 50 });
    days.forEach((d, i) => doc.text(d, x + 50 + i * colW, y, { width: colW }));
    y += rowH;

    for (const period of periods) {
      doc.text(`P${period}`, x, y, { width: 50 });
      days.forEach((d, i) => {
        const entry = entries.find(e => e.day === d && e.period === period);
        const text = entry ? `${entry.subject?.name || ''} (${entry.teacher?.name || ''})` : '-';
        doc.text(text, x + 50 + i * colW, y, { width: colW });
      });
      y += rowH;
      if (y > 500) { doc.addPage({ layout: 'landscape' }); y = 50; }
    }
    doc.moveDown(2);
  }

  doc.end();
});

module.exports = router;
