import SharedEditSubject from "@shared/EditSubject.shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerEditSubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialData = {
    name_subject: params.name as string,
    code_subject: params.code as string,
    sks: params.credits as string,
    semester: params.semester as string,
  };

  return <SharedEditSubject viewMode="manager" subjectId={params.id as string} initialData={initialData} onBack={() => router.back()} onSuccess={() => router.back()} />;
}
