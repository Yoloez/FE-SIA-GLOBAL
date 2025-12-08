import SharedEditStudent from "@shared/EditStudent.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerEditStudentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialData = {
    full_name: params.name as string,
    nim: params.nim as string,
    email: params.email as string,
    program: params.program as string,
    image: params.image as string,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedEditStudent viewMode="manager" studentId={params.id as string} initialData={initialData} onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
