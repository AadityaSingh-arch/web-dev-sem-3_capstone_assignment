// Demo data:  npm run seed   (WARNING: clears users, departments, grievances, notifications)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Grievance = require('./models/Grievance');
const Notification = require('./models/Notification');

const PASSWORD = 'Password@123';
const DEPTS = [
  { name: 'Academic Affairs', description: 'Courses, timetables and exams', categories: ['Academic', 'Examination'] },
  { name: 'Hostel & Mess', description: 'Accommodation and food', categories: ['Hostel', 'Mess & Food'] },
  { name: 'Infrastructure & IT', description: 'Buildings, Wi-Fi and labs', categories: ['Infrastructure', 'IT & Network'] },
  { name: 'Administration', description: 'Library, transport, fees', categories: ['Library', 'Transport', 'Finance', 'Other'] },
  { name: 'Student Welfare', description: 'Harassment and welfare issues', categories: ['Harassment'] },
];
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Department.deleteMany(), Grievance.deleteMany(), Notification.deleteMany()]);
  const depts = await Department.create(DEPTS);

  await User.create({ name: 'Admin User', email: 'admin@campusvoice.test', password: PASSWORD, role: 'admin' });
  const officers = [];
  for (const d of depts) {
    const slug = d.name.split(/[ &]/)[0].toLowerCase();
    officers.push(await User.create({ name: `${d.name} Officer`, email: `officer.${slug}@campusvoice.test`, password: PASSWORD, role: 'officer', department: d._id }));
  }
  const student = await User.create({ name: 'Riya Sharma', email: 'student@campusvoice.test', password: PASSWORD, role: 'complainant', userType: 'student' });
  const staff = await User.create({ name: 'Mr. Verma', email: 'staff@campusvoice.test', password: PASSWORD, role: 'complainant', userType: 'staff' });

  const mk = (n, over) => {
    const dept = depts.find((d) => d.categories.includes(over.category));
    const officer = officers.find((o) => String(o.department) === String(dept._id));
    return { complainant: n, department: dept._id, assignedOfficer: officer._id, ...over };
  };
  await Grievance.create([
    mk(student, { title: 'Wi-Fi not working in Hostel Block B', description: 'The Wi-Fi has been down for three days on floors 2 and 3.', category: 'IT & Network', priority: 'high', createdAt: hoursAgo(72), statusHistory: [{ status: 'pending', remarks: 'Grievance submitted' }] }),
    mk(student, { title: 'Mess food quality is poor', description: 'Dinner has been undercooked several times this week.', category: 'Mess & Food', priority: 'medium', status: 'in_progress', createdAt: hoursAgo(48), statusHistory: [{ status: 'pending', remarks: 'Grievance submitted' }, { status: 'in_progress', remarks: 'Inspection scheduled' }] }),
    mk(student, { title: 'Library books not available', description: 'Core textbooks for semester 5 are missing from the library.', category: 'Library', priority: 'low', status: 'resolved', resolvedAt: hoursAgo(20), createdAt: hoursAgo(120), statusHistory: [{ status: 'pending', remarks: 'Grievance submitted' }, { status: 'resolved', remarks: 'New copies ordered and shelved' }] }),
    mk(staff, { title: 'Projector broken in Room 204', description: 'The projector in Room 204 is not powering on.', category: 'Infrastructure', priority: 'urgent', createdAt: hoursAgo(10), statusHistory: [{ status: 'pending', remarks: 'Grievance submitted' }] }),
    mk(staff, { title: 'Marks mismatch in internal exam', description: 'Internal marks in the portal differ from the evaluated sheet.', category: 'Examination', priority: 'medium', status: 'resolved', resolvedAt: hoursAgo(30), createdAt: hoursAgo(96), statusHistory: [{ status: 'pending', remarks: 'Grievance submitted' }, { status: 'resolved', remarks: 'Marks corrected' }] }),
  ].map((g) => ({ ...g })));

  console.log('Seeded. Demo logins (password: ' + PASSWORD + '):');
  console.log('  admin@campusvoice.test | officer.academic@campusvoice.test | officer.hostel@campusvoice.test');
  console.log('  officer.infrastructure@campusvoice.test | officer.administration@campusvoice.test | officer.student@campusvoice.test');
  console.log('  student@campusvoice.test | staff@campusvoice.test');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
