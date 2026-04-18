# ChronoGen — AI-Powered Timetable Generator

A full-stack web application that uses a **Genetic Algorithm** to generate optimized, conflict-free school/college timetables.

## Problem Statement
Traditional timetable scheduling in educational institutions is a complex, time-consuming, and error-prone manual process. It involves balancing numerous constraints, such as teacher availability, classroom capacity, subject hours, and preventing overlaps (clashes). As the number of classes and teachers grows, the possible combinations become astronomical, making it nearly impossible for a human to find an optimal, conflict-free solution.

## Future Aspect
Substitution managment

## Solution
**ChronoGen** solves this by leveraging an **AI-driven Genetic Algorithm (GA)**. By mimicking the process of natural selection, the system explores thousands of potential schedules, iteratively improving them through selection, crossover, and mutation. This automated approach ensures:
- **Zero Conflicts**: No double-booking of teachers, rooms, or classes.
- **Efficiency**: Generates complex schedules in seconds rather than days.
- **Constraint Satisfaction**: Respects teacher-specific preferences and workload limits.
- **Flexibility**: Easily adapts to last-minute changes in staff or infrastructure.

## Reliability & Scalability
- **Reliability**: The system uses a robust fitness-based evaluation to guarantee the validity of the generated timetable. Built on the **MERN stack**, it ensures consistent data persistence and atomic operations via MongoDB, preventing data loss during complex generation cycles.
- **Scalability**: The architecture is designed for growth. The **MongoDB** backend scales horizontally to handle increasing data volumes, while the **Express** API can be load-balanced to support multiple concurrent generation requests. The modular **Genetic Algorithm** engine is decoupled from the UI, allowing it to be scaled independently or even offloaded to worker threads for massive datasets.

## Tech Stack
- **Framework**: Express.js (Backend), React.js (Frontend)
- **Database**: MongoDB (Mongoose ODM)
- **Backend**: Node.js
- **Frontend**: React (Create React App)
- **Algorithm**: Genetic Algorithm (selection, crossover, mutation)
- **Export**: PDF (jsPDF) + Excel (SheetJS)

## Project Structure
```
chrono/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routes
│   ├── middleware/       # JWT auth
│   ├── utils/
│   │   └── geneticAlgorithm.js   # GA engine
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, Teachers, Subjects, Classes, Classrooms, Timeslots, Generate, TimetableView, TeacherDashboard
│       ├── components/  # Layout, Sidebar
│       ├── context/     # AuthContext
│       └── api/         # Axios instance
└── start.bat
```

## Prerequisites
- Node.js >= 18
- MongoDB running locally on port 27017

## Setup & Run

### 1. Start MongoDB
Make sure MongoDB is running locally.

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

### Or use the batch script (Windows):
```
start.bat
```

## Usage Flow

### Admin Workflow
1. **Register/Login** as admin
2. Add **Subjects** by course (BTech, BCS, MCA, etc.)
3. Add **Teachers** with course assignments and availability
4. Add **Classrooms** with capacity and lab specifications
5. Add **Classes** with subject-teacher assignments
6. Configure **Time Slots** (days + periods)
7. **Generate Timetables** → set GA parameters → generate
8. **Edit Timetables** using drag-drop with conflict detection
9. **Manage Substitutes** and teacher unavailabilities
10. **Generate Exam Schedules** with conflict resolution
11. **Export** timetables as PDF or Excel

### Teacher Workflow
1. **Login** as teacher
2. View **Personal Timetable** and workload
3. **Request Substitutes** for unavailable periods
4. **Manage Availability** and leave requests
5. **View Substitute Assignments** and swap requests

### Student Workflow
1. **Login** as student
2. **Create Personal Schedules** for study planning
3. **View Class Timetables** and exam schedules
4. **Export Personal Schedules** as PDF


## Database Schema
The system uses **MongoDB** with **Mongoose** models. Below is the relational structure:

### 1. User
- `name` (String, Required)
- `email` (String, Unique, Required)
- `password` (String, Required)
- `role` (Enum: ['admin', 'viewer'])

### 2. Subject
- `name` (String, Required)
- `code` (String)
- `hoursPerWeek` (Number, Default: 3)
- `isLab` (Boolean)
- `createdBy` (Ref: User)

