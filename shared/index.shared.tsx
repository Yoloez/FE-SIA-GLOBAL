/**
 * Shared Components Index
 *
 * This file re-exports all shared components for easier imports.
 * Instead of: import AddClasses from '../../../shared/AddClasses'
 * Use: import { AddClasses } from '@shared'
 *
 * Note: Make sure tsconfig.json has path alias configured:
 * "@shared/*": ["./shared/*"]
 */

// Class Management
export { default as ClassDetail } from "./[classId].shared";
export { default as AddClasses } from "./AddClasses.shared";
export { default as EditClasses } from "./EditClasses.shared";
export { default as ListClasses } from "./ListClasses.shared";

// Subject Management
export { default as AddSubjects } from "./AddSubjects.shared";
export { default as EditSubject } from "./EditSubject.shared";
export { default as ListSubjects } from "./ListSubjects.shared";

// Lecturer Management
export { default as AddLecturer } from "./AddLecturer.shared";
export { default as EditLecturer } from "./EditLecturer.shared";
export { default as ListLecturer } from "./ListLecturer.shared";

// Student Management
export { default as AddStudent } from "./AddStudent.shared";
export { default as EditStudent } from "./EditStudent.shared";
export { default as ListStudent } from "./ListStudent.shared";

// Member Assignment
export { default as AssignMember } from "./AssignMember.shared";

// Notification
export { default as Notification } from "./Notification.shared";
