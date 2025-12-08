import SharedListStudent from "@shared/ListStudent.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerListStudentScreen() {
  const router = useRouter();

  return (
    <>
      <SharedListStudent
        viewMode="manager"
        onAddStudent={() => router.push("/(manager)/students/add")}
        onEditStudent={(studentData) =>
          router.push({
            pathname: "/(manager)/students/edit",
            params: studentData,
          })
        }
      />
    </>
  );
}
