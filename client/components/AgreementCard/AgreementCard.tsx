import {
  IconDownload,
  IconBolt,
  IconCross,
  IconCircleX,
  IconX,
} from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { Modak } from "next/font/google";
import { useForm } from "@mantine/form";
import { useDisclosure, useListState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createClient } from "@/utils/supabase/client";
import { UUID } from "crypto";
import { useEffect, useState } from "react";
import { MultiSelectCheckbox } from "../MultiSelectTextBox";
import Image from "next/image";
import axios from "axios";
import { redirect } from "next/dist/server/api-utils";

const avatars = [
  "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png",
  "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-4.png",
  "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png",
];

interface AgreementCardProps {
  agreement: {
    id: UUID;
    filepath: string | null;
    status: "Draft" | "In-Review" | "Active" | "Expired" | "Cancelled";
    title: string;
    description: string;
    gemini_filename: string | null;
  };
  isReview: boolean;
}

const badgeColors = {
  Draft: "grey",
  "In-Review": "yellow",
  Active: "green",
  Expired: "red",
  Cancelled: "red",
};

const downloadAgreement = (filePath: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const fileUrl =
    supabaseUrl +
    "/storage/v1/object/public/" +
    "agreement-files/" +
    filePath +
    "?download";
  return fileUrl;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

interface ComplianceInsight {
  compliant: boolean;
  issues: string[];
}

interface AgreementData {
  complianceInsights: {
    CCPA: ComplianceInsight;
    GDPR: ComplianceInsight;
    HIPAA: ComplianceInsight;
    ISO: ComplianceInsight;
    SOC: ComplianceInsight;
  };
  executiveSummary: {
    agreementPurpose: string;
    partiesInvolved: string[];
    effectiveDate: string | null;
    expiryDate: string | null;
  };
  improvementAreas: string[];
  jurisdiction: {
    disputeResolution: string;
    governingLaw: string;
  };
  keyClauses: {
    clauseName: string;
    description: string;
    priority: string;
  }[];
  negotiationPoints: string[];
  remediationSteps: string[];
  riskAnalysis: string[];
}

const initialData: AgreementData = {
  complianceInsights: {
    CCPA: { compliant: false, issues: [] },
    GDPR: { compliant: false, issues: [] },
    HIPAA: { compliant: false, issues: [] },
    ISO: { compliant: false, issues: [] },
    SOC: { compliant: false, issues: [] },
  },
  executiveSummary: {
    agreementPurpose: "",
    partiesInvolved: [],
    effectiveDate: null,
    expiryDate: null,
  },
  improvementAreas: [],
  jurisdiction: {
    disputeResolution: "",
    governingLaw: "",
  },
  keyClauses: [],
  negotiationPoints: [],
  remediationSteps: [],
  riskAnalysis: [],
};

export function AgreementCard({ agreement, isReview }: AgreementCardProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [aiOpened, { open: aiOpen, close: aiClose }] = useDisclosure(false);
  const [validReviewers, setValidReviewers] = useState<any[]>([]);
  const [agreementReviewers, setAgreementReviewers] = useListState<any>([]);
  const [selectedReviewers, setSelectedReviewers] = useListState<{
    name: string;
    email: string;
    role: string;
    user_id: UUID;
  }>([]);
  // const [data, setData] = useState<any>(data);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AgreementData>(initialData);
  const [url, setUrl] = useState<string | URL | undefined>("");
  useEffect(() => {
    if (agreement.gemini_filename) {
      onFetchAgreementInsights(agreement.gemini_filename);
    }
    fetchAgreeementReviewers();

    if (isReview) {
      fetchDocusignUrl();
    }
  }, [agreement.filepath]);

  async function onAddReviewer(
    values: {
      name: string;
      email: string;
      role: string;
      user_id: UUID;
    }[],
  ) {
    const supabase = await createClient();

    const { error } = await supabase.from("reviewers").insert(
      values.map((reviewer: any) => ({
        agreement_id: agreement.id,
        status: "Pending",
        email: reviewer.email,
        role: reviewer.role,
        user_id: reviewer.user_id,
        name: reviewer.name,
      })),
    );

    if (error) {
      notifications.show({
        title: "Error",
        message: "Failed to add reviewer" + error.message,
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    notifications.show({
      title: "Success",
      message: "Reviewer added successfully",
      color: "green",
      autoClose: 5000,
    });

    const reviewers = values.map((reviewer) => ({
      email: reviewer.email,
      name: reviewer.name,
    }));

    const fileUri =
      process.env.NEXT_PUBLIC_SUPABASE_URL +
      "/storage/v1/object/public/agreement-files/" +
      agreement.filepath;

    const { data: docusignMetadata } = await axios.post(
      `http://localhost:8000/esign/triggerFlow`,
      {
        url: fileUri,
        recipients: reviewers,
        redirectUrl: "http://localhost:3000/dashboard/review",
      },
    );

    // maopthrough docusignMetadata.signingUrls and add it to each reviewer in supabase in the same order
    const signingUrls = docusignMetadata.signingUrls;

    console.log("Signing URLs:", signingUrls);

    for (let i = 0; i < values.length; i++) {
      const { error: updateError } = await supabase
        .from("reviewers")
        .update({ docusign_url: signingUrls[i] })
        .eq("email", values[i].email);

      if (updateError) {
        notifications.show({
          title: "Error",
          message: "Failed to update reviewer signing url",
          color: "red",
          autoClose: 5000,
        });
        return;
      }
    }

    // change status of agreement to In-Review
    const { error: updateError } = await supabase
      .from("agreements")
      .update({ status: "In-Review" })
      .eq("id", agreement.id);

    if (updateError) {
      notifications.show({
        title: "Error",
        message: "Failed to update agreement status",
        color: "red",
        autoClose: 5000,
      });
      return;
    }
  }

  const onFetchAgreementInsights = async (fileName: string): Promise<void> => {
    setLoading(true);
    try {
      const { data: insights } = await axios.post(
        `http://localhost:8000/insights/ongoing`,
        {
          fileUri:
            "https://generativelanguage.googleapis.com/v1beta/" + fileName,
        },
      );
      setData(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch insights",
        color: "red",
        autoClose: 5000,
      });
      return;
    } finally {
      setLoading(false);
    }
  };

  const fetchAgreeementReviewers = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviewers")
      .select("*")
      .eq("agreement_id", agreement.id);

    if (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch reviewers",
        color: "red",
        autoClose: 5000,
      });
      return;
    }
    console.log("Reviewers:", data);
    setAgreementReviewers.setState(data);
  };

  async function fetchValidReviewers() {
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
      .from("users")
      .select("*")
      .not("user_id", "is", null);

    if (error) {
      notifications.show({
        title: "Users Not Found",
        message: "Error fetching users",
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    // filter out users from agreement reviewers
    const reviewers = agreementReviewers.map((reviewer) => reviewer.email);
    const validReviewers = data.filter(
      (user: any) => !reviewers.includes(user.email),
    );
    setValidReviewers(validReviewers);
  }

  async function fetchDocusignUrl() {
    const supabase = await createClient();
    const user = await supabase.auth.getUser();

    if (!user) {
      notifications.show({
        title: "User Not Found",
        message: "User not found",
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    // also match by agreement id
    const { data, error } = await supabase
      .from("reviewers")
      .select("docusign_url")
      .eq("email", user.data?.user?.email)
      .eq("agreement_id", agreement.id);

    console.log("Docusign URL:", data);

    if (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch docusign url",
        color: "red",
        autoClose: 5000,
      });
      return;
    }
    setUrl(data[0].docusign_url);
  }

  useEffect(() => {
    fetchValidReviewers();
  }, []);

  return (
    <>
      <Modal
        opened={aiOpened}
        onClose={aiClose}
        title="AI Insights (Powered by Gemini AI ✨)"
        fullScreen
        radius={0}
        transitionProps={{ transition: "fade", duration: 200 }}
      >
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
        <Title order={2}>Executive Summary</Title>
        <Card padding="md" shadow="xs" radius="md" withBorder>
          <Text size="sm" c="dimmed">
            Agreement Purpose
          </Text>
          <Text size="md" fw={500} mt={5}>
            {data.executiveSummary.agreementPurpose}
          </Text>
          <Text size="sm" c="dimmed" mt={10}>
            Parties Involved
          </Text>
          <Text size="md" fw={500} mt={5}>
            {data.executiveSummary.partiesInvolved.join(", ")}
          </Text>
          <Group mt={10}>
            <div>
              <Text size="sm" c="dimmed">
                Effective Date
              </Text>
              <Text size="md" fw={500} mt={5}>
                {data.executiveSummary.effectiveDate || "Not Specified"}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Expiry Date
              </Text>
              <Text size="md" fw={500} mt={5}>
                {data.executiveSummary.expiryDate || "Not Specified"}
              </Text>
            </div>
          </Group>
        </Card>

        <Title order={2} mt={20} mb={10}>
          Jurisdiction
        </Title>
        <Card padding="md" shadow="xs" radius="md" withBorder>
          <Text size="sm" c="dimmed">
            Governing Law
          </Text>
          <Text size="md" fw={500} mt={5}>
            {data.jurisdiction.governingLaw}
          </Text>
          <Text size="sm" c="dimmed" mt={10}>
            Dispute Resolution
          </Text>
          <Text size="md" fw={500} mt={5}>
            {data.jurisdiction.disputeResolution}
          </Text>
        </Card>

        <Title order={2} mt={20} mb={10}>
          Compliance Insights
        </Title>
        <SimpleGrid cols={5} mt={10}>
          {Object.entries(data.complianceInsights).map(([key, value]) => (
            <Card key={key} padding="md" shadow="xs" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Image
                    src="/compliance.png"
                    height={50}
                    width={50}
                    alt="gdpr logo"
                  />
                  <div>
                    <Text size="lg" fw={500}>
                      {key}
                    </Text>
                    <Badge size="sm" color={value.compliant ? "green" : "red"}>
                      {value.compliant ? "Compliant" : "Non-Compliant"}
                    </Badge>
                    <Text size="sm" mt={5}>
                      {value.issues.join("\n")}
                    </Text>
                  </div>
                </Group>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={2} mt={20} mb={10}>
          Key Clauses
        </Title>
        <Stack gap="md" mt={10}>
          {data.keyClauses.map((clause) => (
            <Card key={clause.clauseName} padding="md" shadow="xs" radius="md">
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text size="lg" fw={500}>
                    {clause.clauseName}
                  </Text>
                  <Text size="sm" mt={5}>
                    {clause.description}
                  </Text>
                </Stack>
                <Badge
                  size="sm"
                  color={clause.priority === "High" ? "red" : "blue"}
                >
                  {clause.priority}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>

        <Title order={2} mt={20} mb={10}>
          Risk Analysis
        </Title>
        <Stack gap="md" mt={10}>
          {data.riskAnalysis.map((risk) => (
            <Card key={risk} padding="md" shadow="xs" radius="md">
              <Text size="md" fw={500}>
                {risk}
              </Text>
            </Card>
          ))}
        </Stack>

        <Title order={2} mt={20} mb={10}>
          Improvement Areas
        </Title>
        <Stack gap="md" mt={10}>
          {data.improvementAreas.map((area, idx) => (
            <Card key={area} padding="md" shadow="xs" radius="md">
              <Text size="md" fw={500}>
                {idx + 1}. {area}
              </Text>
            </Card>
          ))}
        </Stack>

        <Title order={2} mt={20} mb={10}>
          Negotiation Points
        </Title>
        <SimpleGrid cols={5} mt={10}>
          {data.negotiationPoints.map((point) => (
            <Card key={point} padding="md" shadow="xs" radius="md" withBorder>
              <Text size="md" fw={500}>
                {point}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={2} mt={20} mb={10}>
          Remediation Steps
        </Title>
        <Stack gap="md" mt={10}>
          {data.remediationSteps.map((step) => (
            <Card key={step} padding="md" shadow="xs" radius="md">
              <Text size="md" fw={500}>
                {step}
              </Text>
            </Card>
          ))}
        </Stack>
      </Modal>

      <Modal
        opened={opened}
        onClose={close}
        title="View Agreement"
        centered
        size={"70%"}
      >
        {/* show all agreement details */}
        <Group align="flex-start" gap="md" justify="space-between">
          <div className="max-w-md">
            <Text size="md" c="dimmed">
              Agreement Purpose
            </Text>
            <Text size="md" fw={500} mt={5}>
              {data.executiveSummary.agreementPurpose}
            </Text>
            <Text size="sm" c="dimmed" mt={10}>
              Parties Involved
            </Text>
            <Text size="md" fw={500} mt={5}>
              {data.executiveSummary.partiesInvolved.join(", ")}
            </Text>
            <Group mt={10}>
              <div>
                <Text size="sm" c="dimmed">
                  Effective Date
                </Text>
                <Text size="md" fw={500} mt={5}>
                  {data.executiveSummary.effectiveDate || "Not Specified"}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Expiry Date
                </Text>
                <Text size="md" fw={500} mt={5}>
                  {data.executiveSummary.expiryDate || "Not Specified"}
                </Text>
              </div>
            </Group>
          </div>
          <Stack gap="md" w={350}>
            <MultiSelectCheckbox
              reviewers={validReviewers}
              state={selectedReviewers}
              setState={setSelectedReviewers}
            />
            {/* list all selected reviwers */}
            {selectedReviewers.map((reviewer) => (
              <UnstyledButton key={reviewer.email}>
                <Group>
                  <Avatar
                    color={Math.floor(Math.random() * 15777215).toString(16)}
                  >
                    {reviewer.name
                      .split(" ")
                      .map((word: string) => word[0])
                      .join("")}
                  </Avatar>

                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {reviewer.name}
                    </Text>

                    <Text c="dimmed" size="xs">
                      {reviewer.email}
                    </Text>
                  </div>

                  <Badge color="blue">{reviewer.role}</Badge>
                  <IconX
                    size={18}
                    color="red"
                    onClick={() =>
                      setSelectedReviewers.filter(
                        (v) => v.email !== reviewer.email,
                      )
                    }
                  />
                </Group>
              </UnstyledButton>
            ))}

            <Button
              type="submit"
              onClick={() => onAddReviewer(selectedReviewers)}
              mt={10}
            >
              Add Reviewers
            </Button>
            {agreementReviewers &&
              agreementReviewers.map((reviewer) => (
                <UnstyledButton key={reviewer.email}>
                  <Group>
                    <Avatar
                      color={Math.floor(Math.random() * 15777215).toString(16)}
                    >
                      {reviewer.name
                        .split(" ")
                        .map((word: string) => word[0])
                        .join("")}
                    </Avatar>

                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {reviewer.name}
                      </Text>

                      <Text c="dimmed" size="xs">
                        {reviewer.email}
                      </Text>
                    </div>

                    <Badge color="blue">{reviewer.role}</Badge>
                    <IconX
                      size={18}
                      color="red"
                      onClick={() =>
                        setSelectedReviewers.filter(
                          (v) => v.email !== reviewer.email,
                        )
                      }
                    />
                  </Group>
                </UnstyledButton>
              ))}
          </Stack>
        </Group>
      </Modal>
      <Card withBorder padding="md" radius="md" shadow={"lg"}>
        <Group justify="space-between">
          {/* render badge color according to agreement status: draft, in-progress, active, expired, cancelled */}
          <Badge color={badgeColors[agreement.status]}>
            {agreement.status}
          </Badge>
          <Button variant="subtle" color="orange" onClick={aiOpen}>
            <IconBolt size={18} color="orange" /> AI Insights
          </Button>
        </Group>

        <Text fz="md" fw={500} mt="md">
          {agreement.title}
        </Text>
        <Text fz="xs" c="dimmed" mt={5}>
          {agreement.description}
        </Text>

        {agreement.status === "In-Review" && (
          <>
            <Text c="dimmed" fz="sm" mt="md">
              Reviews Completed:{" "}
              <Text span fw={500} c="bright">
                0/{agreementReviewers.length}
              </Text>
            </Text>
            <Progress value={(0 / agreementReviewers.length) * 100} mt={5} />
          </>
        )}

        <Group justify="space-between" mt="md">
          <Button variant="outline" color="orange" onClick={open}>
            View
          </Button>
          {isReview && (
            <Link href={url as string} target="_blank">
              <Button variant="outline" color="orange">
                Sign
              </Button>
            </Link>
          )}
          {agreement.filepath && (
            <Link href={downloadAgreement(agreement.filepath)} download>
              <ActionIcon variant="default" size="lg" radius="md">
                <IconDownload size={18} />
              </ActionIcon>
            </Link>
          )}
        </Group>
      </Card>
    </>
  );
}
