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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select()
      .eq("email", user.data?.user?.email);

    if (userError) {
      notifications.show({
        title: "User Not Found",
        message: "User not found",
        color: "red",
        autoClose: 5000,
      });

      return;
    }

    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("created_by", user.data?.user?.id);

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

  async function uploadFile(file: File) {
    const supabase = await createClient();
    console.log(":file", file);
    const fileNameWithoutExtension = file.name.split(".")[0];

    const filepath = fileNameWithoutExtension + "-" + new Date().getTime();
    const { data, error } = await supabase.storage
      .from("agreement-files")
      .upload(filepath, file);
    if (error) {
      notifications.show({
        title: "Default notification",
        message: "Do not forget to star Mantine on GitHub! 🌟",
        color: "red",
        style: { backgroundColor: "red" },
        autoClose: 5000,
      });
    }
    return data;
  }

  const onAddAgreement = async (values: any) => {
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

    const file = values.agreement;
    const fileRes = await uploadFile(file);
    const path = (fileRes as { id: string; path: string; fullPath: string })
      ?.path;

    const fileUri =
      process.env.NEXT_PUBLIC_SUPABASE_URL +
      "/storage/v1/object/public/agreement-files/" +
      path;
    // call api /insights/upload to upload the file tyo gemini ang get the path back
    const { data: fileMetadata } = await axios.post(
      `http://localhost:8000/insights/upload`,
      {
        url: fileUri,
        name: file.name,
      },
    );

    console.log(":fileMetadata", fileMetadata);

    if (!fileMetadata) {
      notifications.show({
        title: "Error",
        message: "Failed to upload file to gemini",
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    const { data, error } = await supabase.from("agreements").insert({
      title: values.title,
      filepath: path,
      status: values.agreementStatus,
      risk: values.riskLevel,
      updated_at: new Date(),
      created_by: user.data?.user?.id,
      type: values.agreementType,
      gemini_filename: fileMetadata?.file?.name,
    });

    if (error) {
      notifications.show({
        title: "Agreement Not Added",
        message: "Error adding agreement",
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    notifications.show({
      title: "Agreement Added",
      message: "Agreement added successfully",
      color: "green",
      autoClose: 5000,
    });
    // Refresh the agreements list after adding a new agreement
    fetchData();
  };

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
      <Modal opened={opened} onClose={close} title="Add Agreement" centered>
        <Stack gap="md">
          <form onSubmit={form.onSubmit((values) => onAddAgreement(values))}>
            <TextInput
              label="Agreement Title"
              key={form.key("title")}
              {...form.getInputProps("title")}
            />
            <Textarea
              label="Description"
              key={form.key("description")}
              {...form.getInputProps("description")}
              withAsterisk
            />
            <NativeSelect
              label="Select Agreement Type"
              key={form.key("agreementType")}
              data={[
                "Service Agreement",
                "Software Agreement",
                "Sales Agreement",
                "Consulting Agreement",
              ]}
              {...form.getInputProps("agreementType")}
            />
            <NativeSelect
              label="Agreement Status"
              key={form.key("agreementStatus")}
              description="Select the status of the agreement"
              data={["Draft", "Active", "Expired", "Cancelled"]}
              {...form.getInputProps("agreementStatus")}
            ></NativeSelect>

            <NativeSelect
              label="Risk Level"
              key={form.key("riskLevel")}
              description="Select Risk Level"
              data={["Low", "Medium", "High"]}
              {...form.getInputProps("riskLevel")}
            />

            <FileInput
              rightSection={icon}
              key={form.key("agreement")}
              label="Attach your Agreement"
              placeholder="Your Agreement"
              rightSectionPointerEvents="none"
              {...form.getInputProps("agreement")}
            />

            <Button type="submit" onClick={close} mt={10}>
              Add Agreement
            </Button>
          </form>
        </Stack>
      </Modal>
      <Container>
        <Group justify="space-between">
          <div className="flex flex-col">
            <Title order={1}>Agreements</Title>
            <Text size="lg" mt={5} mb={20}>
              Here you can see all the agreements that you have created.
            </Text>
          </div>
          <Button onClick={open}>Add Agreement</Button>
        </Group>
        <Skeleton visible={loading}>
          <SimpleGrid cols={3} spacing="lg">
            {/* loop over agreements */}
            {agreements?.map((agreement) => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                isReview={false}
              />
            ))}
          </SimpleGrid>
        </Skeleton>
      </Container>
    </>
  );
}
