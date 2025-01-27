"use client";

import { AgreementCard } from "@/components/AgreementCard/AgreementCard";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Modal,
  Group,
  Button,
  TextInput,
  NativeSelect,
  Stack,
  FileInput,
  Skeleton,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconFileCv } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import axios from "axios";
import Script from "next/script";

declare global {
  interface Window {
    docuSignClick?: any;
  }
}

export default function DashboardHome() {
  const icon = <IconFileCv size={18} stroke={1.5} />;

  const [agreements, setAgreements] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  async function fetchData() {
    const supabase = await createClient();
    const user = await supabase.auth.getUser();
    if (!user) {
      notifications.show({
        title: "User Not Found",
        message: "User not found",
        color: "red",
        autoClose: 5000,
      });
    }

    const { data, error } = await supabase
      .from("agreements") // Replace with your agreements table name
      .select(
        `
      *,
      reviewers!inner(email)
    `,
      )
      .eq("reviewers.email", user.data?.user?.email);

    if (error) {
      notifications.show({
        title: "Agreements Not Found",
        message: "Error fetching agreements",
        color: "red",
        autoClose: 5000,
      });
      return;
    }
    setAgreements(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      title: "",
      description: "",
      agreementType: "Service Agreement",
      agreementStatus: "Draft",
      riskLevel: "Low",
      agreement: "",
    },
  });

  return (
    <>
      {shouldRender && (
        <>
          <Script
            src="https://demo.docusign.net/clickapi/sdk/latest/docusign-click.js"
            strategy="lazyOnload"
            onLoad={() => console.log("DocuSign Clickwrap SDK loaded")}
          />
          <div id="ds-clickwrap"></div>
        </>
      )}
      <Container>
        <Group justify="space-between">
          <div className="flex flex-col">
            <Title order={1}>Review Agreements</Title>
            <Text size="lg" mt={5} mb={20}>
              Here you can see all the agreements that you have been assigned to
              review.
            </Text>
          </div>
        </Group>
        <Skeleton visible={loading}>
          <SimpleGrid cols={3} spacing="lg">
            {/* loop over agreements */}
            {agreements?.map((agreement) => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                isReview
              />
            ))}
          </SimpleGrid>
        </Skeleton>
      </Container>
    </>
  );
}
