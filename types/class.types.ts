// types/class.types.ts
export interface User {
  id_user_si: number;
  name: string;
  email: string;
  profile_image: string;
}

export interface ClassDetails {
  id_class: number;
  code_class: string;
  member_class: number;
  schedule: string;
  subject: {
    id_subject: number;
    name_subject: string;
  };
  academic_period: {
    id: number;
    name: string;
  };
  lecturers: User[];
  students: User[];
}

export const PLACEHOLDER_IMAGE = "https://via.placeholder.com/50";
