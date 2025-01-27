"use client";

import { useState } from "react";
import {
  IconCalendarStats,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconGauge,
  IconHome2,
  IconLogout,
  IconReportSearch,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { Center, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import classes from "./NavbarMinimalColored.module.css";
import Image from "next/image";
import { signOutAction } from "@/app/actions";

import { redirect } from "next/navigation";

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  link: string;
  active?: boolean;
  onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={classes.link}
        data-active={active || undefined}
      >
        <Icon size={20} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { icon: IconHome2, label: "Agreements", link: "/agreements" },
  { icon: IconReportSearch, label: "review", link: "/review" },
  { icon: IconUser, label: "Users", link: "/users" },
  { icon: IconSettings, label: "Reset Password", link: "/settings" },
];

export function NavbarMinimalColored() {
  const [active, setActive] = useState(0);

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => {
        setActive(index);
        redirect("/dashboard" + link.link);
      }}
    />
  ));

  return (
    <nav className={classes.navbar}>
      <Center>
        <Image src="/accord_logo.png" alt="Supabase" width={40} height={80} />
      </Center>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <NavbarLink
          icon={IconLogout}
          label="Logout"
          onClick={signOutAction}
          link="/"
        />
      </Stack>
    </nav>
  );
}
