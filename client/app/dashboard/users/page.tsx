"use client";

import { useEffect, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import {
  Avatar,
  Badge,
  Button,
  Center,
  Group,
  keys,
  Modal,
  NativeSelect,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import classes from "./TableSort.module.css";
import { createClient } from "@/utils/supabase/client";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";

interface RowData {
  name: string;
  email: string;
  role: string;
  status: string;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toLowerCase().includes(query)),
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string },
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return b[sortBy].localeCompare(a[sortBy]);
      }

      return a[sortBy].localeCompare(b[sortBy]);
    }),
    payload.search,
  );
}

export default function TableSort() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [sortedData, setSortedData] = useState(users);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(users, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(
      sortData(users, {
        sortBy,
        reversed: reverseSortDirection,
        search: value,
      }),
    );
  };

  async function fetchData() {
    console.log(":fetchData");
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

    const { data, error } = await supabase.from("users").select("*");

    console.log(":data", data);

    if (error) {
      notifications.show({
        title: "Users Not Found",
        message: "Error fetching users",
        color: "red",
        autoClose: 5000,
      });
      return;
    }
    // add status field to each user on the basis of user_id field, if it is present, then Active else Invitation sent
    data.forEach((user: any) => {
      user.status = user.user_id ? "Active" : "Invitation sent";
    });
    setUsers(data);
    setSortedData(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const rows = sortedData.map((row) => (
    <Table.Tr key={row.name}>
      <Table.Td>
        <Group gap="xs">
          {/* add a random vibnrant color to avatar */}
          <Avatar color={Math.floor(Math.random() * 15777215).toString(16)}>
            {row.name
              .split(" ")
              .map((word: any[]) => word[0])
              .join("")}
          </Avatar>
          {row.name}
        </Group>
      </Table.Td>
      <Table.Td>{row.email}</Table.Td>
      <Table.Td>{row.role}</Table.Td>
      <Table.Td>
        <Badge
          color={row.status === "Active" ? "teal" : "blue"}
          variant={row.status === "Active" ? "dot" : "outline"}
        >
          {row.status}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      email: "",
      role: "sales",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  async function onAddUser(values: {
    name: string;
    email: string;
    role: string;
  }): Promise<void> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("users").insert([
      {
        name: values.name,
        email: values.email,
        role: values.role,
      },
    ]);

    if (error) {
      notifications.show({
        title: "Error",
        message: "Failed to add user" + error.message,
        color: "red",
        autoClose: 5000,
      });
      return;
    }

    notifications.show({
      title: "Success",
      message: "User invited successfully",
      color: "green",
      autoClose: 5000,
    });

    if (data) {
      setUsers((prevUsers) => [...prevUsers, ...data]);
    }
    if (data) {
      setSortedData((prevUsers) => [...prevUsers, ...data]);
    }
  }
  return (
    <ScrollArea>
      <Modal opened={opened} onClose={close} title="Add User" centered>
        <Stack gap="md">
          <form onSubmit={form.onSubmit((values) => onAddUser(values))}>
            <TextInput
              withAsterisk
              label="Full Name"
              placeholder="John Doe"
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
            <TextInput
              withAsterisk
              label="Email"
              placeholder="your@email.com"
              key={form.key("email")}
              {...form.getInputProps("email")}
            />

            <NativeSelect
              label="Select User Role"
              key={form.key("role")}
              data={[
                "Sales",
                "Marketing",
                "Legal",
                "Finance",
                "Operations",
                "HR",
                "Compliance",
                "Engineering",
              ]}
              {...form.getInputProps("agreementType")}
            />
            <Button type="submit" onClick={close} mt={10}>
              Add User
            </Button>
          </form>
        </Stack>
      </Modal>
      <Group justify="space-between">
        <div className="flex flex-col">
          <Title order={1}>Users</Title>
          <Text size="lg" mt={5} mb={20}>
            Here you can see all the users and their roles.
          </Text>
        </div>
        <Button onClick={open}>Invite User</Button>
      </Group>
      <TextInput
        placeholder="Search by any field"
        mb="md"
        leftSection={<IconSearch size={16} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      />
      {!loading && (
        <Table
          horizontalSpacing="md"
          verticalSpacing="xs"
          miw={700}
          layout="fixed"
        >
          <Table.Tbody>
            <Table.Tr>
              <Th
                sorted={sortBy === "name"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("name")}
              >
                Name
              </Th>
              <Th
                sorted={sortBy === "email"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("email")}
              >
                Email
              </Th>
              <Th
                sorted={sortBy === "role"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("role")}
              >
                Role
              </Th>
              <Th
                sorted={sortBy === "status"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("status")}
              >
                Status
              </Th>
            </Table.Tr>
          </Table.Tbody>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={Object.keys(users[0]).length}>
                  <Text fw={500} ta="center">
                    Nothing found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}
    </ScrollArea>
  );
}