### 3. Teacher
- `name` (String, Required)
- `email` (String)
- `subjects` (Array of Ref: Subject)
- `availability` (Array of {day, periods[]})
- `maxHoursPerDay` (Number)
- `maxHoursPerWeek` (Number)
- `createdBy` (Ref: User)

### 4. Classroom
- `name` (String, Required)
- `capacity` (Number)
- `isLab` (Boolean)
- `building` (String)
- `createdBy` (Ref: User)

### 5. Class
- `name` (String, Required)
- `section` (String)
- `strength` (Number)
- `subjects` (Array of {subject, teacher})
- `createdBy` (Ref: User)

### 6. Timeslot
- `days` (Array of String)
- `periods` (Array of {periodNumber, startTime, endTime, isBreak})
- `createdBy` (Ref: User)

### 8. Schedule
- `name` (String, Required)
- `type` (Enum: ['personal', 'exam'])
- `entries` (Array of {day, period, subject, description, location})
- `createdBy` (Ref: User)
- `targetClass` (Ref: Class) // For exam schedules

### 9. Substitute
- `originalTeacher` (Ref: Teacher, Required)
- `substituteTeacher` (Ref: Teacher, Required)
- `date` (Date, Required)
- `period` (Number, Required)
- `class` (Ref: Class, Required)
- `subject` (Ref: Subject, Required)
- `reason` (String)
- `status` (Enum: ['pending', 'approved', 'rejected'])
- `type` (Enum: ['admin_assigned', 'teacher_swap'])
- `createdBy` (Ref: User)

### 10. TeacherUnavailability
- `teacher` (Ref: Teacher, Required)
- `startDate` (Date, Required)
- `endDate` (Date, Required)
- `reason` (Enum: ['leave', 'exam_duty', 'event', 'meeting', 'training'])
- `description` (String)
- `status` (Enum: ['pending', 'approved', 'rejected'])
- `affectedPeriods` (Array of {date, period, class, subject})
- `substituteAssignments` (Array of Ref: Substitute)
- `createdBy` (Ref: User)

## Key Features
- **Smart Generation**: Automated scheduling using Genetic Algorithm logic.
- **Conflict Management**: Ensures no teacher, class, or room is double-booked.
- **Workload Balancing**: Respects teacher availability and maximum working hours.
- **Interactive UI**: Responsive dashboard for data entry and timetable visualization.
- **Role-Based Access**: Support for Admin, Teacher, and Student roles with different interfaces.
- **Course Organization**: Teachers and subjects grouped by courses (BTech, BCS, MCA, MBA, MSc).
- **Drag-Drop Editing**: Manual timetable editing with real-time conflict detection.
- **Personal Scheduling**: Students can create and manage personal schedules.
- **Exam Scheduling**: Automated exam timetable generation with conflict detection.
- **Substitute Management**: Comprehensive substitute teacher system with auto-assignment.
- **Unavailability Tracking**: Teacher leave management with automatic substitute assignment.
- **Bulk Operations**: Bulk selection and deletion across Teachers, Subjects, and Classrooms.
- **Filtering**: View timetables by Class, Teacher, or Subject.
- **Exporting**: One-click download as PDF or Excel files.
- **Teacher Insights**: Dedicated dashboard for teacher workload analysis.

## Genetic Algorithm Details
- **Selection**: Tournament selection (k=3) picks the best candidates for reproduction.
- **Crossover**: Single-point crossover combines parents to create offspring.
- **Mutation**: Randomly reassigns day, period, or classroom to maintain diversity.
- **Fitness Evaluation**:
  The algorithm calculates a fitness score between `0` and `1`. A score of `1.0` represents a perfect, conflict-free timetable.
  Conflicts that reduce the fitness score include:
  - **Teacher Clash**: A teacher assigned to multiple classes at the same time.
  - **Class Clash**: A class assigned to multiple subjects/teachers at the same time.
  - **Room Clash**: A classroom occupied by multiple classes at the same time.
  - **Daily Overload**: A teacher exceeding their configured `maxHoursPerDay`.
  - **Availability**: Scheduling a teacher during their specified unavailable slots.
