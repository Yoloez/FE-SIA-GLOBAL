import SharedListLecturer from "@shared/ListLecturer.shared";
import { useRouter } from "expo-router";
import React from "react";

export default function ManagerListLecturerScreen() {
  const router = useRouter();

  return (
    <>
      <SharedListLecturer
        viewMode="manager"
        onAddLecturer={() => router.push("/(manager)/lecturers/add")}
        onEditLecturer={(lecturerData) =>
          router.push({
            pathname: "/(manager)/lecturers/edit",
            params: {
              id: lecturerData.id,
              name: lecturerData.name,
              nip: lecturerData.nip,
              email: lecturerData.email,
              image: lecturerData.image,
            },
          })
        }
        onBack={() => router.back()}
      />
    </>
  );
}
