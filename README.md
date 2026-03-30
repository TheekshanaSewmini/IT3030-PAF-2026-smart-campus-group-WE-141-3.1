# 🎓 Smart Campus Operations Hub

A full-stack web application developed for the **IT3030 – Programming Applications and Frameworks (PAF) Assignment 2026** at SLIIT.

This system provides a centralized platform to manage **university facilities, bookings, maintenance tickets, and secure access control**, ensuring efficient and organized campus operations.

---

## 🚀 Tech Stack

### 🔹 Backend
- Java Spring Boot (REST API)
- Spring Security
- JPA / Hibernate
- MySQL / PostgreSQL

### 🔹 Frontend
- React.js
- TypeScript (optional)
- Tailwind CSS / Bootstrap

### 🔹 Tools & Technologies
- Git & GitHub
- GitHub Actions (CI/CD)
- Postman (API Testing)

---

## 📌 Implemented Modules

### 🏢 Module A – Facilities & Assets Catalogue
- Manage university resources such as lecture halls, labs, meeting rooms, and equipment
- Store metadata: type, capacity, location, availability, and status
- Perform CRUD operations (Create, Read, Update, Delete)
- Search and filter resources efficiently

---

### 📅 Module B – Booking Management
- Request bookings with date, time range, purpose, and attendees
- Booking workflow: **PENDING → APPROVED / REJECTED → CANCELLED**
- Prevent overlapping bookings for the same resource
- Admin approval/rejection with reasons
- Users can view their bookings; admins can view all

---

### 🛠 Module C – Maintenance & Incident Ticketing
- Create incident tickets for resources or locations
- Include category, description, priority, and contact details
- Upload up to 3 image attachments
- Ticket workflow: **OPEN → IN_PROGRESS → RESOLVED → CLOSED**
- Assign technicians and update resolution notes
- Comment system with ownership rules

---

### 🔐 Module E – Authentication & Authorization
- OAuth 2.0 authentication (Google Sign-In)
- Role-based access control:
  - USER
  - ADMIN
  - TECHNICIAN (optional)
- Secure API endpoints using Spring Security
- Protected frontend routes based on roles

---

## 🏗️ System Architecture

```
[ React Frontend ]
        ↓
[ Spring Boot REST API ]
        ↓
[ Database ]
```

- Client-Server architecture
- Stateless REST API design
- Layered architecture:
  Controller → Service → Repository
- Secure communication with authentication and authorization

---

## 📂 Project Structure

```
smart-campus/
│
├── backend/        # Spring Boot REST API
├── frontend/       # React Client Application
├── docs/           # Diagrams, reports, API documentation
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 Clone Repository
```bash
git clone https://github.com/your-username/repo-name.git
cd repo-name
```

---

### 🔹 Backend Setup (Spring Boot)
```bash
cd backend
# Open project in IntelliJ IDEA or VS Code
# Configure application.properties (database settings)

mvn clean install
mvn spring-boot:run
```

---

### 🔹 Frontend Setup (React)
```bash
cd frontend
npm install
npm start
```

---

## 🧪 Testing & Validation

- API tested using Postman collections
- Validation applied for inputs (e.g., booking conflicts, required fields)
- Proper error handling and HTTP status codes implemented
- Secure file handling for image uploads

---

## 📊 Sample API Endpoints

| Method | Endpoint | Description |
|--------|---------|------------|
| GET | /api/resources | Get all resources |
| POST | /api/resources | Create resource |
| PUT | /api/resources/{id} | Update resource |
| DELETE | /api/resources/{id} | Delete resource |
| POST | /api/bookings | Create booking |
| GET | /api/bookings | Get bookings |
| PUT | /api/bookings/{id} | Update booking |
| POST | /api/tickets | Create ticket |
| PUT | /api/tickets/{id} | Update ticket |
| POST | /api/auth/login | OAuth login |

---

## 👥 Team Members

| Name | GitHub Profile | Responsibilities |
|------|---------------|----------------|
| Theekshana | [Profile](https://github.com/TheekshanaSewmini) | Facilities & Assets Catalogue |
| Danupa | [Profile](https://github.com/GdanupaThamode) | Booking Management |
| Member 3 | - | Maintenance & Incident Ticketing (TBD) |
| Damsi | [Profile](https://github.com/Damsi119) | Authentication & Authorization |

---

## 🔥 Innovation & Additional Features

- Booking conflict validation system
- Role-based UI rendering
- Image upload support for tickets
- Clean and user-friendly interface

---

## 📌 Assignment Details

- **Module:** IT3030 – Programming Applications and Frameworks  
- **Year:** 2026  
- **Institution:** SLIIT  
- **Assignment Type:** Group Coursework  

---

## ⭐ Acknowledgement

Special thanks to the lecturers and instructors for their guidance and support throughout this project.

---
