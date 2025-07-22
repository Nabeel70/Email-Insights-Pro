'use client';

import withAuth from "@/components/with-auth";
import Dashboard from "@/components/dashboard";

function DashboardWrapper() {
  return (
    <Dashboard />
  );
}

export const DashboardClientWrapper = withAuth(DashboardWrapper);