- **Elitism**: The best chromosome from each generation is automatically carried over to the next.

## Team Roles & Project Division (Team of 4)
To efficiently develop and maintain **ChronoGen**, tasks are divided into four specific roles:

### **1. Frontend Developer — Siddharth Agarwal**
- **Focus**: User interface, client-side state, and responsive design.
- **Key Files**: [App.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/frontend/src/App.js), [Dashboard.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/frontend/src/pages/Dashboard.js), [TimetableView.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/frontend/src/pages/TimetableView.js).
- **Responsibilities**:
    - Build interactive UI components and dashboard pages.
    - Implement the Timetable Grid and visualization filters.
    - Handle frontend state management and API data fetching.
    - Ensure a smooth and modern user experience.

### **2. Backend Developer — Vijay Singh Bisht**
- **Focus**: Server architecture, API routing, and system security.
- **Key Files**: [server.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/server.js), [auth.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/routes/auth.js), [export.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/routes/export.js).
- **Responsibilities**:
    - Build and maintain REST API endpoints.
    - Implement authentication and middleware logic.
    - Handle PDF and Excel file generation for export.
    - Manage project environment and dependencies.

### **3. Database Developer — Divyansh Rautela**
- **Focus**: Data modeling, persistence, and relational integrity.
- **Key Files**: [models/](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/models/), [User.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/models/User.js), [Timetable.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/models/Timetable.js).
- **Responsibilities**:
    - Design and manage Mongoose schemas and MongoDB collections.
    - Ensure data integrity between classes, teachers, and subjects.
    - Optimize database queries for fetching constraints and results.
    - Maintain the Database Schema documentation.

### **4. Algorithm (Algo) Specialist — Garhvit Singh Negi**
- **Focus**: Core logic of the Genetic Algorithm and scheduling optimization.
- **Key Files**: [geneticAlgorithm.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/utils/geneticAlgorithm.js), [timetable.js](file:///c%3A/Users/Lenovo/OneDrive/Desktop/chrono/backend/routes/timetable.js).
- **Responsibilities**:
    - Refine the Genetic Algorithm (Fitness, Crossover, Mutation).
    - Implement conflict resolution logic for teachers and classrooms.
    - Handle complex scheduling constraints and workload balancing.
    - Tune GA parameters to ensure optimal and valid results.

*Each team member will be contributing to the project and in the GitHub repository based on their respective roles.*

## API Endpoints
 __________________________________________________________________________________________
|                     |                                      |                            |
|  Method             | Endpoint                             | Description                |
|---------------------|--------------------------------------|----------------------------|
| POST                | /api/auth/register                   | Register admin             |
| POST                | /api/auth/login                      | Login                      |
| GET/POST/PUT/DELETE | /api/teachers                        | CRUD teachers              |
| GET/POST/PUT/DELETE | /api/subjects                        | CRUD subjects              |
| GET/POST/PUT/DELETE | /api/classes                         | CRUD classes               |
| GET/POST/PUT/DELETE | /api/classrooms                      | CRUD classrooms            |
| GET/POST/PUT/DELETE | /api/timeslots                       | CRUD timeslot config       |
| POST                | /api/timetable/generate              | Run GA & generate timetable|
| GET                 | /api/timetable                       | List all timetables        |
| GET                 | /api/timetable/:id                   | Get timetable              |
| PUT                 | /api/timetable/:id/entry             | Update timetable entry     |
| GET                 | /api/timetable/:id/teacher-dashboard | Teacher workload           |
| GET/POST/PUT/DELETE | /api/schedules                       | CRUD personal/exam schedules|
| GET/POST/PUT/DELETE | /api/substitutes                     | CRUD substitute assignments|
| POST                | /api/substitutes/auto-assign         | Auto-assign substitutes    |
| GET/POST/PUT/DELETE | /api/unavailability                  | CRUD teacher unavailability|
| POST                | /api/unavailability/conflicts        | Check unavailability conflicts|
| GET                 | /api/export/:id/pdf                  | Export PDF                 |
| GET                 | /api/export/:id/excel                | Export Excel               |
|_____________________|______________________________________|____________________________|

























