# CampusVoice – ER Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : "has officers"
    DEPARTMENT ||--o{ GRIEVANCE : "handles"
    USER ||--o{ GRIEVANCE : "submits (complainant)"
    USER ||--o{ GRIEVANCE : "is assigned (officer)"
    USER ||--o{ NOTIFICATION : receives
    GRIEVANCE ||--o{ NOTIFICATION : triggers

    USER {
        ObjectId _id
        string name
        string email UK
        string password "bcrypt hash"
        string role "complainant | officer | admin"
        string userType "student | staff"
        ObjectId department FK
        boolean isActive
        string refreshTokenHash
    }
    DEPARTMENT {
        ObjectId _id
        string name UK
        string description
        string[] categories "indexed"
    }
    GRIEVANCE {
        ObjectId _id
        string ticketId UK
        string title
        string description
        string category
        string priority "low | medium | high | urgent"
        string status "pending | in_progress | resolved | rejected"
        ObjectId complainant FK
        ObjectId department FK
        ObjectId assignedOfficer FK
        array statusHistory "status, remarks, changedBy, changedAt"
        array remarks "officer, text, createdAt"
        date resolvedAt
    }
    NOTIFICATION {
        ObjectId _id
        ObjectId user FK
        ObjectId grievance FK
        string type
        string message
        boolean read
    }
```

## Indexes
| Collection | Index | Purpose |
|---|---|---|
| User | `email` (unique), `{role, department}` | login, officer lookup |
| Department | `name` (unique), `categories` | auto-assignment by category |
| Grievance | `ticketId` (unique), `{complainant, createdAt}`, `{assignedOfficer, status}`, `{department, status}`, text(`title`,`description`) | listing, workload, reports, search |
| Notification | `{user, read, createdAt}` | unread counts |
