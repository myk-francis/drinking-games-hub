"use client";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
import React from "react";

export default function HomePage() {
  // const CheckSession = async () => {
  //   const session = (await cookies()).get("session");
  //   if (!session) redirect("/login");
  // };

  // React.useEffect(() => {
  //   CheckSession();
  // }, []);

  return (
    <main className="p-4">
      <h1>Welcome back!</h1>
    </main>
  );
}
