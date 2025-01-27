// give me a basic layout for the dashboard using the Mantine library and NavbarMinimal compnent

import { Container, Title } from "@mantine/core";
import { NavbarMinimalColored } from "@/components/NavbarMinimalColored/NavbarMinimalColored";
import Script from "next/script";

import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex w-full">
      <NavbarMinimalColored />
      <Container my={50}>{children}</Container>
      <Script src="https://demo.docusign.net/clickapi/sdk/latest/docusign-click.js"></Script>
    </div>
  );
}
